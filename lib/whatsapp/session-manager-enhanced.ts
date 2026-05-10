/**
 * Enhanced Session Manager
 * Combines supabase-session-manager with webhook-manager for complete integration
 */

import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  proto
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import pino from "pino";
import { queueWebhookDelivery } from "./webhook-manager";

export type SessionStatus = "pending" | "qr_ready" | "connecting" | "connected" | "disconnected" | "error";

export interface SessionConfig {
  id: string;
  userId: string;
  name: string;
  countryCode: string;
  phone: string;
  webhookUrl?: string;
  status: SessionStatus;
  qrCode?: string;
  connectedPhone?: string;
  connectedName?: string;
  device?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

const sessionsDir = join(process.cwd(), "sessions");
const activeSockets = new Map<string, WASocket>();
const sessionConfigs = new Map<string, SessionConfig>();
const baileysLogger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || "silent" });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

async function getSessionDir(sessionId: string) {
  const dir = join(sessionsDir, sessionId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

async function saveSessionToDb(session: SessionConfig): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.from("whatsapp_sessions").upsert({
      id: session.id,
      user_id: session.userId,
      name: session.name,
      phone_number: session.phone,
      status: session.status,
      qr_code: session.qrCode,
      webhook_url: session.webhookUrl,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error("[DB] Error saving session:", error);
    }
  } catch (err) {
    console.error("[DB] Failed to save session:", err);
  }
}

export async function createSession(
  config: Omit<SessionConfig, "id" | "status" | "createdAt" | "updatedAt">
): Promise<SessionConfig> {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  const session: SessionConfig = {
    ...config,
    id,
    status: "pending",
    createdAt: now,
    updatedAt: now
  };

  sessionConfigs.set(id, session);
  await saveSessionToDb(session);

  console.log("[SESSION] Created:", id, "Total:", sessionConfigs.size);
  return session;
}

export function getSession(id: string): SessionConfig | undefined {
  return sessionConfigs.get(id);
}

export function getAllSessions(): SessionConfig[] {
  return Array.from(sessionConfigs.values());
}

export function updateSession(id: string, updates: Partial<SessionConfig>): SessionConfig | undefined {
  const session = sessionConfigs.get(id);
  if (!session) return undefined;

  const updated = {
    ...session,
    ...updates,
    updatedAt: Date.now()
  };

  sessionConfigs.set(id, updated);
  saveSessionToDb(updated).catch(console.error);

  return updated;
}

export async function deleteSession(id: string): Promise<boolean> {
  const socket = activeSockets.get(id);
  if (socket) {
    try {
      socket.end(undefined);
    } catch {
      // ignore
    }
    activeSockets.delete(id);
  }

  sessionConfigs.delete(id);

  if (supabase) {
    try {
      await supabase.from("whatsapp_sessions").delete().eq("id", id);
    } catch (err) {
      console.error("[DB] Failed to delete session from DB:", err);
    }
  }

  const dir = join(sessionsDir, id);
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true });
  }

  return true;
}

export async function startSessionConnection(id: string): Promise<void> {
  const session = sessionConfigs.get(id);
  if (!session) throw new Error("Session not found");

  const existing = activeSockets.get(id);
  if (existing) {
    try {
      existing.end(undefined);
    } catch {
      // ignore
    }
    activeSockets.delete(id);
  }

  const sessionDir = await getSessionDir(id);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: baileysLogger,
    printQRInTerminal: false,
    auth: state,
    browser: ["WhatsFlow", "Chrome", "1.0.0"],
    markOnlineOnConnect: true,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 2500,
    fireInitQueries: true,
    shouldSyncHistoryMessage: () => false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true
  });

  activeSockets.set(id, sock);
  updateSession(id, { status: "connecting", qrCode: undefined });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, {
          margin: 2,
          width: 400,
          color: { dark: "#000", light: "#fff" }
        });
        updateSession(id, { status: "qr_ready", qrCode: qrDataUrl });
      } catch {
        updateSession(id, { status: "qr_ready" });
      }
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (!shouldReconnect) {
        updateSession(id, { status: "disconnected", qrCode: undefined });
        activeSockets.delete(id);
        await rm(sessionDir, { recursive: true, force: true }).catch(() => null);
      } else {
        updateSession(id, { status: "error", error: "Connection closed unexpectedly" });
        activeSockets.delete(id);
      }
    } else if (connection === "open") {
      try {
        const user = sock.user;
        updateSession(id, {
          status: "connected",
          qrCode: undefined,
          connectedPhone: user?.id ? user.id.split(":")[0] : session.phone,
          connectedName: user?.name || session.name,
          device: "Linked Device"
        });
      } catch {
        updateSession(id, { status: "connected", qrCode: undefined });
      }
    }
  });

  sock.ev.on("messages.upsert", async (upsert) => {
    if (upsert.type !== "notify") return;

    for (const msg of upsert.messages) {
      if (msg.key && !msg.key.fromMe && msg.key.remoteJid && msg.key.remoteJid.endsWith("@s.whatsapp.net")) {
        await handleIncomingMessage(id, msg);
      }
    }
  });
}

async function handleIncomingMessage(sessionId: string, msg: proto.IWebMessageInfo) {
  const session = sessionConfigs.get(sessionId);
  if (!session) return;

  const from = msg.key?.remoteJid?.split("@")[0] || "";
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    "";

  // Save message to database
  if (supabase) {
    try {
      await supabase.from("messages").insert({
        session_id: sessionId,
        user_id: session.userId,
        direction: "inbound",
        remote_jid: msg.key?.remoteJid || "",
        message_type: getMessageType(msg),
        body: text,
        status: "received",
        external_message_id: msg.key?.id
      });
    } catch (err) {
      console.error("[DB] Failed to log incoming message:", err);
    }
  }

  // Send webhook if configured
  if (!session.webhookUrl) return;

  const payload = {
    event: "message.received",
    timestamp: Date.now(),
    data: {
      sessionId,
      sessionName: session.name,
      message: {
        id: msg.key?.id || "",
        from,
        type: getMessageType(msg),
        text,
        raw: msg.message
      }
    }
  };

  // Queue webhook delivery with retry logic
  await queueWebhookDelivery(sessionId, session.webhookUrl, payload, 3);
}

function getMessageType(msg: proto.IWebMessageInfo): string {
  if (msg.message?.conversation) return "text";
  if (msg.message?.extendedTextMessage) return "text";
  if (msg.message?.imageMessage) return "image";
  if (msg.message?.videoMessage) return "video";
  if (msg.message?.audioMessage) return "audio";
  if (msg.message?.documentMessage) return "document";
  if (msg.message?.contactMessage) return "contact";
  if (msg.message?.locationMessage) return "location";
  return "unknown";
}

export async function disconnectSession(id: string): Promise<void> {
  const socket = activeSockets.get(id);
  if (socket) {
    try {
      socket.logout();
    } catch {
      // ignore
    }
    activeSockets.delete(id);
  }
  updateSession(id, { status: "disconnected", qrCode: undefined });
}

export function getSocket(id: string): WASocket | undefined {
  return activeSockets.get(id);
}
