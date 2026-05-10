import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// POST /api/messages/[messageId]/delete — delete a message (for everyone)
export async function POST(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { messageId } = await params;
    const body = await req.json();
    const { remoteJid, jid, to, forEveryone = true } = body;

    const target = [remoteJid, jid, to].find((v) => typeof v === "string" && v.trim());
    if (!target) return NextResponse.json({ error: "remoteJid, jid, or to is required." }, { status: 400 });

    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/message-delete`,
      {
        method: "POST",
        body: JSON.stringify({ messageId, remoteJid: target, forEveryone })
      }
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PublicApiRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof WhatsAppWorkerUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (isWhatsAppWorkerHttpError(error)) return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
    const msg = error instanceof Error ? error.message : "Message delete failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
