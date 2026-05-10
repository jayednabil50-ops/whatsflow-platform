import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// GET /api/groups/[groupId]/participants — list participants
export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/participants`,
      { method: "GET" }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/groups/[groupId]/participants — add participants
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
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/participants`,
      { method: "POST", body: JSON.stringify({ participants }) }
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/groups/[groupId]/participants — remove participants
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requirePublicApiSession(req);
    const { groupId } = await params;
    const body = await req.json();
    const { participants } = body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "participants array is required." }, { status: 400 });
    }

    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups/${encodeURIComponent(groupId)}/participants`,
      { method: "DELETE", body: JSON.stringify({ participants }) }
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
  const msg = error instanceof Error ? error.message : "Participant operation failed.";
  return NextResponse.json({ error: msg }, { status: 500 });
}
