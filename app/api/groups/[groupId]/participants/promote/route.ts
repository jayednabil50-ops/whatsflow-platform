import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// POST /api/groups/[groupId]/participants/promote
export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const body = await req.json();
    const { participants } = body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "participants array is required." }, { status: 400 });
    }

    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/participants/promote`,
      { method: "POST", body: JSON.stringify({ participants }) }
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PublicApiRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof WhatsAppWorkerUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (isWhatsAppWorkerHttpError(error)) return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
    const msg = error instanceof Error ? error.message : "Promote failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
