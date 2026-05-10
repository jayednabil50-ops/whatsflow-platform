import { requireActiveWorkspace, WorkspaceAccessError } from "@/lib/platform/workspace";
import {
  authenticateSessionApiKey,
  type SessionApiKeyAuth
} from "@/lib/whatsapp/api-keys";
import {
  getSessionContactProfiles,
  getPhoneNumberFromJid,
  resolveSessionPhoneNumber,
  type SessionContactProfile
} from "@/lib/whatsapp/contact-profiles";

export class PublicApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicApiRequestError";
    this.status = status;
  }
}

export function getBearerToken(request: Request): string {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice("Bearer ".length).trim() : "";
}

export async function requirePublicApiSession(
  request: Request
): Promise<SessionApiKeyAuth> {
  const token = getBearerToken(request);
  if (!token) {
    throw new PublicApiRequestError("Missing bearer token.", 401);
  }

  const session = await authenticateSessionApiKey(token);
  if (!session) {
    throw new PublicApiRequestError("Invalid API key.", 401);
  }

  try {
    await requireActiveWorkspace(session.userId);
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      throw new PublicApiRequestError(error.message, error.status);
    }

    throw error;
  }

  return session;
}

export function normalizePhoneDigits(value?: string | null): string {
  return (value || "").replace(/\D/g, "");
}

export async function listPublicApiContacts(sessionId: string): Promise<
  Array<
    SessionContactProfile & {
      resolvedPhoneNumber: string;
    }
  >
> {
  const contacts = await getSessionContactProfiles(sessionId);
  const rows = await Promise.all(
    Object.values(contacts).map(async (contact) => ({
      ...contact,
      resolvedPhoneNumber: await resolveSessionPhoneNumber({
        sessionId,
        remoteJid: contact.remoteJid,
        fallbackPhoneNumber: contact.phoneNumber
      })
    }))
  );

  return rows.sort(
    (left, right) =>
      (right.lastMessageAt || right.updatedAt || 0) -
      (left.lastMessageAt || left.updatedAt || 0)
  );
}

export async function findPublicApiContact(
  sessionId: string,
  identifier: string
): Promise<
  | (SessionContactProfile & {
      resolvedPhoneNumber: string;
    })
  | null
> {
  const normalizedIdentifier = normalizePhoneDigits(identifier);
  const contacts = await listPublicApiContacts(sessionId);

  return (
    contacts.find((contact) => {
      const phoneDigits = normalizePhoneDigits(contact.resolvedPhoneNumber || contact.phoneNumber);
      const jidDigits = normalizePhoneDigits(getPhoneNumberFromJid(contact.remoteJid));

      return (
        contact.remoteJid === identifier ||
        (Boolean(normalizedIdentifier) &&
          (phoneDigits === normalizedIdentifier || jidDigits === normalizedIdentifier))
      );
    }) || null
  );
}

export async function resolvePublicApiTargetJid(
  sessionId: string,
  identifier: string
): Promise<string> {
  const direct = identifier.trim();
  if (!direct) {
    throw new PublicApiRequestError("A valid contact identifier is required.", 400);
  }

  if (direct.includes("@")) {
    return direct;
  }

  const contact = await findPublicApiContact(sessionId, direct);
  if (contact) {
    return contact.remoteJid;
  }

  const digits = normalizePhoneDigits(direct);
  if (digits.length < 7) {
    throw new PublicApiRequestError("A valid contact identifier is required.", 400);
  }

  return `${digits}@s.whatsapp.net`;
}
