import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";

const SDKS: { name: string; icon: string; description: string; href: Route }[] = [
  {
    name: "Node.js",
    icon: "🟩",
    description: "Full TypeScript SDK with async support and type-safe request/response models.",
    href: "/docs" as Route,
  },
  {
    name: "Python",
    icon: "🐍",
    description: "Async-friendly Python client with Pydantic models and auto retry logic.",
    href: "/docs" as Route,
  },
  {
    name: "Laravel",
    icon: "🔴",
    description: "Service provider and Facade ready. Drop into any Laravel 10+ project instantly.",
    href: "/docs" as Route,
  },
  {
    name: "n8n",
    icon: "🔗",
    description: "Visual automation node. Build WhatsApp workflows without writing code.",
    href: "/docs" as Route,
  },
];

export function SdkSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6 py-24" id="sdks">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5 text-xs font-semibold text-emerald-400 tracking-wide uppercase mb-5">
          Developer Resources
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white">
          SDK Libraries For Your Favorite Platform
        </h2>
        <p className="mt-3 text-white/45 max-w-xl mx-auto leading-7">
          Integrate into your applications with our official SDK libraries
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SDKS.map((sdk) => (
          <div
            key={sdk.name}
            className="group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:border-emerald-500/25 hover:bg-white/[0.04]"
          >
            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-2xl transition-all duration-300 group-hover:border-emerald-500/25">
              {sdk.icon}
            </div>

            {/* Name */}
            <h3 className="text-base font-semibold text-white">{sdk.name}</h3>

            {/* Description */}
            <p className="mt-2 flex-1 text-sm leading-7 text-white/40">{sdk.description}</p>

            {/* Link */}
            <Link
              href={sdk.href}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View Documentation
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
