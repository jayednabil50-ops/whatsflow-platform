import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type SessionApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  status: string;
  phone_number: string;
  country_code: string | null;
  connected_phone: string | null;
  connected_name: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  api_key_hash: string | null;
  api_key_prefix: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionApiKeyPreview = {
  sessionId: string;
  sessionName: string;
  status: string;
  prefix: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionApiKeyAuth = {
  id: string;
  userId: string;
  name: string;
  status: string;
  phone: string;
  countryCode: string;
  connectedPhone?: string;
  connectedName?: string;
  webhookUrl?: string;
  webhookSecret?: string;
};

const API_KEY_PREFIX_LENGTH = 16;

export function hashApiKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createSessionApiKey(): { token: string; prefix: string; hash: string } {
  const token = `wfk_live_${randomBytes(24).toString("hex")}`;
  return {
    token,
    prefix: token.slice(0, API_KEY_PREFIX_LENGTH),
    hash: hashApiKey(token)
  };
}

export async function rotateSessionApiKey(sessionId: string, userId: string): Promise<{
  token: string;
  prefix: string;
}> {
  const generated = createSessionApiKey();

  const { error } = await getSupabaseAdminClient()
    .from("whatsapp_sessions")
    .update({
      api_key_hash: generated.hash,
      api_key_prefix: generated.prefix
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to rotate the session API key.");
  }

  return {
    token: generated.token,
    prefix: generated.prefix
  };
}

export async function removeSessionApiKey(sessionId: string, userId: string): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from("whatsapp_sessions")
    .update({
      api_key_hash: null,
      api_key_prefix: null
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to revoke the session API key.");
  }
}

export async function listSessionApiKeys(userId: string): Promise<SessionApiKeyPreview[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from("whatsapp_sessions")
    .select("id, name, status, api_key_prefix, created_at, updated_at")
    .eq("user_id", userId)
    .not("api_key_hash", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load API keys.");
  }

  return ((data || []) as Array<{
    id: string;
    name: string;
    status: string;
    api_key_prefix: string | null;
    created_at: string;
    updated_at: string;
  }>).map((row) => ({
    sessionId: row.id,
    sessionName: row.name,
    status: row.status,
    prefix: row.api_key_prefix,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function authenticateSessionApiKey(rawToken: string): Promise<SessionApiKeyAuth | null> {
  const hash = hashApiKey(rawToken);

  const { data, error } = await getSupabaseAdminClient()
    .from("whatsapp_sessions")
    .select(
      "id, user_id, name, status, phone_number, country_code, connected_phone, connected_name, webhook_url, webhook_secret, api_key_hash, api_key_prefix, created_at, updated_at"
    )
    .eq("api_key_hash", hash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as SessionApiKeyRow;
  if (!row.api_key_hash) {
    return null;
  }

  const stored = Buffer.from(row.api_key_hash, "utf8");
  const incoming = Buffer.from(hash, "utf8");

  if (stored.length !== incoming.length || !timingSafeEqual(stored, incoming)) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    status: row.status,
    phone: row.phone_number,
    countryCode: row.country_code || "BD",
    connectedPhone: row.connected_phone || undefined,
    connectedName: row.connected_name || undefined,
    webhookUrl: row.webhook_url || undefined,
    webhookSecret: row.webhook_secret || undefined
  };
}
