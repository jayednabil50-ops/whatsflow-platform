"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutDashboard, MessageCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

const links = [
  ["/#integration", "Integration"],
  ["/#how-it-works", "How it works"],
  ["/#pricing", "Pricing"],
  ["/docs", "Docs"],
] as const;

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/app");

  if (isApp) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#08090C]/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.18)]">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{BRAND}</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-white/40 md:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="transition-colors duration-150 hover:text-white/80">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="focus-ring hidden rounded-lg px-3.5 py-2 text-[13px] font-medium text-white/50 transition-colors duration-150 hover:text-white/80 sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/app"
            className="focus-ring hidden items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[13px] font-medium text-white/60 transition-all duration-150 hover:border-white/[0.15] hover:text-white sm:inline-flex"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link
            href="/register"
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-[13px] font-semibold text-black transition-all duration-200 hover:shadow-[0_0_24px_rgba(52,211,153,0.3)]"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-1 grid h-9 w-9 place-items-center rounded-lg text-white/50 transition hover:text-white md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.04] bg-[#08090C] px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/app"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}