import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// POST /api/send-reaction — react to a message with an emoji
export async function POST(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);
    const body = await req.json();
    const { remoteJid, jid, to, messageId, emoji } = body;

    const target = [remoteJid, jid, to].find((v) => typeof v === "string" && v.trim());
    if (!target) return NextResponse.json({ error: "remoteJid, jid, or to is required." }, { status: 400 });
    if (!messageId || typeof messageId !== "string") return NextResponse.json({ error: "messageId is required." }, { status: 400 });

    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/send-reaction`,
      {
        method: "POST",
        body: JSON.stringify({
          remoteJid: target,
          messageId: messageId.trim(),
          emoji: typeof emoji === "string" ? emoji : ""
        })
      }
    );
    const r = result as Record<string, unknown>;
    return NextResponse.json({ success: true, sessionId: session.id, ...r });
  } catch (error) {
    if (error instanceof PublicApiRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof WhatsAppWorkerUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (isWhatsAppWorkerHttpError(error)) return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
    const msg = error instanceof Error ? error.message : "Failed to send reaction.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
