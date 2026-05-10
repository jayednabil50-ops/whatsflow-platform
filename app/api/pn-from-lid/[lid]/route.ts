import { NextRequest, NextResponse } from "next/server";
import {
  findPublicApiContact,
  normalizePhoneDigits,
  PublicApiRequestError,
  requirePublicApiSession
} from "@/lib/whatsapp/public-api";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lid: string }> }
) {
  try {
    const session = await requirePublicApiSession(req);
    const { lid } = await params;
    const normalizedLid = normalizePhoneDigits(lid);

    if (normalizedLid.length < 5) {
      return NextResponse.json({ error: "A valid LID is required." }, { status: 400 });
    }

    const contact =
      (await findPublicApiContact(session.id, `${normalizedLid}@lid`)) ||
      (await findPublicApiContact(session.id, `${normalizedLid}@hosted.lid`));

    return NextResponse.json({
      lid: contact?.remoteJid || `${normalizedLid}@lid`,
      phoneNumber: contact?.resolvedPhoneNumber || contact?.phoneNumber || null
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to resolve phone number.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
