import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export type SessionContactProfile = {
  remoteJid: string;
  displayName?: string;
  phoneNumber: string;
  updatedAt: number;
  lastMessageAt?: number;
};

type ContactProfileRuntimeStore = {
  profilesBySession: Map<string, Map<string, SessionContactProfile>>;
  loadedSessions: Set<string>;
  writeQueueBySession: Map<string, Promise<void>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __whatsflowContactProfileRuntime: ContactProfileRuntimeStore | undefined;
}

function createContactProfileRuntimeStore(): ContactProfileRuntimeStore {
  return {
    profilesBySession: new Map<string, Map<string, SessionContactProfile>>(),
    loadedSessions: new Set<string>(),
    writeQueueBySession: new Map<string, Promise<void>>()
  };
}

const runtimeStore =
  globalThis.__whatsflowContactProfileRuntime ??
  (globalThis.__whatsflowContactProfileRuntime = createContactProfileRuntimeStore());

function getSessionDirectory(sessionId: string): string {
  return join(process.cwd(), "sessions", sessionId);
}

function getContactProfilesPath(sessionId: string): string {
  return join(getSessionDirectory(sessionId), "contacts.json");
}

function normalizeDisplayName(value?: string | null): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function normalizePhoneDigits(value?: string | null): string {
  return (value || "").replace(/\D/g, "");
}

export function getPhoneNumberFromJid(jid?: string | null): string {
  return (jid || "").split("@")[0] || "";
}

function getReverseLidMappingPath(sessionId: string, lidDigits: string): string {
  return join(getSessionDirectory(sessionId), `lid-mapping-${lidDigits}_reverse.json`);
}

async function readJsonStringFile(filePath: string): Promise<string | undefined> {
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed === "string") {
      return parsed;
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const firstString = Object.values(record).find((value) => typeof value === "string");
      return typeof firstString === "string" ? firstString : undefined;
    }
  } catch (error) {
    console.error("[CONTACTS] Failed to read reverse LID mapping:", error);
  }

  return undefined;
}

export async function resolveSessionPhoneNumber(input: {
  sessionId: string;
  remoteJid?: string | null;
  fallbackPhoneNumber?: string | null;
}): Promise<string> {
  const jidDigits = normalizePhoneDigits(getPhoneNumberFromJid(input.remoteJid));
  const fallbackDigits = normalizePhoneDigits(input.fallbackPhoneNumber);

  if (!input.remoteJid) {
    return fallbackDigits;
  }

  if (input.remoteJid.endsWith("@s.whatsapp.net")) {
    return jidDigits || fallbackDigits;
  }

  if (input.remoteJid.endsWith("@lid") || input.remoteJid.endsWith("@hosted.lid")) {
    const mappedPhone = await readJsonStringFile(
      getReverseLidMappingPath(input.sessionId, jidDigits)
    );
    return normalizePhoneDigits(mappedPhone) || fallbackDigits || jidDigits;
  }

  return fallbackDigits || jidDigits;
}

export function getBestContactName(input: {
  displayName?: string | null;
  fallbackPhoneNumber?: string | null;
}): string {
  const displayName = normalizeDisplayName(input.displayName);
  if (displayName && !/^\+?\d+$/.test(displayName.replace(/\s+/g, ""))) {
    return displayName;
  }

  return input.fallbackPhoneNumber ? "WhatsApp contact" : "Unknown contact";
}

async function loadSessionProfiles(sessionId: string): Promise<Map<string, SessionContactProfile>> {
  if (runtimeStore.loadedSessions.has(sessionId)) {
    return runtimeStore.profilesBySession.get(sessionId) || new Map();
  }

  const filePath = getContactProfilesPath(sessionId);
  const profiles = new Map<string, SessionContactProfile>();

  if (existsSync(filePath)) {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, SessionContactProfile>;

      for (const [remoteJid, profile] of Object.entries(parsed)) {
        const resolvedPhoneNumber = await resolveSessionPhoneNumber({
          sessionId,
          remoteJid,
          fallbackPhoneNumber: profile.phoneNumber
        });

        profiles.set(remoteJid, {
          remoteJid,
          displayName: normalizeDisplayName(profile.displayName),
          phoneNumber: resolvedPhoneNumber || getPhoneNumberFromJid(remoteJid),
          updatedAt: profile.updatedAt || Date.now(),
          lastMessageAt: profile.lastMessageAt
        });
      }
    } catch (error) {
      console.error("[CONTACTS] Failed to load contact profiles:", error);
    }
  }

  runtimeStore.profilesBySession.set(sessionId, profiles);
  runtimeStore.loadedSessions.add(sessionId);
  return profiles;
}

async function persistSessionProfiles(sessionId: string): Promise<void> {
  const profiles = runtimeStore.profilesBySession.get(sessionId) || new Map();
  const filePath = getContactProfilesPath(sessionId);
  const previousWrite = runtimeStore.writeQueueBySession.get(sessionId) || Promise.resolve();

  const nextWrite = previousWrite
    .catch(() => undefined)
    .then(async () => {
      await mkdir(getSessionDirectory(sessionId), { recursive: true });
      const serialized = Object.fromEntries(
        Array.from(profiles.entries()).map(([remoteJid, profile]) => [
          remoteJid,
          {
            ...profile,
            displayName: normalizeDisplayName(profile.displayName),
            phoneNumber: profile.phoneNumber || getPhoneNumberFromJid(remoteJid)
          }
        ])
      );

      await writeFile(filePath, JSON.stringify(serialized, null, 2), "utf8");
    });

  runtimeStore.writeQueueBySession.set(sessionId, nextWrite);

  try {
    await nextWrite;
  } finally {
    if (runtimeStore.writeQueueBySession.get(sessionId) === nextWrite) {
      runtimeStore.writeQueueBySession.delete(sessionId);
    }
  }
}

export async function rememberSessionContactProfile(input: {
  sessionId: string;
  remoteJid: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  lastMessageAt?: number;
}): Promise<SessionContactProfile> {
  const profiles = await loadSessionProfiles(input.sessionId);
  const existing = profiles.get(input.remoteJid);
  const resolvedPhoneNumber = await resolveSessionPhoneNumber({
    sessionId: input.sessionId,
    remoteJid: input.remoteJid,
    fallbackPhoneNumber: input.phoneNumber || existing?.phoneNumber
  });

  const nextProfile: SessionContactProfile = {
    remoteJid: input.remoteJid,
    displayName:
      normalizeDisplayName(input.displayName) || existing?.displayName || undefined,
    phoneNumber: resolvedPhoneNumber || getPhoneNumberFromJid(input.remoteJid),
    updatedAt: Date.now(),
    lastMessageAt:
      input.lastMessageAt || existing?.lastMessageAt || Date.now()
  };

  profiles.set(input.remoteJid, nextProfile);
  await persistSessionProfiles(input.sessionId);
  return nextProfile;
}

export async function getSessionContactProfiles(
  sessionId: string
): Promise<Record<string, SessionContactProfile>> {
  const profiles = await loadSessionProfiles(sessionId);
  return Object.fromEntries(profiles.entries());
}
