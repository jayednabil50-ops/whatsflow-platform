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

export async function GET(
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
      jid: string;
      pictureUrl: string | null;
    }>(
      `/sessions/${session.id}/contact-picture?jid=${encodeURIComponent(contact.remoteJid)}`,
      {
        method: "GET"
      }
    );

    return NextResponse.json({
      remoteJid: contact.remoteJid,
      phoneNumber: contact.resolvedPhoneNumber || contact.phoneNumber,
      pictureUrl: result.pictureUrl
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

    const message =
      error instanceof Error ? error.message : "Failed to fetch contact profile picture.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
