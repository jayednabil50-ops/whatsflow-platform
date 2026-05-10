import { NextRequest, NextResponse } from "next/server";
import { requireActiveWorkspace, WorkspaceAccessError } from "@/lib/platform/workspace";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateSessionApiKey } from "@/lib/whatsapp/api-keys";
import {
  callWhatsAppWorker,
  isWhatsAppWorkerHttpError,
  WhatsAppWorkerUnavailableError
} from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

function getBearerToken(request: Request): string {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice("Bearer ".length).trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const session = await authenticateSessionApiKey(token);
    if (!session) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }

    await requireActiveWorkspace(session.userId);

    const body = await req.json();
    const { to, jid, remoteJid, messageId, participantJid } = body;
    const target = [remoteJid, jid, to].find(
      (value) => typeof value === "string" && value.trim().length > 0
    );

    if (!target) {
      return NextResponse.json(
        { error: "Provide `remoteJid`, `jid`, or `to` in the request body." },
        { status: 400 }
      );
    }

    let targetMessageId =
      typeof messageId === "string" && messageId.trim().length > 0 ? messageId.trim() : "";

    if (!targetMessageId) {
      const { data, error } = await getSupabaseAdminClient()
        .from("messages")
        .select("external_message_id")
        .eq("session_id", session.id)
        .eq("user_id", session.userId)
        .eq("remote_jid", target)
        .eq("direction", "inbound")
        .not("external_message_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const latestInbound = data as { external_message_id: string | null } | null;
      targetMessageId = latestInbound?.external_message_id || "";
    }

    if (!targetMessageId) {
      return NextResponse.json(
        {
          error:
            "Message id is required. Pass `messageId` from your webhook payload or make sure an inbound message was already saved for this contact."
        },
        { status: 400 }
      );
    }

    const result = await callWhatsAppWorker<{
      success: boolean;
      sessionId: string;
      to: string;
      messageId: string;
    }>(`/sessions/${session.id}/send-seen`, {
      method: "POST",
      body: JSON.stringify({
        remoteJid: target,
        messageId: targetMessageId,
        participantJid:
          typeof participantJid === "string" && participantJid.trim().length > 0
            ? participantJid.trim()
            : undefined
      })
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      to: result.to,
      messageId: result.messageId
    });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof WhatsAppWorkerUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (isWhatsAppWorkerHttpError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to send seen receipt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
