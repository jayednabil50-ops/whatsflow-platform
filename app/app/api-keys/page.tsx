"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";

interface ApiKeyRow {
  sessionId: string;
  sessionName: string;
  status: string;
  prefix: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ApiKeyRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/api-keys");
        if (response.ok) {
          const payload = await response.json();
          setRows(payload.keys || []);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Security</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">API keys</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Generate session-scoped keys from an individual session page. This screen shows which connected numbers already have public API access.
          </p>
        </div>
        <Link
          href="/app/sessions/new"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          <KeyRound className="h-4 w-4" />
          Create session
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1fr]">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">How session keys work</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Each WhatsApp number can expose its own bearer token. Only the hash and prefix are stored, and regeneration immediately invalidates the previous token.
          </p>
          <div className="mt-5 rounded-md border border-border bg-background/70 p-4">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-muted-foreground">
                Use the public endpoint `POST /api/send-message` with a session key after the number is connected.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Active keys</h2>
          <div className="mt-5">
            <DataTable
              rows={rows.map((row) => ({
                session: row.sessionName,
                status: row.status,
                prefix: row.prefix || "not generated",
                updated: new Date(row.updatedAt).toLocaleString()
              }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
