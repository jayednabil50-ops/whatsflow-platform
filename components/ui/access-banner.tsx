"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Sparkles, Timer, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AccessMode = "owner" | "subscription" | "trial" | "expired" | string;

function formatRemaining(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / 86_400_000);
  const hours = Math.floor((safe % 86_400_000) / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

export function AccessBanner({
  accessMode,
  expiresAtIso,
  isUnlimited,
}: {
  accessMode: AccessMode;
  expiresAtIso: string | null;
  isUnlimited?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (accessMode !== "trial" && accessMode !== "subscription") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [accessMode]);

  if (isUnlimited || accessMode === "owner") {
    return (
      <div className="reveal is-visible flex items-center gap-3 rounded-2xl border border-accent/25 bg-gradient-to-r from-accent/[0.08] via-accent/[0.04] to-transparent px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15">
          <Sparkles className="h-4 w-4 text-accent" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Owner unlimited access</p>
          <p className="text-xs text-muted-foreground">No session limits, no expiration.</p>
        </div>
      </div>
    );
  }

  if (accessMode === "expired") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/[0.04] to-transparent p-5 sm:flex-row sm:items-center animate-bounce-in">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/15">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
            Your workspace access has expired
          </p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            Sessions are disconnected and the API will reject calls. Subscribe to restore access immediately.
          </p>
        </div>
        <Link
          href="/app/billing"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 hover:-translate-y-0.5"
        >
          Subscribe now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (accessMode === "trial" && expiresAtIso) {
    const remaining = formatRemaining(Date.parse(expiresAtIso) - now);
    const isLow = remaining.days === 0 && remaining.hours < 6;

    return (
      <div className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center transition-colors",
        isLow
          ? "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent"
          : "border-cyan-500/25 bg-gradient-to-r from-cyan-500/[0.08] via-cyan-500/[0.04] to-transparent"
      )}>
        <span className={cn(
          "grid h-10 w-10 place-items-center rounded-xl",
          isLow ? "bg-amber-500/15" : "bg-cyan-500/15"
        )}>
          <Timer className={cn("h-5 w-5", isLow ? "text-amber-500" : "text-cyan-500")} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {isLow ? "Trial ending soon" : "Free trial active"}
          </p>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-1.5 text-xs text-muted-foreground">
            Time left:
            <span className={cn(
              "font-mono font-bold",
              isLow ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400"
            )}>
              {remaining.days > 0 && `${remaining.days}d `}
              {String(remaining.hours).padStart(2, "0")}h {String(remaining.minutes).padStart(2, "0")}m {String(remaining.seconds).padStart(2, "0")}s
            </span>
          </p>
        </div>
        <Link
          href="/app/billing"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5"
        >
          Upgrade <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (accessMode === "subscription") {
    return (
      <div className="reveal is-visible flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.07] to-transparent px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Subscription active</p>
          {expiresAtIso && (
            <p className="text-xs text-muted-foreground">
              Renews on {new Date(expiresAtIso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
