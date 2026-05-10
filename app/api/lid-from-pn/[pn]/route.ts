import { NextRequest, NextResponse } from "next/server";
import {
  listPublicApiContacts,
  normalizePhoneDigits,
  PublicApiRequestError,
  requirePublicApiSession
} from "@/lib/whatsapp/public-api";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pn: string }> }
) {
  try {
    const session = await requirePublicApiSession(req);
    const { pn } = await params;
    const normalizedPhone = normalizePhoneDigits(pn);

    if (normalizedPhone.length < 7) {
      return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
    }

    const contacts = await listPublicApiContacts(session.id);
    const match =
      contacts.find(
        (contact) =>
          contact.remoteJid.includes("@lid") &&
          normalizePhoneDigits(contact.resolvedPhoneNumber || contact.phoneNumber) ===
            normalizedPhone
      ) || null;

    return NextResponse.json({
      phoneNumber: normalizedPhone,
      lid: match?.remoteJid || null
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to resolve LID.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
