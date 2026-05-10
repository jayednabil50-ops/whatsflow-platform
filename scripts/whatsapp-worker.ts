import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
loadLocalEnv(join(workspaceRoot, ".env.local"));

const workerPort = Number(process.env.WHATSFLOW_WORKER_PORT || 3101);
const workerSecret = (process.env.WHATSFLOW_WORKER_SECRET || "local-dev-worker-secret").trim();

function loadLocalEnv(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function isAuthorized(request: IncomingMessage): boolean {
  return request.headers["x-whatsflow-worker-secret"] === workerSecret;
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function readBody(request: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    request.on("error", reject);
  });
}

function extractTarget(body: Record<string, unknown>): string {
  const candidates = [body.remoteJid, body.jid, body.to];
  return (
    candidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    ) as string | undefined
  )?.trim() || "";
}

async function main(): Promise<void> {
  const sessionManager = await import("../lib/whatsapp/supabase-session-manager");
  const sendQueue = await import("../lib/whatsapp/send-queue");

  async function ensureLiveSession(sessionId: string): Promise<any> {
    const current = await sessionManager.ensureSessionConnection(sessionId);
    return (
      current ||
      sessionManager.getSession(sessionId) ||
      (await sessionManager.getSessionById(sessionId))
    );
  }

  function isSessionReadyForMessaging(session: any, liveSocket: any): boolean {
    return Boolean(session && session.status === "connected" && liveSocket?.user?.id);
  }

  const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");

  if (url.pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: "Worker authorization failed." });
    return;
  }

  const match = url.pathname.match(/^\/sessions\/([0-9a-f-]+)\/([a-z-]+)$/i);
  const deleteMatch = url.pathname.match(/^\/sessions\/([0-9a-f-]+)$/i);

  try {
    if (match) {
      const [, sessionId, action] = match;

      if (request.method === "POST" && action === "start") {
        await sessionManager.startSessionConnection(
          sessionId,
          url.searchParams.get("forceNewQr") === "1"
        );
        const session = await sessionManager.getSessionById(sessionId);
        sendJson(response, 200, {
          message: "Connection started",
          sessionId,
          status: session?.status || "connecting"
        });
        return;
      }

      if (request.method === "GET" && action === "qr") {
        const session = await sessionManager.getSessionById(sessionId);
        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        sendJson(response, 200, {
          id: session.id,
          status: session.status,
          qrCode: session.qrCode || null,
          connectedPhone: session.connectedPhone || null,
          connectedName: session.connectedName || null,
          device: session.device || null,
          error: session.error || null
        });
        return;
      }

      if (request.method === "GET" && action === "status") {
        const session = await ensureLiveSession(sessionId);
        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        sendJson(response, 200, session);
        return;
      }

      if (request.method === "POST" && action === "disconnect") {
        await sessionManager.disconnectSession(sessionId);
        sendJson(response, 200, { success: true, sessionId });
        return;
      }

      if (request.method === "POST" && action === "webhook") {
        const body = await readBody(request);
        const session = await sessionManager.setSessionWebhook(
          sessionId,
          typeof body.webhookUrl === "string" ? body.webhookUrl : null
        );

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        sendJson(response, 200, {
          success: true,
          sessionId,
          webhookUrl: session.webhookUrl || null
        });
        return;
      }

      if (request.method === "POST" && action === "revoke") {
        const body = await readBody(request);
        const session = await sessionManager.revokeSessionAccess(sessionId, {
          clearAuthState: body.clearAuthState !== false,
          reason:
            typeof body.reason === "string" && body.reason.trim().length > 0
              ? body.reason.trim()
              : undefined
        });

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        sendJson(response, 200, {
          success: true,
          sessionId,
          status: session.status
        });
        return;
      }

      if (request.method === "POST" && action === "send-message") {
        const body = await readBody(request);
        const session = await ensureLiveSession(sessionId);
        const liveSocket = sessionManager.getSocket(sessionId);

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        if (!isSessionReadyForMessaging(session, liveSocket)) {
          sendJson(response, 409, {
            error: "This WhatsApp session is not connected. Reconnect the number and try again."
          });
          return;
        }

        const target = extractTarget(body);
        if (!target) {
          sendJson(response, 400, {
            error: "Provide `remoteJid`, `jid`, or `to` in the request body."
          });
          return;
        }

        const result = await sendQueue.queueOutboundMessage({
          sessionId,
          userId:
            typeof body.userId === "string" && body.userId.trim().length > 0
              ? body.userId
              : session.userId,
          to: target,
          body
        });

        sendJson(response, 200, {
          success: true,
          sessionId,
          messageId: result.messageId,
          to: result.jid,
          scheduledDelayMs: result.scheduledDelayMs,
          messageType: result.messageType
        });
        return;
      }

      if (request.method === "POST" && action === "send-presence-update") {
        const body = await readBody(request);
        const session = await ensureLiveSession(sessionId);
        const liveSocket = sessionManager.getSocket(sessionId);

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        if (!isSessionReadyForMessaging(session, liveSocket)) {
          sendJson(response, 409, {
            error: "This WhatsApp session is not connected. Reconnect the number and try again."
          });
          return;
        }

        const target = extractTarget(body);
        if (!target) {
          sendJson(response, 400, {
            error: "Provide `remoteJid`, `jid`, or `to` in the request body."
          });
          return;
        }

        const result = await sendQueue.sendPresenceUpdate({
          sessionId,
          to: target,
          presence:
            typeof body.presence === "string" && body.presence.trim().length > 0
              ? body.presence.trim().toLowerCase()
              : "composing",
          durationMs: typeof body.durationMs === "number" ? body.durationMs : undefined
        });

        sendJson(response, 200, {
          success: true,
          sessionId,
          to: result.jid,
          presence: result.presence,
          durationMs: result.durationMs
        });
        return;
      }

      if (request.method === "POST" && action === "send-typing") {
        const body = await readBody(request);
        const session = await ensureLiveSession(sessionId);
        const liveSocket = sessionManager.getSocket(sessionId);

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        if (!isSessionReadyForMessaging(session, liveSocket)) {
          sendJson(response, 409, {
            error: "This WhatsApp session is not connected. Reconnect the number and try again."
          });
          return;
        }

        const target = extractTarget(body);
        if (!target) {
          sendJson(response, 400, {
            error: "Provide `remoteJid`, `jid`, or `to` in the request body."
          });
          return;
        }

        const result = await sendQueue.sendTypingIndicator({
          sessionId,
          to: target,
          durationMs: typeof body.durationMs === "number" ? body.durationMs : undefined
        });

        sendJson(response, 200, {
          success: true,
          sessionId,
          to: result.jid,
          typingDurationMs: result.durationMs
        });
        return;
      }

      if (request.method === "GET" && action === "check-number") {
        const session = await ensureLiveSession(sessionId);
        const liveSocket = sessionManager.getSocket(sessionId) as any;

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        if (!isSessionReadyForMessaging(session, liveSocket)) {
          sendJson(response, 409, {
            error: "This WhatsApp session is not connected. Reconnect the number and try again."
          });
          return;
        }

        const phoneNumber = (url.searchParams.get("phoneNumber") || "").replace(/\D/g, "");
        if (phoneNumber.length < 7) {
          sendJson(response, 400, { error: "A valid phone number is required." });
          return;
        }

        const lookup = await liveSocket.onWhatsApp?.(`${phoneNumber}@s.whatsapp.net`);
        const firstMatch = Array.isArray(lookup) ? lookup[0] : null;

        sendJson(response, 200, {
          success: true,
          exists: Boolean(firstMatch?.exists || firstMatch?.jid),
          jid: firstMatch?.jid || `${phoneNumber}@s.whatsapp.net`,
          lid: firstMatch?.lid || null,
          phoneNumber
        });
        return;
      }

      if (request.method === "GET" && action === "contact-picture") {
        const session = await ensureLiveSession(sessionId);
        const liveSocket = sessionManager.getSocket(sessionId) as any;

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        if (!isSessionReadyForMessaging(session, liveSocket)) {
          sendJson(response, 409, {
            error: "This WhatsApp session is not connected. Reconnect the number and try again."
          });
          return;
        }

        const jid = (url.searchParams.get("jid") || "").trim();
        if (!jid) {
          sendJson(response, 400, { error: "A contact JID is required." });
          return;
        }

        let pictureUrl: string | null = null;
        try {
          pictureUrl = (await liveSocket.profilePictureUrl?.(jid, "image")) || null;
        } catch {
          pictureUrl = null;
        }

        sendJson(response, 200, {
          success: true,
          jid,
          pictureUrl
        });
        return;
      }

      if (request.method === "POST" && (action === "contact-block" || action === "contact-unblock")) {
        const body = await readBody(request);
        const session = await ensureLiveSession(sessionId);
        const liveSocket = sessionManager.getSocket(sessionId) as any;

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        if (!isSessionReadyForMessaging(session, liveSocket)) {
          sendJson(response, 409, {
            error: "This WhatsApp session is not connected. Reconnect the number and try again."
          });
          return;
        }

        const target = extractTarget(body);
        if (!target) {
          sendJson(response, 400, {
            error: "Provide `remoteJid`, `jid`, or `to` in the request body."
          });
          return;
        }

        const result = await liveSocket.updateBlockStatus?.(
          target,
          action === "contact-block" ? "block" : "unblock"
        );

        sendJson(response, 200, {
          success: true,
          sessionId,
          to: target,
          result: result || null,
          action: action === "contact-block" ? "blocked" : "unblocked"
        });
        return;
      }

      if (request.method === "POST" && action === "send-seen") {
        const body = await readBody(request);
        const session = await ensureLiveSession(sessionId);
        const liveSocket = sessionManager.getSocket(sessionId);

        if (!session) {
          sendJson(response, 404, { error: "Session not found." });
          return;
        }

        if (!isSessionReadyForMessaging(session, liveSocket)) {
          sendJson(response, 409, {
            error: "This WhatsApp session is not connected. Reconnect the number and try again."
          });
          return;
        }

        const target = extractTarget(body);
        if (!target) {
          sendJson(response, 400, {
            error: "Provide `remoteJid`, `jid`, or `to` in the request body."
          });
          return;
        }

        if (typeof body.messageId !== "string" || body.messageId.trim().length === 0) {
          sendJson(response, 400, {
            error: "Message id is required."
          });
          return;
        }

        const result = await sendQueue.markConversationSeen({
          sessionId,
          to: target,
          messageId: body.messageId.trim(),
          participantJid:
            typeof body.participantJid === "string" && body.participantJid.trim().length > 0
              ? body.participantJid.trim()
              : undefined
        });

        sendJson(response, 200, {
          success: true,
          sessionId,
          to: result.jid,
          messageId: result.messageId
        });
        return;
      }
    }

    // ── Group routes ── /sessions/:id/groups[/:groupId[/:action]]
    const groupMatch = url.pathname.match(
      /^\/sessions\/([0-9a-f-]+)\/groups(?:\/([^/]+))?(?:\/([a-z-]+))?(?:\/([a-z-]+))?$/i
    );

    if (groupMatch) {
      const [, sessionId, groupId, action, subAction] = groupMatch;
      const session = await ensureLiveSession(sessionId);
      const liveSocket = sessionManager.getSocket(sessionId) as any;

      if (!session) { sendJson(response, 404, { error: "Session not found." }); return; }
      if (!isSessionReadyForMessaging(session, liveSocket)) {
        sendJson(response, 409, { error: "Session not connected." }); return;
      }

      // GET /sessions/:id/groups — list joined groups
      if (request.method === "GET" && !groupId) {
        const data = await liveSocket.groupFetchAllParticipating?.() ?? {};
        const groups = Object.values(data).map((g: any) => ({
          id: g.id,
          subject: g.subject,
          desc: g.desc ?? null,
          participantCount: g.participants?.length ?? 0,
          creation: g.creation ?? null,
          owner: g.owner ?? null,
          announce: g.announce ?? false,
          restrict: g.restrict ?? false
        }));
        sendJson(response, 200, { groups });
        return;
      }

      // POST /sessions/:id/groups — create group
      if (request.method === "POST" && !groupId) {
        const body = await readBody(request);
        const { subject, participants } = body;
        if (!subject || !Array.isArray(participants)) {
          sendJson(response, 400, { error: "subject and participants are required." }); return;
        }
        const result = await liveSocket.groupCreate?.(subject.trim(), participants);
        sendJson(response, 201, { success: true, group: result });
        return;
      }

      if (groupId) {
        const decodedGroupId = decodeURIComponent(groupId);

        // GET /sessions/:id/groups/:groupId — group metadata
        if (request.method === "GET" && !action) {
          const meta = await liveSocket.groupMetadata?.(decodedGroupId);
          sendJson(response, 200, meta ?? { error: "Group not found." });
          return;
        }

        // PUT /sessions/:id/groups/:groupId — update subject or description
        if (request.method === "PUT" && !action) {
          const body = await readBody(request);
          if (body.subject) await liveSocket.groupUpdateSubject?.(decodedGroupId, body.subject.trim());
          if (body.description !== undefined) await liveSocket.groupUpdateDescription?.(decodedGroupId, body.description?.trim() || undefined);
          sendJson(response, 200, { success: true, groupId: decodedGroupId });
          return;
        }

        // POST /sessions/:id/groups/:groupId/leave
        if (request.method === "POST" && action === "leave") {
          await liveSocket.groupLeave?.(decodedGroupId);
          sendJson(response, 200, { success: true, groupId: decodedGroupId });
          return;
        }

        // GET /sessions/:id/groups/:groupId/participants
        if (request.method === "GET" && action === "participants") {
          const meta = await liveSocket.groupMetadata?.(decodedGroupId);
          sendJson(response, 200, { participants: meta?.participants ?? [] });
          return;
        }

        // POST /sessions/:id/groups/:groupId/participants — add
        if (request.method === "POST" && action === "participants" && !subAction) {
          const body = await readBody(request);
          const result = await liveSocket.groupParticipantsUpdate?.(decodedGroupId, body.participants, "add");
          sendJson(response, 200, { success: true, result });
          return;
        }

        // DELETE /sessions/:id/groups/:groupId/participants — remove
        if (request.method === "DELETE" && action === "participants") {
          const body = await readBody(request);
          const result = await liveSocket.groupParticipantsUpdate?.(decodedGroupId, body.participants, "remove");
          sendJson(response, 200, { success: true, result });
          return;
        }

        // POST /sessions/:id/groups/:groupId/participants/promote
        if (request.method === "POST" && action === "participants" && subAction === "promote") {
          const body = await readBody(request);
          const result = await liveSocket.groupParticipantsUpdate?.(decodedGroupId, body.participants, "promote");
          sendJson(response, 200, { success: true, result });
          return;
        }

        // POST /sessions/:id/groups/:groupId/participants/demote
        if (request.method === "POST" && action === "participants" && subAction === "demote") {
          const body = await readBody(request);
          const result = await liveSocket.groupParticipantsUpdate?.(decodedGroupId, body.participants, "demote");
          sendJson(response, 200, { success: true, result });
          return;
        }

        // GET /sessions/:id/groups/:groupId/invite — get invite link
        if (request.method === "GET" && action === "invite") {
          const code = await liveSocket.groupInviteCode?.(decodedGroupId);
          sendJson(response, 200, { success: true, groupId: decodedGroupId, inviteCode: code, inviteLink: `https://chat.whatsapp.com/${code}` });
          return;
        }

        // DELETE /sessions/:id/groups/:groupId/invite — revoke invite link
        if (request.method === "DELETE" && action === "invite") {
          const newCode = await liveSocket.groupRevokeInvite?.(decodedGroupId);
          sendJson(response, 200, { success: true, groupId: decodedGroupId, newInviteCode: newCode });
          return;
        }

        // POST /sessions/:id/groups/:groupId/invite — join via link
        if (request.method === "POST" && action === "invite") {
          const body = await readBody(request);
          const result = await liveSocket.groupAcceptInvite?.(body.inviteCode);
          sendJson(response, 200, { success: true, result });
          return;
        }

        // PUT /sessions/:id/groups/:groupId/settings — announcement / locked
        if (request.method === "PUT" && action === "settings") {
          const body = await readBody(request);
          await liveSocket.groupSettingUpdate?.(decodedGroupId, body.setting);
          sendJson(response, 200, { success: true, groupId: decodedGroupId, setting: body.setting });
          return;
        }
      }
    }

    // ── Advanced message actions ──
    const advancedMsgMatch = url.pathname.match(/^\/sessions\/([0-9a-f-]+)\/(message-edit|message-delete|send-reaction)$/i);
    if (advancedMsgMatch) {
      const [, sessionId, action] = advancedMsgMatch;
      const session = await ensureLiveSession(sessionId);
      const liveSocket = sessionManager.getSocket(sessionId) as any;

      if (!session) { sendJson(response, 404, { error: "Session not found." }); return; }
      if (!isSessionReadyForMessaging(session, liveSocket)) {
        sendJson(response, 409, { error: "Session not connected." }); return;
      }

      if (request.method === "POST" && action === "message-edit") {
        const body = await readBody(request);
        const { messageId, remoteJid, text } = body;
        if (!messageId || !remoteJid || !text) {
          sendJson(response, 400, { error: "messageId, remoteJid, and text are required." }); return;
        }
        await liveSocket.sendMessage?.(remoteJid, {
          edit: messageId,
          text: text.trim()
        });
        sendJson(response, 200, { success: true, messageId, remoteJid });
        return;
      }

      if (request.method === "POST" && action === "message-delete") {
        const body = await readBody(request);
        const { messageId, remoteJid, forEveryone = true } = body;
        if (!messageId || !remoteJid) {
          sendJson(response, 400, { error: "messageId and remoteJid are required." }); return;
        }
        const key = { remoteJid, id: messageId, fromMe: true };
        await liveSocket.sendMessage?.(remoteJid, { delete: key });
        sendJson(response, 200, { success: true, messageId, remoteJid, forEveryone });
        return;
      }

      if (request.method === "POST" && action === "send-reaction") {
        const body = await readBody(request);
        const { messageId, remoteJid, emoji = "" } = body;
        if (!messageId || !remoteJid) {
          sendJson(response, 400, { error: "messageId and remoteJid are required." }); return;
        }
        await liveSocket.sendMessage?.(remoteJid, {
          react: { text: emoji, key: { remoteJid, id: messageId } }
        });
        sendJson(response, 200, { success: true, messageId, remoteJid, emoji });
        return;
      }
    }

    if (deleteMatch && request.method === "DELETE") {
      const [, sessionId] = deleteMatch;
      await sessionManager.deleteSession(sessionId);
      sendJson(response, 200, {
        success: true,
        sessionId,
        scrubbed: true
      });
      return;
    }

    sendJson(response, 404, { error: "Worker route not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Worker request failed.";
    console.error("[WORKER]", message, error);
    sendJson(response, 500, { error: message });
  }
  });

  server.listen(workerPort, "127.0.0.1", () => {
    console.log(`[WORKER] WhatsApp runtime listening on http://127.0.0.1:${workerPort}`);
  });
}

void main().catch((error) => {
  console.error("[WORKER] Failed to boot WhatsApp runtime:", error);
  process.exit(1);
});
