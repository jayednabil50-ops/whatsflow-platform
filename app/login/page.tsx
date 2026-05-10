import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Zap, ShieldCheck, Webhook } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen bg-background page-noise flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border/60 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold tracking-tight">{BRAND}</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_480px] lg:items-center">
            {/* Left side */}
            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                WhatsApp API Platform
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                Your WhatsApp<br />command center.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground max-w-sm">
                Manage sessions, webhooks, API keys, and message delivery - all from one dashboard.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { icon: Zap, label: "Real-time message delivery", detail: "Sub-second webhook delivery with retry logic" },
                  { icon: ShieldCheck, label: "Account protection mode", detail: "Queue pacing, rate limits, risk controls" },
                  { icon: Webhook, label: "HMAC-signed webhooks", detail: "Replay-protected payloads on every event" }
                ].map(({ icon: Icon, label, detail }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - form card */}
            <div className="rounded-xl border border-border bg-card p-8 shadow-[0_32px_96px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-2.5 lg:hidden mb-6">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold">{BRAND}</span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to your workspace
              </p>

              <LoginForm />

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-accent hover:underline">
                  Create one free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
