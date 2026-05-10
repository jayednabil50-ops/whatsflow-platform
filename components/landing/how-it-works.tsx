import Link from "next/link";
import { ArrowRight, QrCode, MessageSquare, BarChart3 } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: QrCode,
    title: "Connect Your WhatsApp",
    description:
      "Scan the QR code displayed in your dashboard to link your WhatsApp account. Takes under 30 seconds.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Create Your Message",
    description:
      "Send text, images, documents, voice messages, contacts, polls, and location via a simple REST API.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Send & Analyze",
    description:
      "Track delivery receipts, webhook events, and session health in real-time from your dashboard.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-y border-white/[0.05] bg-white/[0.01]" id="how-it-works">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">
            Simple Process · No Technical Knowledge Required
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white">
            How WASenderApi Works For You
          </h2>
          <p className="mt-3 text-white/45 max-w-xl mx-auto leading-7">
            Get started in minutes with our simple, 3-step process.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-5 md:grid-cols-3">
          {/* Connector lines (desktop) */}
          <div className="pointer-events-none absolute hidden md:block left-[33.33%] top-10 right-[33.33%] h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-all duration-300 hover:border-emerald-500/25 hover:bg-white/[0.04]"
            >
              {/* Number badge */}
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-sm font-bold text-black shadow-[0_4px_20px_rgba(52,211,153,0.3)]">
                  {step.number}
                </span>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-10 h-5 w-5 text-emerald-500/20 z-10" />
                )}
                <step.icon className="h-5 w-5 text-emerald-400/60" />
              </div>

              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-7 text-white/40">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 shadow-[0_0_32px_rgba(52,211,153,0.2)] hover:shadow-[0_0_48px_rgba(52,211,153,0.35)]"
          >
            Start Your Free Trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
