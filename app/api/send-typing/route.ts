import { NextRequest, NextResponse } from "next/server";
import { requireActiveWorkspace, WorkspaceAccessError } from "@/lib/platform/workspace";
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
    const { to, jid, remoteJid, durationMs } = body;
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
      typingDurationMs: number;
    }>(`/sessions/${session.id}/send-typing`, {
      method: "POST",
      body: JSON.stringify({
        remoteJid: target,
        durationMs: typeof durationMs === "number" ? durationMs : undefined
      })
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      to: result.to,
      typingDurationMs: result.typingDurationMs
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

    const message = error instanceof Error ? error.message : "Failed to send typing indicator.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
