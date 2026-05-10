import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const BULLET_CODE = `const response = await fetch(
  "https://api.wasenderapi.com/api/send-text",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
    },
    body: JSON.stringify({
      to:   "6281234567890",
      text: "Hello from WASenderAPI!",
    }),
  }
);`;

export function CtaBottomSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6 pb-24">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D1117]">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(37,211,102,0.1),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <div className="relative grid gap-12 px-8 py-14 sm:px-12 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-5">
              Premium Access
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white leading-tight">
              Fast, Easy, Affordable
              <br />
              WhatsApp API
            </h2>

            <ul className="mt-7 space-y-3">
              {[
                "No credit card required to start",
                "3-day free trial included",
                "Cancel anytime, no questions asked",
              ].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-white/55">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 shadow-[0_0_36px_rgba(52,211,153,0.3)] hover:shadow-[0_0_52px_rgba(52,211,153,0.45)]"
            >
              Start Your Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Right — code + response */}
          <div className="space-y-3">
            {/* Code block */}
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#010409]">
              <div className="flex items-center gap-1.5 border-b border-white/[0.05] bg-[#0D1117] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-xs text-white/25 font-mono">send-message.js</span>
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-[1.65] text-emerald-50/80">
                <code>{BULLET_CODE}</code>
              </pre>
            </div>

            {/* Animated success response */}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-black">
                ✓
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Message Sent</p>
                <p className="mt-0.5 text-xs text-white/40 font-mono">
                  {"{ status: 200, messageId: \"BAE5F1A2...\" }"}
                </p>
              </div>
            </div>

            {/* Chat bubble preview */}
            <div className="flex justify-start">
              <div className="inline-flex max-w-[80%] flex-col rounded-2xl rounded-tl-sm bg-[#202C33] px-4 py-2.5">
                <p className="text-[13px] text-white/85">Hello from WASenderAPI! 👋</p>
                <p className="mt-1 text-right text-[10px] text-white/30">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
