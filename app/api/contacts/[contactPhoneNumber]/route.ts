import { NextRequest, NextResponse } from "next/server";
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

    return NextResponse.json({
      remoteJid: contact.remoteJid,
      displayName: contact.displayName || null,
      phoneNumber: contact.resolvedPhoneNumber || contact.phoneNumber,
      lid: contact.remoteJid.includes("@lid") ? contact.remoteJid : null,
      lastMessageAt: contact.lastMessageAt || null,
      updatedAt: contact.updatedAt
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to fetch contact info.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
