import { existsSync } from "fs";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataSet,
  SignalDataTypeMap,
  SignalKeyStore
} from "@whiskeysockets/baileys";
import pino from "pino";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AuthCredentialRow = {
  creds_json: unknown;
};

type AuthKeyRow = {
  key_id: string;
  value_json: unknown;
};

type AuthStateRuntime = {
  forceLocalFiles: boolean;
  checkedDatabaseAccess: boolean;
  storageSchema: "private" | "public" | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __whatsflowAuthStateRuntime: AuthStateRuntime | undefined;
}

const authRuntime =
  globalThis.__whatsflowAuthStateRuntime ??
  (globalThis.__whatsflowAuthStateRuntime = {
    forceLocalFiles: false,
    checkedDatabaseAccess: false,
    storageSchema: null
  });

const authLogger = pino({
  level: process.env.WHATSAPP_LOG_LEVEL || "silent"
});

const localSessionsRoot =
  process.env.WHATSFLOW_AUTH_STATE_DIR?.trim() ||
  (process.env.VERCEL || process.env.RENDER
    ? join("/tmp", "whatsflow-sessions")
    : join(process.cwd(), "sessions"));

type BaileysModule = typeof import("@whiskeysockets/baileys");

let baileysModulePromise: Promise<BaileysModule> | null = null;

async function loadBaileysModule(): Promise<BaileysModule> {
  if (!baileysModulePromise) {
    baileysModulePromise = import("@whiskeysockets/baileys");
  }

  return baileysModulePromise;
}

async function serializeForJson(value: unknown): Promise<unknown> {
  const { BufferJSON } = await loadBaileysModule();
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer));
}

async function deserializeFromJson<T>(value: unknown): Promise<T> {
  const { BufferJSON } = await loadBaileysModule();
  return JSON.parse(JSON.stringify(value), BufferJSON.reviver) as T;
}

async function createFreshCreds(): Promise<AuthenticationCreds> {
  const { initAuthCreds } = await loadBaileysModule();
  return initAuthCreds();
}

function getSchemaClient(schema: "private" | "public") {
  const client = getSupabaseAdminClient() as any;
  return schema === "private" ? client.schema("private") : client;
}

function getAuthStateClient() {
  if (!authRuntime.storageSchema) {
    throw new Error("WhatsApp auth-state database storage is not available.");
  }

  return getSchemaClient(authRuntime.storageSchema);
}

function isSchemaAccessError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code || "") : "";
  const message = "message" in error ? String(error.message || "") : "";
  return (
    code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("public.private.") ||
    message.includes("Could not find the table")
  );
}

function enableLocalFileFallback(reason: string, error?: unknown) {
  if (!authRuntime.forceLocalFiles) {
    console.warn(`[AUTH_STATE] Falling back to local file auth storage: ${reason}`);
    if (error) {
      console.warn("[AUTH_STATE] Fallback reason details:", error);
    }
  }

  authRuntime.forceLocalFiles = true;
}

async function getLocalSessionDir(sessionId: string): Promise<string> {
  const dir = join(localSessionsRoot, sessionId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

async function hasLocalAuthState(sessionId: string): Promise<boolean> {
  return existsSync(join(localSessionsRoot, sessionId, "creds.json"));
}

async function deleteLocalAuthState(sessionId: string): Promise<void> {
  const dir = join(localSessionsRoot, sessionId);
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
}

async function loadLocalAuthState(sessionId: string): Promise<{
  saveCreds: () => Promise<void>;
  state: AuthenticationState;
}> {
  const dir = await getLocalSessionDir(sessionId);
  const { useMultiFileAuthState } = await loadBaileysModule();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMultiFileAuthState(dir);
}

async function ensureDatabaseAuthStateAccess(): Promise<boolean> {
  if (authRuntime.forceLocalFiles) {
    return false;
  }

  if (authRuntime.checkedDatabaseAccess) {
    return Boolean(authRuntime.storageSchema);
  }

  let lastError: unknown;

  for (const schema of ["private", "public"] as const) {
    try {
      const { error } = await getSchemaClient(schema)
        .from("whatsapp_session_credentials")
        .select("session_id")
        .limit(1);

      if (!error) {
        authRuntime.storageSchema = schema;
        authRuntime.checkedDatabaseAccess = true;

        if (schema === "public") {
          console.warn(
            "[AUTH_STATE] Using public protected auth-state tables because the private schema is not exposed to the Supabase Data API."
          );
        }

        return true;
      }

      lastError = error;
    } catch (error) {
      lastError = error;
    }
  }

  authRuntime.checkedDatabaseAccess = true;
  authRuntime.storageSchema = null;
  enableLocalFileFallback("database auth-state tables are not available", lastError);
  return false;
}

export async function hasSavedAuthState(sessionId: string): Promise<boolean> {
  if (!(await ensureDatabaseAuthStateAccess())) {
    return hasLocalAuthState(sessionId);
  }

  const { data, error } = await getAuthStateClient()
    .from("whatsapp_session_credentials")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    if (isSchemaAccessError(error)) {
      enableLocalFileFallback("credential lookup failed against auth-state tables", error);
      return hasLocalAuthState(sessionId);
    }

    console.error("[AUTH_STATE] Failed to check credentials:", error);
    return false;
  }

  return Boolean(data);
}

export async function deleteSavedAuthState(sessionId: string): Promise<void> {
  if (!(await ensureDatabaseAuthStateAccess())) {
    await deleteLocalAuthState(sessionId);
    return;
  }

  const authStateDb = getAuthStateClient();
  const credentialDelete = authStateDb
    .from("whatsapp_session_credentials")
    .delete()
    .eq("session_id", sessionId);

  const keyDelete = authStateDb
    .from("whatsapp_session_keys")
    .delete()
    .eq("session_id", sessionId);

  const [{ error: credentialError }, { error: keyError }] = await Promise.all([
    credentialDelete,
    keyDelete
  ]);

  if (credentialError || keyError) {
    if (isSchemaAccessError(credentialError) || isSchemaAccessError(keyError)) {
      enableLocalFileFallback("credential cleanup failed against auth-state tables", credentialError || keyError);
      await deleteLocalAuthState(sessionId);
      return;
    }
  }

  if (credentialError) {
    console.error("[AUTH_STATE] Failed to delete credentials:", credentialError);
  }

  if (keyError) {
    console.error("[AUTH_STATE] Failed to delete keys:", keyError);
  }

  await deleteLocalAuthState(sessionId);
}

async function loadCreds(sessionId: string): Promise<AuthenticationCreds> {
  const { data, error } = await getAuthStateClient()
    .from("whatsapp_session_credentials")
    .select("creds_json")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    if (isSchemaAccessError(error)) {
      enableLocalFileFallback("failed to read credentials from auth-state tables", error);
    } else {
      console.error("[AUTH_STATE] Failed to load credentials:", error);
    }

    return createFreshCreds();
  }

  if (!data) {
    return createFreshCreds();
  }

  return deserializeFromJson<AuthenticationCreds>(
    (data as AuthCredentialRow).creds_json
  );
}

async function createSignalKeyStore(sessionId: string): Promise<SignalKeyStore> {
  const { makeCacheableSignalKeyStore, proto } = await loadBaileysModule();
  const baseStore: SignalKeyStore = {
    async get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]) {
      const result: Partial<Record<string, SignalDataTypeMap[T]>> = {};

      if (ids.length === 0) {
        return result as Record<string, SignalDataTypeMap[T]>;
      }

      const { data, error } = await getAuthStateClient()
        .from("whatsapp_session_keys")
        .select("key_id, value_json")
        .eq("session_id", sessionId)
        .eq("key_type", type)
        .in("key_id", ids);

      if (error) {
        if (isSchemaAccessError(error)) {
          enableLocalFileFallback(`failed to load signal keys for ${type}`, error);
        } else {
          console.error(`[AUTH_STATE] Failed to load keys for ${type}:`, error);
        }

        return result as Record<string, SignalDataTypeMap[T]>;
      }

      for (const row of (data || []) as AuthKeyRow[]) {
        let value = await deserializeFromJson<SignalDataTypeMap[T]>(row.value_json);

        if (type === "app-state-sync-key" && value) {
          value = proto.Message.AppStateSyncKeyData.fromObject(
            value as Record<string, unknown>
          ) as unknown as SignalDataTypeMap[T];
        }

        result[row.key_id] = value;
      }

      return result as Record<string, SignalDataTypeMap[T]>;
    },
    async set(data: SignalDataSet) {
      const upserts: Record<string, unknown>[] = [];
      const deletes: Array<{ key_type: string; key_id: string }> = [];

      for (const keyType in data) {
        const scopedEntries = data[keyType as keyof SignalDataSet];
        if (!scopedEntries) {
          continue;
        }

        for (const keyId in scopedEntries) {
          const value = scopedEntries[keyId];

          if (value) {
            upserts.push({
              session_id: sessionId,
              key_type: keyType,
              key_id: keyId,
              value_json: await serializeForJson(value)
            });
          } else {
            deletes.push({
              key_type: keyType,
              key_id: keyId
            });
          }
        }
      }

      if (upserts.length > 0) {
        const { error } = await getAuthStateClient()
          .from("whatsapp_session_keys")
          .upsert(upserts, {
            onConflict: "session_id,key_type,key_id"
          });

        if (error) {
          if (isSchemaAccessError(error)) {
            enableLocalFileFallback("failed to upsert signal keys into auth-state tables", error);
          } else {
            console.error("[AUTH_STATE] Failed to upsert keys:", error);
          }
        }
      }

      for (const item of deletes) {
        const { error } = await getAuthStateClient()
          .from("whatsapp_session_keys")
          .delete()
          .eq("session_id", sessionId)
          .eq("key_type", item.key_type)
          .eq("key_id", item.key_id);

        if (error) {
          if (isSchemaAccessError(error)) {
            enableLocalFileFallback("failed to delete signal key from auth-state tables", error);
          } else {
            console.error("[AUTH_STATE] Failed to delete key:", error);
          }
        }
      }
    },
    async clear() {
      const { error } = await getAuthStateClient()
        .from("whatsapp_session_keys")
        .delete()
        .eq("session_id", sessionId);

      if (error) {
        if (isSchemaAccessError(error)) {
          enableLocalFileFallback("failed to clear signal keys in auth-state tables", error);
        } else {
          console.error("[AUTH_STATE] Failed to clear keys:", error);
        }
      }
    }
  };

  return makeCacheableSignalKeyStore(baseStore, authLogger);
}

export async function loadSupabaseAuthState(sessionId: string): Promise<{
  saveCreds: () => Promise<void>;
  state: AuthenticationState;
}> {
  if (!(await ensureDatabaseAuthStateAccess())) {
    return loadLocalAuthState(sessionId);
  }

  const creds = await loadCreds(sessionId);

  if (authRuntime.forceLocalFiles) {
    return loadLocalAuthState(sessionId);
  }

  const keyStore = await createSignalKeyStore(sessionId);

  return {
    state: {
      creds,
      keys: keyStore
    },
    saveCreds: async () => {
      const { error } = await getAuthStateClient()
        .from("whatsapp_session_credentials")
        .upsert(
          {
            session_id: sessionId,
            creds_json: await serializeForJson(creds)
          },
          {
            onConflict: "session_id"
          }
        );

      if (error) {
        if (isSchemaAccessError(error)) {
          enableLocalFileFallback("failed to save credentials into auth-state tables", error);
        } else {
          console.error("[AUTH_STATE] Failed to save credentials:", error);
        }
      }
    }
  };
}
