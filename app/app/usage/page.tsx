"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";

interface UsageSeriesRow {
  day: string;
  sent: number;
  received: number;
  webhooks: number;
}

interface UsagePayload {
  usageSeries: UsageSeriesRow[];
  usageTotals: {
    sent: number;
    received: number;
    webhooks: number;
  };
}

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsagePayload | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const payload = await response.json();
          setData({
            usageSeries: payload.usageSeries || [],
            usageTotals: payload.usageTotals || { sent: 0, received: 0, webhooks: 0 }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const usageSeries = data?.usageSeries || [];
  const totals = data?.usageTotals || { sent: 0, received: 0, webhooks: 0 };
  const maxSent = Math.max(1, ...usageSeries.map((item) => item.sent));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Usage and delivery analytics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Track message volume, replies, and webhook traffic from the last 7 days of live workspace activity.
          </p>
        </div>
        <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Sent", totals.sent.toLocaleString(), "Outbound messages"],
          ["Received", totals.received.toLocaleString(), "Customer replies"],
          ["Webhooks", totals.webhooks.toLocaleString(), "Delivered endpoint calls"]
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-md border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Weekly volume</h2>
            <p className="mt-1 text-sm text-muted-foreground">Traffic split by sent, received, and webhook deliveries.</p>
          </div>
          <TrendingUp className="h-5 w-5 text-accent" />
        </div>
        <div className="mt-8 flex h-80 items-end gap-3">
          {usageSeries.map((item) => (
            <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-64 w-full items-end gap-1 rounded-md border border-border bg-background/70 p-1.5">
                <div className="w-full rounded bg-accent" style={{ height: `${Math.max(12, (item.sent / maxSent) * 100)}%` }} />
                <div className="w-full rounded bg-signal-cyan" style={{ height: `${Math.max(10, (item.received / maxSent) * 100)}%` }} />
                <div className="w-full rounded bg-signal-rose" style={{ height: `${Math.max(6, (item.webhooks / maxSent) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{item.day}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Daily raw usage</h2>
        <div className="mt-5">
          <DataTable
            rows={usageSeries.map((item) => ({
              day: item.day,
              sent: item.sent,
              received: item.received,
              webhooks: item.webhooks
            }))}
          />
        </div>
      </section>
    </div>
  );
}
