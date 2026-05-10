"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Menu, MessageCircle, X } from "lucide-react";
import { BRAND } from "@/lib/brand";

type NavItem = {
  label: string;
  href: string;
  badge?: "NEW" | "BETA";
};

type NavGroup = {
  section: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    section: "Overview",
    items: [
      { label: "Introduction", href: "/api-docs" },
    ],
  },
  {
    section: "Getting Started",
    items: [
      { label: "Authentication", href: "/api-docs/getting-started/authentication" },
      { label: "n8n Integration", href: "/api-docs/getting-started/n8n-integration", badge: "NEW" },
      { label: "Using Proxies", href: "/api-docs/getting-started/proxies" },
    ],
  },
  {
    section: "Developer SDKs",
    items: [
      { label: "Official SDKs – Node.js, Python & Laravel", href: "/api-docs/developer-sdks/official-sdks" },
    ],
  },
  {
    section: "API Reference",
    items: [
      { label: "Send Message", href: "/api-docs/api-reference/send-message" },
      { label: "Session Management", href: "/api-docs/api-reference/sessions" },
      { label: "Webhooks", href: "/api-docs/api-reference/webhooks" },
    ],
  },
];

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 pb-6 pt-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-black shadow-[0_0_16px_rgba(52,211,153,0.2)]">
          <MessageCircle className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{BRAND}</p>
          <p className="text-[10px] text-white/30">API Documentation</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="space-y-6">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as Parameters<typeof Link>[0]["href"]}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-all duration-150 ${
                        isActive
                          ? "border-l-2 border-emerald-500 bg-emerald-500/[0.08] font-medium text-emerald-400"
                          : "border-l-2 border-transparent text-white/45 hover:bg-white/[0.04] hover:text-white/75"
                      }`}
                    >
                      <span className="leading-snug">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

export function DocsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_28px_rgba(52,211,153,0.35)] text-black lg:hidden"
        aria-label="Open navigation"
      >
        <BookOpen className="h-5 w-5" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-white/[0.07] bg-[#0a0a0a] px-4 py-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-white/30">Navigation</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent pathname={pathname} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-white/[0.06] bg-[#0a0a0a] px-4 py-6 lg:block lg:sticky lg:top-0">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}
