import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  proto
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import axios from "axios";
import pino from "pino";
import { mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

export type SessionStatus = "pending" | "qr_ready" | "connecting" | "connected" | "disconnected" | "error";

export interface SessionConfig {
  id: string;
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
}

const sessionsDir = process.env.SESSIONS_DIR || join(process.cwd(), "sessions");
const activeSockets = new Map<string, WASocket>();
const sessionConfigs = new Map<string, SessionConfig>();
const baileysLogger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || "silent" });

async function getSessionDir(sessionId: string) {
  const dir = join(sessionsDir, sessionId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

export async function createSession(config: Omit<SessionConfig, "id" | "status" | "createdAt">): Promise<SessionConfig> {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const session: SessionConfig = {
    ...config,
    id,
    status: "pending",
    createdAt: Date.now()
  };
  sessionConfigs.set(id, session);
  console.log("[SESSION] Created:", id, "Total:", sessionConfigs.size);
  return session;
}

export function getSession(id: string): SessionConfig | undefined {
  console.log("[SESSION] Get:", id, "Found:", sessionConfigs.has(id), "Total:", sessionConfigs.size);
  return sessionConfigs.get(id);
}

export function getAllSessions(): SessionConfig[] {
  return Array.from(sessionConfigs.values());
}

export function updateSession(id: string, updates: Partial<SessionConfig>): SessionConfig | undefined {
  const session = sessionConfigs.get(id);
  if (!session) return undefined;
  const updated = { ...session, ...updates };
  sessionConfigs.set(id, updated);
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
  if (!session || !session.webhookUrl) return;

  const from = msg.key?.remoteJid?.split("@")[0] || "";
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    "";

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

  try {
    await axios.post(session.webhookUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
      validateStatus: () => true
    });
  } catch {
    // webhook delivery failed - could add retry logic here
  }
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
