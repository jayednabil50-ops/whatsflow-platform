import { NextRequest, NextResponse } from "next/server";
import {
  PublicApiRequestError,
  requirePublicApiSession
} from "@/lib/whatsapp/public-api";
import {
  callWhatsAppWorker,
  isWhatsAppWorkerHttpError
} from "@/lib/whatsapp/worker-client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);

    try {
      const runtimeSession = await callWhatsAppWorker<{
        id: string;
        status: string;
        connectedPhone?: string | null;
        connectedName?: string | null;
        device?: string | null;
        error?: string | null;
      }>(`/sessions/${session.id}/status`, {
        method: "GET",
        timeoutMs: 8000
      });

      return NextResponse.json({
        sessionId: session.id,
        sessionName: session.name,
        status: runtimeSession.status,
        connectedPhone: runtimeSession.connectedPhone || session.connectedPhone || session.phone,
        connectedName: runtimeSession.connectedName || session.connectedName || session.name,
        device: runtimeSession.device || null,
        countryCode: session.countryCode,
        webhookUrl: session.webhookUrl || null,
        error: runtimeSession.error || null
      });
    } catch (error) {
      if (isWhatsAppWorkerHttpError(error) && error.status === 404) {
        return NextResponse.json({
          sessionId: session.id,
          sessionName: session.name,
          status: session.status,
          connectedPhone: session.connectedPhone || session.phone,
          connectedName: session.connectedName || session.name,
          device: null,
          countryCode: session.countryCode,
          webhookUrl: session.webhookUrl || null,
          error: null
        });
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isWhatsAppWorkerHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }

    const message = error instanceof Error ? error.message : "Failed to fetch session status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
