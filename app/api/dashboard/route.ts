import { NextRequest, NextResponse } from "next/server";
import {
  formatTrialEndsAt,
  getWorkspaceContext
} from "@/lib/platform/workspace";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  isAuthenticationError,
  requireAuthenticatedUser
} from "@/lib/supabase/auth";
import { listSessions } from "@/lib/whatsapp/supabase-session-manager";

export const runtime = "nodejs";

type UsageRow = {
  day: string;
  messages_sent: number;
  messages_received: number;
  webhook_deliveries: number;
};

type ActivityMessageRow = {
  direction: string;
  message_type: string | null;
  body: string | null;
  created_at: string;
  remote_jid: string;
  status: string;
};

function getRecentDayLabels(days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    const [{ entitlement, profile }, sessions] = await Promise.all([
      getWorkspaceContext(user.id),
      listSessions(user.id)
    ]);

    const dayLabels = getRecentDayLabels(7);
    const sessionIds = sessions.map((session) => session.id);
    const liveWindowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const usageWindowStart = `${dayLabels[0]}T00:00:00.000Z`;

    const usagePromise = getSupabaseAdminClient()
      .from("usage_daily")
      .select("day, messages_sent, messages_received, webhook_deliveries")
      .eq("user_id", user.id)
      .gte("day", dayLabels[0])
      .order("day", { ascending: true });

    const recentMessagesPromise = getSupabaseAdminClient()
      .from("messages")
      .select("direction, message_type, body, created_at, remote_jid, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    const liveMessagesPromise = getSupabaseAdminClient()
      .from("messages")
      .select("direction, remote_jid, created_at")
      .eq("user_id", user.id)
      .gte("created_at", liveWindowStart)
      .order("created_at", { ascending: false })
      .limit(120);
    const usageHistoryMessagesPromise = getSupabaseAdminClient()
      .from("messages")
      .select("direction, created_at")
      .eq("user_id", user.id)
      .gte("created_at", usageWindowStart)
      .order("created_at", { ascending: true })
      .limit(5000);

    const recentDeliveriesPromise =
      sessionIds.length === 0
        ? Promise.resolve({ data: [], error: null } as const)
        : getSupabaseAdminClient()
            .from("webhook_deliveries")
            .select("event_type, status, attempts, http_status, created_at, session_id")
            .in("session_id", sessionIds)
            .order("created_at", { ascending: false })
            .limit(8);

    const liveDeliveriesPromise =
      sessionIds.length === 0
        ? Promise.resolve({ data: [], error: null } as const)
        : getSupabaseAdminClient()
            .from("webhook_deliveries")
            .select("created_at")
            .in("session_id", sessionIds)
            .gte("created_at", liveWindowStart)
            .order("created_at", { ascending: false })
            .limit(120);
    const usageHistoryDeliveriesPromise =
      sessionIds.length === 0
        ? Promise.resolve({ data: [], error: null } as const)
        : getSupabaseAdminClient()
            .from("webhook_deliveries")
            .select("created_at")
            .in("session_id", sessionIds)
            .gte("created_at", usageWindowStart)
            .order("created_at", { ascending: true })
            .limit(5000);

    const [
      { data: usageRows, error: usageError },
      { data: recentMessages, error: messagesError },
      { data: recentDeliveries, error: deliveriesError },
      { data: liveMessages, error: liveMessagesError },
      { data: liveDeliveries, error: liveDeliveriesError },
      { data: usageHistoryMessages, error: usageHistoryMessagesError },
      { data: usageHistoryDeliveries, error: usageHistoryDeliveriesError }
    ] = await Promise.all([
      usagePromise,
      recentMessagesPromise,
      recentDeliveriesPromise,
      liveMessagesPromise,
      liveDeliveriesPromise,
      usageHistoryMessagesPromise,
      usageHistoryDeliveriesPromise
    ]);

    if (usageError) {
      throw usageError;
    }
    if (messagesError) {
      throw messagesError;
    }
    if (deliveriesError) {
      throw deliveriesError;
    }
    if (liveMessagesError) {
      throw liveMessagesError;
    }
    if (liveDeliveriesError) {
      throw liveDeliveriesError;
    }
    if (usageHistoryMessagesError) {
      throw usageHistoryMessagesError;
    }
    if (usageHistoryDeliveriesError) {
      throw usageHistoryDeliveriesError;
    }

    const usageMap = new Map(
      ((usageRows || []) as UsageRow[]).map((row) => [
        row.day,
        {
          sent: row.messages_sent,
          received: row.messages_received,
          webhooks: row.webhook_deliveries
        }
      ])
    );
    const fallbackUsageMap = new Map<
      string,
      { sent: number; received: number; webhooks: number }
    >();

    for (const row of (usageHistoryMessages || []) as Array<{
      direction: string;
      created_at: string;
    }>) {
      const day = row.created_at.slice(0, 10);
      const current = fallbackUsageMap.get(day) || { sent: 0, received: 0, webhooks: 0 };
      if (row.direction === "outbound") {
        current.sent += 1;
      }
      if (row.direction === "inbound") {
        current.received += 1;
      }
      fallbackUsageMap.set(day, current);
    }

    for (const row of (usageHistoryDeliveries || []) as Array<{ created_at: string }>) {
      const day = row.created_at.slice(0, 10);
      const current = fallbackUsageMap.get(day) || { sent: 0, received: 0, webhooks: 0 };
      current.webhooks += 1;
      fallbackUsageMap.set(day, current);
    }

    const usageSeries = dayLabels.map((day) => {
      const row = usageMap.get(day);
      const fallback = fallbackUsageMap.get(day);
      const date = new Date(`${day}T00:00:00`);

      return {
        isoDay: day,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        sent: Math.max(row?.sent || 0, fallback?.sent || 0),
        received: Math.max(row?.received || 0, fallback?.received || 0),
        webhooks: Math.max(row?.webhooks || 0, fallback?.webhooks || 0)
      };
    });

    const usageTotals = usageSeries.reduce(
      (acc, row) => ({
        sent: acc.sent + row.sent,
        received: acc.received + row.received,
        webhooks: acc.webhooks + row.webhooks
      }),
      { sent: 0, received: 0, webhooks: 0 }
    );

    const latestDay = usageSeries[usageSeries.length - 1];
    const connectedCount = sessions.filter((session) => session.status === "connected").length;
    const sessionLimit = entitlement.sessionLimit;
    const deliveryRows = (recentDeliveries || []) as Array<{
      event_type: string | null;
      status: string | null;
      attempts: number | null;
      http_status: number | null;
      created_at: string;
      session_id: string;
    }>;
    const successfulDeliveries = deliveryRows.filter(
      (delivery) => delivery.status === "delivered"
    ).length;
    const webhookSuccessRate = deliveryRows.length
      ? Math.round((successfulDeliveries / deliveryRows.length) * 1000) / 10
      : 100;
    const liveMessageRows = (liveMessages || []) as Array<{
      direction: string;
      remote_jid: string;
      created_at: string;
    }>;
    const liveInbound = liveMessageRows.filter((message) => message.direction === "inbound");
    const liveOutbound = liveMessageRows.filter((message) => message.direction === "outbound");
    const liveContactCount = new Set(liveInbound.map((message) => message.remote_jid)).size;
    const latestLiveMessage = [...liveMessageRows]
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      )[0];

    const recentActivity = [
      ...((recentMessages || []) as ActivityMessageRow[]).map((message) => ({
        event: message.direction === "inbound" ? "Inbound message" : "Outbound message",
        detail: message.body || `${message.message_type || "message"} activity`,
        time: new Date(message.created_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short"
        }),
        createdAt: message.created_at
      })),
      ...deliveryRows.map((delivery) => ({
        event: "Webhook delivery",
        detail: `${delivery.event_type || "event"} - ${delivery.status || "pending"}${delivery.http_status ? ` (${delivery.http_status})` : ""}`,
        time: new Date(delivery.created_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short"
        }),
        createdAt: delivery.created_at
      }))
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map(({ createdAt, ...rest }) => rest);

    return NextResponse.json({
      workspace: {
        plan: entitlement.planLabel,
        trialEndsAt: formatTrialEndsAt(entitlement.expiresAt, {
          isUnlimited: entitlement.isUnlimited
        }),
        expiresAtIso: entitlement.expiresAt,
        accessActive: entitlement.hasActiveAccess,
        sessionLimit,
        sessionCount: sessions.length,
        fullName: profile.full_name,
        email: profile.email,
        accessMode: entitlement.mode,
        isUnlimited: entitlement.isUnlimited
      },
      metrics: {
        messagesSentToday: latestDay?.sent || 0,
        messagesReceivedToday: latestDay?.received || 0,
        webhookSuccessRate,
        connectedCount,
        sessionLimit,
        safetyScore: connectedCount > 0 ? 96 : 88
      },
      liveUsage: {
        windowLabel: "Last 15 min",
        inboundCount: liveInbound.length,
        outboundCount: liveOutbound.length,
        webhookCount: (liveDeliveries || []).length,
        activeContacts: liveContactCount,
        latestMessageAt: latestLiveMessage?.created_at || null
      },
      usageSeries,
      usageTotals,
      sessions,
      recentActivity,
      webhookDeliveries: deliveryRows.map((delivery) => ({
        event: delivery.event_type || "event",
        status: delivery.status || "pending",
        attempts: delivery.attempts || 0,
        httpStatus: delivery.http_status,
        createdAt: delivery.created_at,
        sessionId: delivery.session_id
      }))
    });
  } catch (error) {
    if (isAuthenticationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
