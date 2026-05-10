import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// POST /api/groups/[groupId]/leave
export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/leave`,
      { method: "POST" }
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PublicApiRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof WhatsAppWorkerUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (isWhatsAppWorkerHttpError(error)) return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
    const msg = error instanceof Error ? error.message : "Leave group failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
