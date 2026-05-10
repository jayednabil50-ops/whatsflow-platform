import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type MessageRecordInput = {
  sessionId: string;
  userId: string;
  direction: "inbound" | "outbound";
  remoteJid: string;
  messageType: string;
  body: string;
  status: string;
  externalMessageId?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  messageTimestamp?: number | null;
  mediaMime?: string | null;
  mediaUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export async function bumpUsageDaily(input: {
  userId: string;
  sessionId: string;
  sentDelta?: number;
  receivedDelta?: number;
  webhookDelta?: number;
}): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const sentDelta = input.sentDelta || 0;
  const receivedDelta = input.receivedDelta || 0;
  const webhookDelta = input.webhookDelta || 0;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.rpc("bump_usage_daily", {
    target_user_id: input.userId,
    target_session_id: input.sessionId,
    target_day: today,
    sent_delta: sentDelta,
    received_delta: receivedDelta,
    webhook_delta: webhookDelta
  });

  if (!error) {
    return;
  }

  const functionMissing =
    error.code === "PGRST202" ||
    error.message.includes("bump_usage_daily") ||
    error.message.includes("Could not find the function");

  if (!functionMissing) {
    console.error("[USAGE] Failed to bump usage counters:", error);
    return;
  }

  const { data: existingRow, error: existingRowError } = await supabase
    .from("usage_daily")
    .select("id, messages_sent, messages_received, webhook_deliveries")
    .eq("user_id", input.userId)
    .eq("session_id", input.sessionId)
    .eq("day", today)
    .maybeSingle();

  if (existingRowError) {
    console.error("[USAGE] Failed to load fallback usage row:", existingRowError);
    return;
  }

  const currentUsage = existingRow as
    | {
        id: number;
        messages_sent?: number | null;
        messages_received?: number | null;
        webhook_deliveries?: number | null;
      }
    | null;

  if (currentUsage?.id) {
    const { error: updateError } = await supabase
      .from("usage_daily")
      .update({
        messages_sent: (currentUsage.messages_sent || 0) + Math.max(sentDelta, 0),
        messages_received:
          (currentUsage.messages_received || 0) + Math.max(receivedDelta, 0),
        webhook_deliveries:
          (currentUsage.webhook_deliveries || 0) + Math.max(webhookDelta, 0)
      })
      .eq("id", currentUsage.id);

    if (updateError) {
      console.error("[USAGE] Failed to update fallback usage row:", updateError);
    }

    return;
  }

  const { error: insertError } = await supabase.from("usage_daily").insert({
    user_id: input.userId,
    session_id: input.sessionId,
    day: today,
    messages_sent: Math.max(sentDelta, 0),
    messages_received: Math.max(receivedDelta, 0),
    webhook_deliveries: Math.max(webhookDelta, 0)
  });

  if (insertError) {
    console.error("[USAGE] Failed to insert fallback usage row:", insertError);
  }
}

export async function insertMessageRecord(input: MessageRecordInput): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdminClient().from("messages").insert({
      session_id: input.sessionId,
      user_id: input.userId,
      direction: input.direction,
      remote_jid: input.remoteJid,
      message_type: input.messageType,
      body: input.body,
      status: input.status,
      external_message_id: input.externalMessageId,
      media_mime: input.mediaMime || null,
      media_url: input.mediaUrl || null,
      error_code: input.errorCode || null,
      error_message: input.errorMessage || null
    });

    if (error) {
      const duplicateConstraint = "messages_session_direction_external_message_key";
      if (
        error.code === "23505" ||
        error.message.includes(duplicateConstraint)
      ) {
        return false;
      }

      console.error("[DB] Failed to save WhatsApp message:", error);
      return false;
    }

    await bumpUsageDaily({
      userId: input.userId,
      sessionId: input.sessionId,
      sentDelta: input.direction === "outbound" ? 1 : 0,
      receivedDelta: input.direction === "inbound" ? 1 : 0
    });

    return true;
  } catch (error) {
    console.error("[DB] Failed to save WhatsApp message:", error);
    return false;
  }
}
