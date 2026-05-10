import { NextRequest, NextResponse } from "next/server";
import {
  callWhatsAppWorker,
  isWhatsAppWorkerHttpError,
  WhatsAppWorkerUnavailableError
} from "@/lib/whatsapp/worker-client";
import {
  findPublicApiContact,
  PublicApiRequestError,
  requirePublicApiSession
} from "@/lib/whatsapp/public-api";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contactPhoneNumber: string }> }
) {
  try {
    const session = await requirePublicApiSession(req);
    const { contactPhoneNumber } = await params;
    const contact = await findPublicApiContact(session.id, contactPhoneNumber);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }

    const result = await callWhatsAppWorker<{
      success: boolean;
      action: string;
      to: string;
    }>(`/sessions/${session.id}/contact-block`, {
      method: "POST",
      body: JSON.stringify({
        remoteJid: contact.remoteJid
      })
    });

    return NextResponse.json({
      success: true,
      remoteJid: result.to,
      status: result.action
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof WhatsAppWorkerUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (isWhatsAppWorkerHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }

    const message = error instanceof Error ? error.message : "Failed to block contact.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
