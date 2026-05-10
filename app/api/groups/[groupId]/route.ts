import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// GET /api/groups/[groupId] — get group metadata
export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}`,
      { method: "GET" }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/groups/[groupId] — update group subject or description
export async function PUT(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const body = await req.json();
    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}`,
      { method: "PUT", body: JSON.stringify(body) }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof PublicApiRequestError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof WhatsAppWorkerUnavailableError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (isWhatsAppWorkerHttpError(error)) {
    return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
  }
  const msg = error instanceof Error ? error.message : "Group operation failed.";
  return NextResponse.json({ error: msg }, { status: 500 });
}
