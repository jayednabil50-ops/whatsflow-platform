import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, LockKeyhole, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Nav } from "@/components/nav";
import { pricingPlans } from "@/lib/mocks/data";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#08090C] page-noise">
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-20 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-1.5 text-xs font-medium text-emerald-400">
            <Sparkles className="h-3 w-3" />
            Simple pricing
          </div>
          <h1 className="mt-7 text-5xl font-bold tracking-[-0.03em] text-white sm:text-6xl">
            Start with a 2-day trial, then keep sessions live with a subscription.
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-lg leading-8 text-white/35">
            New workspaces start on a free 2-day trial. Owner workspaces stay unlimited, and paid subscriptions keep connected numbers active after the trial ends.
          </p>
        </div>

        <div className="mt-14 flex justify-center">
          <div className="w-full max-w-lg">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.06] to-transparent p-10 shadow-[0_0_64px_rgba(52,211,153,0.08)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                  <span className="rounded-lg bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">Active</span>
                </div>
                <p className="mt-6 text-6xl font-bold tracking-tight text-white">{plan.price}</p>
                <p className="mt-2 text-sm text-emerald-400">{plan.sessions}</p>
                <p className="mt-5 text-sm leading-7 text-white/40">{plan.description}</p>
                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/50">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="focus-ring group mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-sm font-semibold text-black shadow-[0_0_24px_rgba(52,211,153,0.2)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(52,211,153,0.35)]"
                >
                  Start the 2-day trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-white/30">
          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /> 2-day free trial</span>
          <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-emerald-400" /> No per-message fee</span>
          <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-emerald-400" /> End-to-end encrypted</span>
        </div>

        <section className="mt-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="grid gap-8 lg:grid-cols-[0.5fr_1fr] lg:items-center">
            <div>
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
              <h2 className="mt-5 text-2xl font-bold text-white">Safety is included for everyone.</h2>
              <p className="mt-3 text-sm leading-7 text-white/35">
                Account protection features are not locked behind a paywall.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Queue pacing", "Spread traffic instead of sending bursts."],
                ["Endpoint caps", "High-risk actions are labeled and limited."],
                ["Consent-first", "Avoid spammy product promises and risky workflows."]
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-white/35">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
