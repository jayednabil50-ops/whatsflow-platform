import { NextRequest, NextResponse } from "next/server";
import {
  callWhatsAppWorker,
  isWhatsAppWorkerHttpError,
  WhatsAppWorkerUnavailableError
} from "@/lib/whatsapp/worker-client";
import {
  normalizePhoneDigits,
  PublicApiRequestError,
  requirePublicApiSession
} from "@/lib/whatsapp/public-api";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  try {
    const session = await requirePublicApiSession(req);
    const { phoneNumber } = await params;
    const normalizedPhoneNumber = normalizePhoneDigits(phoneNumber);

    if (normalizedPhoneNumber.length < 7) {
      return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
    }

    const result = await callWhatsAppWorker<{
      success: boolean;
      exists: boolean;
      jid: string;
      lid: string | null;
      phoneNumber: string;
    }>(
      `/sessions/${session.id}/check-number?phoneNumber=${encodeURIComponent(normalizedPhoneNumber)}`,
      {
        method: "GET"
      }
    );

    return NextResponse.json(result);
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

    const message = error instanceof Error ? error.message : "Failed to check phone number.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
