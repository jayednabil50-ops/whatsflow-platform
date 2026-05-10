import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">
      {/* Ambient radial glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(37,211,102,0.13),transparent)]" />
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-6 text-center">
        {/* Rating badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-2 text-sm font-medium text-emerald-400 mb-8 backdrop-blur-sm">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
            ))}
            <div className="relative h-3.5 w-3.5 overflow-hidden">
              <Star className="absolute inset-0 h-3.5 w-3.5 text-emerald-400/30" />
              <div className="absolute inset-0 w-[50%] overflow-hidden">
                <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
              </div>
            </div>
          </div>
          Rated 4.5/5.0 on Sourceforge
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-[-0.03em] text-white leading-[1.06]">
          Low-Cost WhatsApp API
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            For Developers
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-white/50">
          Unlimited messages, multiple WhatsApp sessions, webhook support and developer-friendly API
          with no per-message fees.
        </p>

        {/* CTA buttons */}
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-7 py-3.5 text-sm font-semibold text-black shadow-[0_0_36px_rgba(52,211,153,0.3)] transition-all duration-300 hover:shadow-[0_0_52px_rgba(52,211,153,0.45)]"
          >
            Start Your Free Trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-white/[0.18] hover:text-white hover:bg-white/[0.07]"
          >
            View API Docs
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-white/35">
          {["No credit card required", "3-day free trial", "Cancel anytime"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t}
            </span>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-10 flex flex-col items-center gap-1">
          <p className="text-[11px] font-medium tracking-widest uppercase text-white/20">
            Scroll to explore
          </p>
          <p className="text-[11px] text-white/20">Simple Integration · Powerful API</p>
          <div className="mt-2 h-6 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
