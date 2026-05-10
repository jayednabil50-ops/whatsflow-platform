"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare, Plus, ShieldCheck, Webhook, Signal,
  ChevronRight, Users, Zap, Activity, BarChart3,
  Clock3, CheckCircle2, AlertCircle, RefreshCw, ArrowUpRight,
  TrendingUp, Globe, Loader2, Copy, Check,
  FileImage, FileText, Mic, ThumbsUp, Send, Sparkles, Terminal, Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AccessBanner } from "@/components/ui/access-banner";

interface Session {
  id: string; name: string; status: string;
  countryCode: string; phone: string;
  connectedPhone?: string; connectedName?: string;
  webhookUrl?: string; createdAt: number;
}

interface DashboardData {
  workspace: {
    plan: string; trialEndsAt: string;
    expiresAtIso?: string | null; accessActive?: boolean;
    sessionLimit: number | null; sessionCount: number;
    fullName?: string | null; email?: string | null;
    accessMode?: string; isUnlimited?: boolean;
  };
  metrics: {
    messagesSentToday: number; messagesReceivedToday: number;
    webhookSuccessRate: number; connectedCount: number;
    sessionLimit: number | null; safetyScore: number;
  };
  liveUsage?: {
    windowLabel: string; inboundCount: number; outboundCount: number;
    webhookCount: number; activeContacts: number; latestMessageAt?: string | null;
  };
  usageSeries: Array<{ day: string; sent: number; received: number; webhooks: number }>;
  webhookDeliveries: Array<{
    event: string; status: string; attempts: number;
    httpStatus?: number | null; createdAt: string; sessionId: string;
  }>;
  recentActivity: Array<{ event: string; detail: string; time: string }>;
  sessions?: Session[];
}

function StatusBadge({ status }: { status: string }) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting" || status === "qr_ready";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
      isConnected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
      isConnecting ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
      "bg-muted text-muted-foreground"
    )}>
      <span className={cn(
        "relative flex h-1.5 w-1.5 rounded-full",
        isConnected ? "bg-emerald-400" : isConnecting ? "bg-amber-400" : "bg-muted-foreground/60"
      )}>
        {(isConnected || isConnecting) && (
          <span className={cn("absolute inset-0 rounded-full animate-ping opacity-75",
            isConnected ? "bg-emerald-400" : "bg-amber-400")} />
        )}
      </span>
      {status}
    </span>
  );
}

function SessionCard({ session }: { session: Session }) {
  const isConnected = session.status === "connected";
  const isConnecting = session.status === "connecting" || session.status === "qr_ready";
  const initials = session.name.slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/app/sessions/${session.id}` as any}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black",
            isConnected ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
            isConnecting ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
            "bg-muted text-muted-foreground"
          )}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{session.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {session.connectedPhone ? `+${session.connectedPhone}` : session.phone}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <StatusBadge status={session.status} />
        {session.webhookUrl && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <Webhook className="h-2.5 w-2.5" /> webhook
          </span>
        )}
      </div>
    </Link>
  );
}

type CodeLang = "curl" | "js" | "python";

function QuickStartPanel() {
  const [lang, setLang] = useState<CodeLang>("curl");
  const [copied, setCopied] = useState(false);

  const snippets: Record<CodeLang, string> = {
    curl: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "remoteJid": "8801712345678@s.whatsapp.net",
    "text": "Hello from WhatsFlow! 👋"
  }'`,
    js: `const res = await fetch('/api/send-message', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer wfk_live_xxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    remoteJid: '8801712345678@s.whatsapp.net',
    text: 'Hello from WhatsFlow! 👋'
  })
});
const { messageId } = await res.json();
console.log('Sent:', messageId);`,
    python: `import requests

r = requests.post(
    'https://your-domain.com/api/send-message',
    headers={'Authorization': 'Bearer wfk_live_xxxxxxxx'},
    json={
        'remoteJid': '8801712345678@s.whatsapp.net',
        'text': 'Hello from WhatsFlow! 👋'
    }
)
print(r.json())`,
  };

  const copy = async () => {
    await navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-bold text-foreground">Quick Start</span>
        </div>
        <div className="flex items-center gap-1">
          {(["curl", "js", "python"] as CodeLang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all",
                lang === l ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l === "js" ? "Node.js" : l === "curl" ? "cURL" : "Python"}
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex-1 bg-muted/30 p-5">
        <button
          onClick={copy}
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:border-accent/40 hover:text-accent"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre className="overflow-x-auto whitespace-pre font-mono text-[11px] leading-6 text-accent/80">{snippets[lang]}</pre>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5">
        <p className="text-[11px] text-muted-foreground">Use your session API key as Bearer token</p>
        <Link href="/docs" className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:opacity-80">
          Full docs <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

const PLATFORM_FEATURES = [
  { icon: MessageSquare, label: "Text Messages",    desc: "Send formatted text replies" },
  { icon: FileImage,    label: "Image & Video",     desc: "Media messages via URL" },
  { icon: FileText,     label: "Documents",         desc: "PDF, DOC, ZIP files" },
  { icon: Mic,          label: "Voice Notes",       desc: "Audio message support" },
  { icon: Hash,         label: "Polls",             desc: "Multi-choice polls" },
  { icon: ThumbsUp,     label: "Reactions",         desc: "Emoji message reactions" },
  { icon: Users,        label: "Group Management",  desc: "Create & manage groups" },
  { icon: Webhook,      label: "HMAC Webhooks",     desc: "Signed real-time events" },
  { icon: Zap,          label: "Typing Indicator",  desc: "Presence & composing" },
  { icon: CheckCircle2, label: "Read Receipts",     desc: "Mark messages as seen" },
  { icon: ShieldCheck,  label: "Safety Controls",   desc: "Rate limit & queue pacing" },
  { icon: Globe,        label: "Contact Sync",      desc: "Number check & lookup" },
] as const;

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<number>(0);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 4000);
    return () => clearInterval(t);
  }, []);

  async function load(manual = false) {
    if (manual) setSpinning(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setSessions(d.sessions ?? []);
        setDashboard(d);
        setLastUpdated(Date.now());
      }
    } catch {}
    finally {
      setLoading(false);
      if (manual) setTimeout(() => setSpinning(false), 700);
    }
  }

  const m = dashboard?.metrics;
  const w = dashboard?.workspace;
  const live = dashboard?.liveUsage;
  const series = dashboard?.usageSeries ?? [];
  const maxVal = Math.max(1, ...series.flatMap((d) => [d.sent, d.received, d.webhooks]));
  const barH = (v: number) => `${Math.min(100, Math.max(4, (v / maxVal) * 100))}%`;
  const limitLabel = w?.sessionLimit == null ? "∞" : String(w.sessionLimit);
  const firstName = w?.fullName?.split(" ")[0] ?? null;
  const webhookRows = (dashboard?.webhookDeliveries ?? []).slice(0, 6).map((d) => ({
    event: d.event, status: d.status, http: d.httpStatus,
    time: new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Access status banner (trial countdown / expired / owner / sub) ── */}
      <AccessBanner
        accessMode={w?.accessMode || "trial"}
        expiresAtIso={w?.expiresAtIso || null}
        isUnlimited={w?.isUnlimited}
      />

      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-card p-7 sm:p-9">
        {/* Background glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        {/* Grid texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--foreground)) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              WhatsApp Platform Active
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {firstName ? `Hey ${firstName},` : "Welcome back,"}<br />
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent">
                let&apos;s send messages
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              <AnimatedNumber value={m?.connectedCount ?? 0} className="font-bold text-foreground" /> session{(m?.connectedCount ?? 0) !== 1 ? "s" : ""} live
              <span className="mx-2 text-muted-foreground/30">·</span>
              <AnimatedNumber value={m?.messagesSentToday ?? 0} className="font-bold text-foreground" /> messages sent today
              <span className="mx-2 text-muted-foreground/30">·</span>
              <AnimatedNumber value={m?.webhookSuccessRate ?? 0} suffix="%" className="font-bold text-foreground" /> webhook success
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => load(true)}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40 transition hover:border-accent/30"
            >
              <RefreshCw className={cn("h-4 w-4 text-muted-foreground", spinning && "animate-spin")} />
            </button>
            <Link
              href="/app/sessions/new"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(52,211,153,0.3)] transition hover:shadow-[0_0_36px_rgba(52,211,153,0.4)] hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              New Session
            </Link>
          </div>
        </div>

        {/* Inline metric tiles */}
        <div className="stagger-children relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Sent Today",      raw: m?.messagesSentToday ?? 0,        icon: Send,          col: "text-accent border-accent/20 bg-accent/[0.07]",                                       suffix: "" },
            { label: "Received Today",  raw: m?.messagesReceivedToday ?? 0,    icon: MessageSquare, col: "text-cyan-600 dark:text-cyan-400 border-cyan-500/20 bg-cyan-500/[0.07]",            suffix: "" },
            { label: "Webhook Success", raw: m?.webhookSuccessRate ?? 0,       icon: Webhook,       col: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.07]", suffix: "%" },
            { label: "Safety Score",    raw: m?.safetyScore ?? 0,              icon: ShieldCheck,   col: "text-violet-600 dark:text-violet-400 border-violet-500/20 bg-violet-500/[0.07]",   suffix: "/100" },
          ].map(({ label, raw, icon: Icon, col, suffix }) => (
            <div key={label} className={cn("lift rounded-2xl border p-4", col)}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5 opacity-80" />
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
              </div>
              <p className="text-2xl font-black tracking-tight">
                <AnimatedNumber value={raw} suffix={suffix} />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Activity Strip ── */}
      <ScrollReveal>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Inbound (last hr)",  val: live?.inboundCount ?? 0,   icon: MessageSquare, color: "text-cyan-600 dark:text-cyan-400",   bg: "bg-cyan-500/10",  delay: 0 },
            { label: "Outbound (last hr)", val: live?.outboundCount ?? 0,  icon: Zap,           color: "text-accent",                        bg: "bg-accent/10",    delay: 80 },
            { label: "Webhook Fires",      val: live?.webhookCount ?? 0,   icon: Globe,         color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", delay: 160 },
            { label: "Active Contacts",    val: live?.activeContacts ?? 0, icon: Users,         color: "text-rose-600 dark:text-rose-400",   bg: "bg-rose-500/10",  delay: 240 },
          ].map(({ label, val, icon: Icon, color, bg, delay }) => (
            <ScrollReveal key={label} delay={delay} direction="up">
              <div className="lift flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3.5 hover:border-accent/30">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </span>
                <div>
                  <p className="text-xl font-black tracking-tight text-foreground">
                    <AnimatedNumber value={val} />
                  </p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </section>
      </ScrollReveal>

      {/* ── Sessions ── */}
      <ScrollReveal className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-foreground">WhatsApp Sessions</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} — each with its own API key & webhook
            </p>
          </div>
          <span className="rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-bold text-muted-foreground">
            {w?.sessionCount ?? 0} / {limitLabel} used
          </span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-border bg-card">
              <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground">No sessions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Connect a WhatsApp number to get started</p>
            <Link
              href="/app/sessions/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" /> Create first session
            </Link>
          </div>
        ) : (
          <div className="stagger-children grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
            <Link
              href="/app/sessions/new"
              className="lift flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition hover:border-accent/40 hover:text-accent hover:bg-accent/5"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-dashed border-current">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">Add session</span>
            </Link>
          </div>
        )}
      </ScrollReveal>

      {/* ── Chart + Quick Start ── */}
      <ScrollReveal className="grid gap-4 xl:grid-cols-[1fr_400px]">
        {/* Activity chart */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-foreground">Message Activity</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">7-day — sent, received, webhooks</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Live
            </div>
          </div>

          {series.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center gap-3 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/20" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Data appears once messages flow through your sessions</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-40 items-end gap-1.5">
                {series.map((item) => (
                  <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end gap-0.5 rounded-xl bg-muted/30 p-1.5">
                      <div className="w-full rounded-sm bg-accent transition-all duration-500" style={{ height: barH(item.sent) }} title={`Sent: ${item.sent}`} />
                      <div className="w-full rounded-sm bg-cyan-400/60 transition-all duration-500" style={{ height: barH(item.received) }} title={`Recv: ${item.received}`} />
                      <div className="w-full rounded-sm bg-rose-400/50 transition-all duration-500" style={{ height: barH(item.webhooks) }} title={`WH: ${item.webhooks}`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{item.day}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent" />Sent</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-cyan-400/60" />Received</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-rose-400/50" />Webhooks</span>
              </div>
            </>
          )}
        </div>

        {/* Quick Start code panel */}
        <QuickStartPanel />
      </ScrollReveal>

      {/* ── Platform Capabilities ── */}
      <ScrollReveal className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="font-bold text-foreground">Platform Capabilities</h2>
            </div>
            <p className="text-xs text-muted-foreground">Everything your sessions can do via the REST API</p>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-accent/40 hover:text-accent"
          >
            API Docs <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="stagger-children grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PLATFORM_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="lift group flex items-start gap-3 rounded-xl border border-border bg-muted/10 p-3.5 hover:border-accent/40 hover:bg-accent/5"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 transition-transform duration-200 group-hover:scale-110">
                <Icon className="h-4 w-4 text-accent" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* ── Webhook Monitor ── */}
      {webhookRows.length > 0 && (
        <ScrollReveal className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-foreground">Webhook Deliveries</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Recent delivery log with HTTP status codes</p>
            </div>
            <Link
              href="/app/webhooks"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-accent/40 hover:text-accent"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Event", "Status", "HTTP", "Time"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {webhookRows.map((row, i) => (
                  <tr key={i} className="transition hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80">{row.event}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold",
                        row.status === "delivered" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        row.status === "failed" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                        "bg-muted text-muted-foreground")}>{row.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-muted-foreground">{row.http ?? "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-muted-foreground">{row.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
