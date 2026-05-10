"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCcw, ShieldCheck, Webhook } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { webhookEvents, webhookPayload } from "@/lib/mocks/data";

interface WebhookState {
  metrics: {
    successRate: number;
    averageLatency: string;
    failedRetries: number;
  };
  deliveries: Array<{
    event_type: string | null;
    status: string | null;
    attempts: number | null;
    http_status: number | null;
    created_at: string;
    last_error: string | null;
    session_id: string;
  }>;
}

export default function WebhooksPage() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<WebhookState | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/webhooks");
        if (response.ok) {
          setState(await response.json());
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const deliveryRows =
    state?.deliveries.map((item) => ({
      event: item.event_type || "event",
      status: item.http_status ? `${item.status} (${item.http_status})` : item.status || "pending",
      attempts: item.attempts || 0,
      session: item.session_id,
      detail: item.last_error || new Date(item.created_at).toLocaleString()
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Realtime events</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Webhook deliveries</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Production-ready surface for event selection, signed payloads, retries, latency, and replay controls.
          </p>
        </div>
        <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
          <RefreshCcw className="h-4 w-4" />
          Replay failed
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {[ 
          ["Delivery success", `${state?.metrics.successRate || 0}%`, "Recent attempts"],
          ["Average latency", state?.metrics.averageLatency || "n/a", "Calculated by your receiving endpoint"],
          ["Failed retries", `${state?.metrics.failedRetries || 0}`, "Waiting for the next replay"]
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-md border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1fr]">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Enabled events</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">These are the event names the future backend should persist per session.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {webhookEvents.map((event) => (
              <span key={event} className="rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                {event}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-border bg-background/70 p-4">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-muted-foreground">Every payload should be signed with HMAC and replay-protected by timestamp.</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent">
            <CheckCircle2 className="h-4 w-4" />
            Sample event payload
          </div>
          <pre className="overflow-x-auto font-mono text-xs leading-6 text-emerald-50">{webhookPayload}</pre>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Delivery attempts</h2>
        <div className="mt-5">
          <DataTable rows={deliveryRows} />
        </div>
      </section>
    </div>
  );
}
