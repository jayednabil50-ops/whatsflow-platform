import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// PUT /api/groups/[groupId]/settings — update group settings (who can send, who can edit info)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const body = await req.json();

    const allowed = ["announcement", "not_announcement", "locked", "unlocked"];
    const { setting } = body;

    if (!setting || !allowed.includes(setting)) {
      return NextResponse.json(
        { error: `setting must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/settings`,
      { method: "PUT", body: JSON.stringify({ setting }) }
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PublicApiRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof WhatsAppWorkerUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (isWhatsAppWorkerHttpError(error)) return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
    const msg = error instanceof Error ? error.message : "Settings update failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
