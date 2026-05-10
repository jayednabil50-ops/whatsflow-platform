import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// GET /api/groups/[groupId]/invite — get invite link
export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/invite`,
      { method: "GET" }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/groups/[groupId]/invite — revoke invite link
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/invite`,
      { method: "DELETE" }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/groups/[groupId]/invite — join via invite link
export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const body = await req.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json({ error: "inviteCode is required." }, { status: 400 });
    }

    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/invite`,
      { method: "POST", body: JSON.stringify({ inviteCode }) }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof PublicApiRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof WhatsAppWorkerUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
  if (isWhatsAppWorkerHttpError(error)) return NextResponse.json({ error: (error as any).message }, { status: (error as any).status || 500 });
  const msg = error instanceof Error ? error.message : "Invite operation failed.";
  return NextResponse.json({ error: msg }, { status: 500 });
}
