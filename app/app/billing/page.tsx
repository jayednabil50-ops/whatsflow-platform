import Link from "next/link";
import { CheckCircle2, CreditCard, FileText, Plus } from "lucide-react";
import {
  formatTrialEndsAt,
  getWorkspaceContext
} from "@/lib/platform/workspace";
import { pricingPlans } from "@/lib/mocks/data";
import { createClient } from "@/lib/supabase/server";
import { listSessions } from "@/lib/whatsapp/supabase-session-manager";

const invoices = [
  { invoice: "INV-2026-001", date: "May 5, 2026", amount: "$45.00", status: "Draft" },
  { invoice: "INV-2026-000", date: "Apr 5, 2026", amount: "$0.00", status: "Trial" }
];

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const workspace = user ? await getWorkspaceContext(user.id) : null;
  const sessions = user ? await listSessions(user.id) : [];
  const sessionLimit = workspace?.entitlement.sessionLimit ?? 1;
  const planLabel = workspace?.entitlement.planLabel || "2-day trial";
  const accessWindow = formatTrialEndsAt(workspace?.entitlement.expiresAt, {
    isUnlimited: workspace?.entitlement.isUnlimited
  });
  const usagePercent =
    sessionLimit === null
      ? 100
      : Math.min(100, Math.round((sessions.length / Math.max(1, sessionLimit)) * 100));
  const sessionLimitLabel = sessionLimit === null ? "Unlimited" : sessionLimit.toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Billing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Plan, quota, and invoices</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Your billing surface is ready for Stripe or Paddle. Trial access, session quota, and upgrade slots already reflect the connected workspace.
          </p>
        </div>
        <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
          <Plus className="h-4 w-4" />
          Add payment method
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1fr]">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Current subscription</h2>
          </div>
          <div className="mt-5 rounded-md border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Plan</p>
              <span className="rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{planLabel}</span>
            </div>
            <p className="mt-3 text-4xl font-semibold">{planLabel}</p>
            <p className="mt-2 text-sm text-muted-foreground">Access window {accessWindow}</p>
            <div className="mt-5 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {sessions.length} of {sessionLimitLabel} sessions used
            </p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Available upgrades</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {pricingPlans.slice(1).map((plan) => (
              <div key={plan.name} className="rounded-md border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="font-semibold text-accent">{plan.price}/mo</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.sessions}</p>
                <Link href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-accent">Compare plan</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Invoices</h2>
        </div>
        <div className="mt-5 grid gap-3">
          {invoices.map((invoice) => (
            <div key={invoice.invoice} className="flex flex-col justify-between gap-3 rounded-md border border-border bg-background/70 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">{invoice.invoice}</p>
                <p className="mt-1 text-sm text-muted-foreground">{invoice.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{invoice.amount}</p>
                <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {invoice.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
