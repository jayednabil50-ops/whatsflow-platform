"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  KeyRound,
  MessageSquare,
  Plus,
  Settings,
  BookOpen,
  Webhook,
  BarChart3,
  Users,
  CreditCard,
  LogOut,
  Zap,
  type LucideIcon
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/usage", label: "Analytics", icon: BarChart3 },
  { href: "/app/sessions/new", label: "New Session", icon: Plus },
  { href: "/app/groups", label: "Groups", icon: Users, badge: "New" },
  { href: "/app/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/app/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/docs", label: "Documentation", icon: BookOpen },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const sections = [
  { title: "OVERVIEW", items: navItems.slice(0, 2) },
  { title: "WHATSAPP", items: navItems.slice(2, 6) },
  { title: "ACCOUNT", items: navItems.slice(6) },
];

export function AppSidebar({
  showAdmin = false,
  userEmail
}: {
  showAdmin?: boolean;
  userEmail?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/20">
          <MessageSquare className="h-4 w-4 text-black" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-400 live-dot" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold tracking-tight text-foreground truncate">{BRAND}</p>
          <p className="text-[10px] text-muted-foreground">WhatsApp Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/app" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-all duration-150",
                      active
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-accent" : "text-muted-foreground/70 group-hover:text-foreground"
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-accent-foreground">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <span className="h-1 w-1 rounded-full bg-accent shrink-0" />
                    )}
                  </Link>
                );
              })}
              {section.title === "ACCOUNT" && showAdmin && (
                <Link
                  href={"/app/admin" as any}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-all duration-150",
                    pathname === "/app/admin"
                      ? "bg-accent/10 text-accent font-semibold"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3">
        <div className="mb-2 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/[0.08] to-transparent p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <p className="text-[11px] font-bold text-accent">Owner Access</p>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Unlimited sessions & full platform access.
          </p>
        </div>
        <button className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-muted-foreground transition hover:bg-muted/60 hover:text-foreground">
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
