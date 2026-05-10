import { NextRequest, NextResponse } from "next/server";
import { PublicApiRequestError, requirePublicApiSession } from "@/lib/whatsapp/public-api";
import { callWhatsAppWorker, isWhatsAppWorkerHttpError, WhatsAppWorkerUnavailableError } from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

// GET /api/groups — list all groups for the session
export async function GET(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);
    const result = await callWhatsAppWorker<{ groups: unknown[] }>(
      `/sessions/${session.id}/groups`,
      { method: "GET" }
    );
    return NextResponse.json({ sessionId: session.id, total: result.groups?.length ?? 0, groups: result.groups ?? [] });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/groups — create a new group
export async function POST(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);
    const body = await req.json();
    const { subject, participants } = body;

    if (!subject || typeof subject !== "string" || subject.trim().length < 1) {
      return NextResponse.json({ error: "Group subject is required." }, { status: 400 });
    }
    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "At least one participant is required." }, { status: 400 });
    }

    const result = await callWhatsAppWorker(
      `/sessions/${session.id}/groups`,
      { method: "POST", body: JSON.stringify({ subject: subject.trim(), participants }) }
    );
    return NextResponse.json(result, { status: 201 });
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
