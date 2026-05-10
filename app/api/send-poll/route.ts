import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// POST /api/send-poll — send a poll message
export async function POST(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);
    const body = await req.json();
    const { remoteJid, jid, to, poll } = body;

    const target = [remoteJid, jid, to].find((v) => typeof v === "string" && v.trim());
    if (!target) return NextResponse.json({ error: "remoteJid, jid, or to is required." }, { status: 400 });

    if (!poll || typeof poll.name !== "string" || !Array.isArray(poll.options) || poll.options.length < 2) {
      return NextResponse.json(
        { error: "poll.name (string) and poll.options (array, min 2) are required." },
        { status: 400 }
      );
    }

    const result = await callWhatsAppWorker<{
      success: boolean;
      messageId?: string;
      to: string;
      scheduledDelayMs: number;
    }>(`/sessions/${session.id}/send-message`, {
      method: "POST",
      body: JSON.stringify({
        remoteJid: target,
        userId: session.userId,
        poll: {
          name: poll.name.trim(),
          options: poll.options.map(String),
          allowMultipleAnswers: poll.allowMultipleAnswers === true
        }
      })
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      messageId: result.messageId,
      to: result.to,
      messageType: "poll"
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof WhatsAppWorkerUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (isWhatsAppWorkerHttpError(error)) return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
    const msg = error instanceof Error ? error.message : "Failed to send poll.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
