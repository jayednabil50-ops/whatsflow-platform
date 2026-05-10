import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, MessageCircle, ShieldCheck, Clock3, KeyRound } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
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
        <div className="w-full max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_460px] lg:items-center">
            {/* Left side */}
            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Clock3 className="h-3 w-3" />
                2-day free trial - No credit card
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                Start building with<br />WhatsApp API today.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground max-w-sm">
                Connect a WhatsApp number, set up webhooks, and start sending messages in minutes.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { icon: CheckCircle2, text: "No credit card required" },
                  { icon: ShieldCheck, text: "Account Protection Mode from day one" },
                  { icon: KeyRound, text: "Session-scoped API keys & webhook secrets" },
                  { icon: CheckCircle2, text: "Full dashboard access during trial" }
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-accent shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-border bg-card/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you get on trial</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    ["1 session", "WhatsApp number"],
                    ["Webhooks", "Real-time events"],
                    ["API access", "Send messages"],
                    ["Dashboard", "Full observability"]
                  ].map(([val, label]) => (
                    <div key={val} className="rounded-lg border border-border bg-background/50 p-3">
                      <p className="text-base font-semibold text-accent">{val}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
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

              <h2 className="text-2xl font-semibold tracking-tight">Create your workspace</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Free 2-day trial, no credit card needed.
              </p>

              <RegisterForm />

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-accent hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
