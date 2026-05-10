import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  isAuthenticationError,
  requireAuthenticatedUser
} from "@/lib/supabase/auth";
import { listSessions } from "@/lib/whatsapp/supabase-session-manager";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    const sessions = await listSessions(user.id);
    const sessionIds = sessions.map((session) => session.id);

    if (sessionIds.length === 0) {
      return NextResponse.json({
        deliveries: [],
        metrics: {
          successRate: 100,
          averageLatency: "n/a",
          failedRetries: 0
        }
      });
    }

    const { data, error } = await getSupabaseAdminClient()
      .from("webhook_deliveries")
      .select("event_type, status, attempts, http_status, created_at, next_retry_at, last_error, session_id")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    const deliveries = (data || []) as Array<{
      event_type: string | null;
      status: string | null;
      attempts: number | null;
      http_status: number | null;
      created_at: string;
      next_retry_at: string | null;
      last_error: string | null;
      session_id: string;
    }>;

    const successRate = deliveries.length
      ? Math.round(
          (deliveries.filter((delivery) => delivery.status === "delivered").length /
            deliveries.length) *
            1000
        ) / 10
      : 100;
    const failedRetries = deliveries.filter((delivery) => delivery.status === "failed").length;

    return NextResponse.json({
      deliveries,
      metrics: {
        successRate,
        averageLatency: "tracked at endpoint",
        failedRetries
      }
    });
  } catch (error) {
    if (isAuthenticationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Failed to load webhooks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
