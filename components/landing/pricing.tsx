"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Shield } from "lucide-react";

const FEATURES = [
  "Unlimited Contacts",
  "No Daily Message Cap",
  "MCP Server Integration",
  "Send to Users/Groups/Channels",
  "Full API Access",
  "Real-time Webhooks",
  "Priority Support",
];

type Plan = {
  name: string;
  monthly: number;
  sessions: number;
  perSession: string;
  popular?: boolean;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  { name: "Basic", monthly: 6, sessions: 1, perSession: "$6.00" },
  { name: "Pro", monthly: 15, sessions: 3, perSession: "$5.00", popular: true },
  { name: "Plus", monthly: 30, sessions: 6, perSession: "$5.00" },
  { name: "Business", monthly: 45, sessions: 10, perSession: "$4.50" },
];

function fmt(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="border-y border-white/[0.05] bg-white/[0.01]" id="pricing">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">
            3-day free trial · Cancel anytime
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white">
            Simple Transparent Pricing
          </h2>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                !yearly
                  ? "bg-white/[0.08] text-white shadow"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                yearly
                  ? "bg-white/[0.08] text-white shadow"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Yearly
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const monthlyPrice = yearly
              ? Math.round(plan.monthly * 0.85 * 100) / 100
              : plan.monthly;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  plan.popular
                    ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-transparent shadow-[0_0_60px_rgba(52,211,153,0.1)]"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent rounded-t-2xl" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold text-black shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                        Most Popular
                      </span>
                    </div>
                  </>
                )}

                {/* Plan name */}
                <h3 className="text-base font-semibold text-white">{plan.name}</h3>

                {/* Price */}
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-white">
                    {fmt(monthlyPrice)}
                  </span>
                  <span className="mb-1 text-sm text-white/40">/mo</span>
                </div>
                {yearly && (
                  <p className="mt-1 text-xs text-emerald-400">
                    {fmt(Math.round(monthlyPrice * 12 * 100) / 100)} billed yearly
                  </p>
                )}

                {/* Session info */}
                <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                  <span className="font-semibold text-white">{plan.sessions}</span>{" "}
                  {plan.sessions === 1 ? "session" : "sessions"} ·{" "}
                  <span className="text-emerald-400">{plan.perSession}/session</span>
                </div>

                {/* Features */}
                <ul className="mt-5 flex-1 space-y-2.5">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-white/50">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/register"
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
                    plan.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_28px_rgba(52,211,153,0.3)] hover:shadow-[0_0_44px_rgba(52,211,153,0.45)]"
                      : "border border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/[0.15] hover:text-white"
                  }`}
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Higher volume */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-7 py-5">
          <div>
            <p className="text-sm font-semibold text-white">Need Higher Volume?</p>
            <p className="mt-0.5 text-sm text-white/40">
              Custom plans available for enterprise teams with dedicated support.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-2.5 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500/50 hover:bg-emerald-500/[0.12]"
          >
            Partner Program →
          </Link>
        </div>

        {/* Paddle note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/25">
          <Shield className="h-3.5 w-3.5" />
          Secure payments powered by Paddle
        </div>
      </div>
    </section>
  );
}
