import { createHmac } from "crypto";
import axios from "axios";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleConfig } from "@/lib/supabase/config";
import { bumpUsageDaily } from "./message-store";

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: any;
}

export interface WebhookDelivery {
  id: string;
  sessionId: string;
  userId?: string;
  url: string;
  payload: WebhookPayload;
  secret?: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: number;
  lastError?: string;
  httpStatus?: number;
  responseBody?: string;
  createdAt: number;
  deliveredAt?: number;
}

type QueueWebhookOptions = {
  secret?: string;
  userId?: string;
};

type WebhookRuntimeStore = {
  deliveryQueue: Map<string, WebhookDelivery>;
  processingQueue: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __whatsflowWebhookRuntime: WebhookRuntimeStore | undefined;
}

function createWebhookRuntimeStore(): WebhookRuntimeStore {
  return {
    deliveryQueue: new Map<string, WebhookDelivery>(),
    processingQueue: false
  };
}

const runtimeStore =
  globalThis.__whatsflowWebhookRuntime ??
  (globalThis.__whatsflowWebhookRuntime = createWebhookRuntimeStore());
const supabase = hasSupabaseServiceRoleConfig() ? getSupabaseAdminClient() : null;
const deliveryQueue = runtimeStore.deliveryQueue;

/**
 * Queue a webhook for delivery with automatic retry
 */
export async function queueWebhookDelivery(
  sessionId: string,
  url: string,
  payload: WebhookPayload,
  maxAttempts: number = 3,
  options: QueueWebhookOptions = {}
): Promise<string> {
  const deliveryId = `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const delivery: WebhookDelivery = {
    id: deliveryId,
    sessionId,
    userId: options.userId,
    url,
    payload,
    secret: options.secret,
    status: "pending",
    attempts: 0,
    maxAttempts,
    createdAt: Date.now()
  };

  deliveryQueue.set(deliveryId, delivery);

  // Save to database
  if (supabase) {
    try {
      await supabase.from("webhook_deliveries").insert({
        id: deliveryId,
        session_id: sessionId,
        event_type: payload.event,
        payload: payload,
        status: "pending",
        attempts: 0
      });
    } catch (err) {
      console.error("[WEBHOOK] Failed to save delivery to DB:", err);
    }
  }

  // Start processing if not already running
  if (!runtimeStore.processingQueue) {
    void processWebhookQueue();
  }

  return deliveryId;
}

export function clearWebhookQueueForSession(sessionId: string): void {
  for (const [deliveryId, delivery] of deliveryQueue.entries()) {
    if (delivery.sessionId === sessionId) {
      deliveryQueue.delete(deliveryId);
    }
  }
}

/**
 * Process webhook delivery queue
 */
async function processWebhookQueue() {
  if (runtimeStore.processingQueue) return;
  runtimeStore.processingQueue = true;

  try {
    while (deliveryQueue.size > 0) {
      for (const [deliveryId, delivery] of deliveryQueue.entries()) {
        // Skip if not ready for retry
        if (delivery.nextRetryAt && delivery.nextRetryAt > Date.now()) {
          continue;
        }

        // Skip if already delivered
        if (delivery.status === "delivered") {
          deliveryQueue.delete(deliveryId);
          continue;
        }

        // Attempt delivery
        await attemptDelivery(delivery);

        // Remove from queue if delivered or max attempts reached
        if (delivery.status !== "pending" || delivery.attempts >= delivery.maxAttempts) {
          deliveryQueue.delete(deliveryId);
        }
      }

      // Small delay between processing cycles
      if (deliveryQueue.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } finally {
    runtimeStore.processingQueue = false;
  }
}

/**
 * Attempt to deliver a webhook
 */
async function attemptDelivery(delivery: WebhookDelivery): Promise<void> {
  delivery.attempts++;

  try {
    console.log(`[WEBHOOK] Attempting delivery #${delivery.attempts} to ${delivery.url}`);

    const rawBody = JSON.stringify(delivery.payload);
    const timestamp = Date.now().toString();
    const signature = delivery.secret
      ? `sha256=${createHmac("sha256", delivery.secret)
          .update(`${timestamp}.${rawBody}`)
          .digest("hex")}`
      : undefined;

    const response = await axios.post(delivery.url, rawBody, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "WhatsFlow/1.0",
        "X-WhatsFlow-Delivery": delivery.id,
        "X-WhatsFlow-Event": delivery.payload.event,
        "X-WhatsFlow-Timestamp": timestamp,
        ...(signature ? { "X-WhatsFlow-Signature": signature } : {})
      },
      timeout: 30000,
      validateStatus: () => true
    });

    const success = response.status >= 200 && response.status < 300;
    delivery.httpStatus = response.status;
    delivery.responseBody =
      typeof response.data === "string"
        ? response.data.slice(0, 2000)
        : JSON.stringify(response.data ?? {}).slice(0, 2000);

    if (success) {
      delivery.status = "delivered";
      delivery.deliveredAt = Date.now();

      console.log(`[WEBHOOK] Successfully delivered to ${delivery.url}`);

      // Update database
      if (supabase) {
        try {
          await supabase
            .from("webhook_deliveries")
            .update({
              status: "delivered",
              http_status: response.status,
              attempts: delivery.attempts,
              delivered_at: new Date().toISOString()
            })
            .eq("id", delivery.id);
        } catch (err) {
          console.error("[WEBHOOK] Failed to update delivery status in DB:", err);
        }
      }

      if (delivery.userId) {
        await bumpUsageDaily({
          userId: delivery.userId,
          sessionId: delivery.sessionId,
          webhookDelta: 1
        });
      }
    } else {
      // Failed delivery
      delivery.lastError = `HTTP ${response.status}`;

      if (delivery.attempts < delivery.maxAttempts) {
        // Schedule retry with exponential backoff
        const backoffMs = Math.pow(2, delivery.attempts - 1) * 1000;
        delivery.nextRetryAt = Date.now() + backoffMs;
        delivery.status = "pending";

        console.log(
          `[WEBHOOK] Delivery failed with status ${response.status}. Retrying in ${backoffMs}ms`
        );

        // Update database
        if (supabase) {
          try {
            await supabase
              .from("webhook_deliveries")
              .update({
                status: "pending",
                http_status: response.status,
                attempts: delivery.attempts,
                last_error: delivery.lastError,
                next_retry_at: new Date(delivery.nextRetryAt).toISOString()
              })
              .eq("id", delivery.id);
          } catch (err) {
            console.error("[WEBHOOK] Failed to update delivery retry in DB:", err);
          }
        }
      } else {
        // Max attempts reached. This is a recoverable user-config issue (the
        // user's webhook URL responded with a non-2xx status). We surface it
        // as a warning rather than an error so dev overlays do not flag it.
        delivery.status = "failed";

        console.warn(
          `[WEBHOOK] Delivery failed after ${delivery.maxAttempts} attempts to ${delivery.url}`
        );

        // Update database
        if (supabase) {
          try {
            await supabase
              .from("webhook_deliveries")
              .update({
                status: "failed",
                http_status: response.status,
                attempts: delivery.attempts,
                last_error: delivery.lastError
              })
              .eq("id", delivery.id);
          } catch (err) {
            console.error("[WEBHOOK] Failed to update delivery failure in DB:", err);
          }
        }
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    delivery.lastError = errorMessage;

    if (delivery.attempts < delivery.maxAttempts) {
      // Schedule retry with exponential backoff
      const backoffMs = Math.pow(2, delivery.attempts - 1) * 1000;
      delivery.nextRetryAt = Date.now() + backoffMs;
      delivery.status = "pending";

      console.log(`[WEBHOOK] Error during delivery: ${errorMessage}. Retrying in ${backoffMs}ms`);

      // Update database
      if (supabase) {
        try {
          await supabase
            .from("webhook_deliveries")
            .update({
              status: "pending",
              attempts: delivery.attempts,
              last_error: errorMessage,
              next_retry_at: new Date(delivery.nextRetryAt).toISOString()
            })
            .eq("id", delivery.id);
        } catch (err) {
          console.error("[WEBHOOK] Failed to update delivery error in DB:", err);
        }
      }
    } else {
      // Max attempts reached after network errors. Same logic as above:
      // user-side connectivity problem, log as warning not error.
      delivery.status = "failed";

      console.warn(
        `[WEBHOOK] Delivery failed after ${delivery.maxAttempts} attempts due to: ${errorMessage}`
      );

      // Update database
      if (supabase) {
        try {
          await supabase
            .from("webhook_deliveries")
            .update({
              status: "failed",
              attempts: delivery.attempts,
              last_error: errorMessage
            })
            .eq("id", delivery.id);
        } catch (err) {
          console.error("[WEBHOOK] Failed to update delivery error in DB:", err);
        }
      }
    }
  }
}

/**
 * Get delivery status
 */
export function getDeliveryStatus(deliveryId: string): WebhookDelivery | undefined {
  return deliveryQueue.get(deliveryId);
}

/**
 * Get all pending deliveries for a session
 */
export function getPendingDeliveries(sessionId: string): WebhookDelivery[] {
  return Array.from(deliveryQueue.values()).filter(
    (d) => d.sessionId === sessionId && d.status === "pending"
  );
}

/**
 * Manually retry a failed delivery
 */
export async function retryDelivery(deliveryId: string): Promise<boolean> {
  const delivery = deliveryQueue.get(deliveryId);
  if (!delivery) return false;

  delivery.attempts = 0;
  delivery.status = "pending";
  delivery.nextRetryAt = undefined;
  delivery.lastError = undefined;

  // Restart queue processing
  if (!runtimeStore.processingQueue) {
    void processWebhookQueue();
  }

  return true;
}

/**
 * Start periodic queue processor (call this on app startup)
 */
export function startWebhookQueueProcessor(intervalMs: number = 5000) {
  setInterval(() => {
    if (!runtimeStore.processingQueue && deliveryQueue.size > 0) {
      void processWebhookQueue();
    }
  }, intervalMs);

  console.log("[WEBHOOK] Queue processor started");
}
