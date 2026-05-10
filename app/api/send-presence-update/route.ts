import { NextRequest, NextResponse } from "next/server";
import { WorkspaceAccessError } from "@/lib/platform/workspace";
import {
  PublicApiRequestError,
  requirePublicApiSession
} from "@/lib/whatsapp/public-api";
import {
  callWhatsAppWorker,
  isWhatsAppWorkerHttpError,
  WhatsAppWorkerUnavailableError
} from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);
    const body = await req.json();
    const { to, jid, remoteJid, presence, durationMs } = body;
    const target = [remoteJid, jid, to].find(
      (value) => typeof value === "string" && value.trim().length > 0
    );

    if (!target) {
      return NextResponse.json(
        { error: "Provide `remoteJid`, `jid`, or `to` in the request body." },
        { status: 400 }
      );
    }

    const result = await callWhatsAppWorker<{
      success: boolean;
      sessionId: string;
      to: string;
      presence: string;
      durationMs: number;
    }>(`/sessions/${session.id}/send-presence-update`, {
      method: "POST",
      body: JSON.stringify({
        remoteJid: target,
        presence:
          typeof presence === "string" && presence.trim().length > 0
            ? presence.trim().toLowerCase()
            : "composing",
        durationMs: typeof durationMs === "number" ? durationMs : undefined
      })
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      to: result.to,
      presence: result.presence,
      durationMs: result.durationMs
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof WhatsAppWorkerUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (isWhatsAppWorkerHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to send presence update.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
