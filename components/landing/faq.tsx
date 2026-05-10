"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How do I create my first WhatsApp session?",
    a: "Sign up for a free trial, navigate to Sessions in your dashboard, click 'New Session', give it a name, and scan the QR code with your WhatsApp mobile app. Your session will be live in under 30 seconds.",
  },
  {
    q: "Will people know I'm using the API?",
    a: "No. Messages are sent from your connected WhatsApp number just like any other message. Recipients see your regular WhatsApp profile — there is no API branding or watermark.",
  },
  {
    q: "Can I connect multiple WhatsApp accounts?",
    a: "Yes. Each plan comes with a different session limit. The Pro plan supports 3 sessions, Plus 6, and Business 10 — each with its own API key, webhook URL, and usage analytics.",
  },
  {
    q: "What happens if I log out?",
    a: "Your session will disconnect. You can reconnect by scanning the QR code again from the dashboard. Active subscriptions keep your session slot reserved so reconnection is instant.",
  },
  {
    q: "Is it safe to connect my account?",
    a: "We build consent-first safeguards into every session: paced queues, concurrency controls, and risk visibility. No provider can guarantee zero restrictions, but our tooling is designed to minimize that risk.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Payments are processed by Paddle and support all major credit/debit cards (Visa, Mastercard, Amex), PayPal, and various local payment methods depending on your region.",
  },
  {
    q: "What to do if session disconnects?",
    a: "You'll receive a webhook event (session.disconnected) in real-time. Navigate to your dashboard, open the session, and click 'Reconnect' to scan a fresh QR code. This takes under a minute.",
  },
  {
    q: "Can I use webhooks?",
    a: "Absolutely. Every session supports a configurable webhook URL. We deliver events for inbound messages, delivery receipts, session status changes, group events, reactions, and more — in real-time.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all duration-300 ${
        open
          ? "border-emerald-500/25 bg-white/[0.03]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
      }`}
    >
      <button
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={`text-sm font-semibold leading-snug ${open ? "text-white" : "text-white/80"}`}>
          {q}
        </span>
        <span
          className={`shrink-0 grid h-6 w-6 place-items-center rounded-full border transition-all duration-300 ${
            open
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
              : "border-white/[0.1] bg-white/[0.04] text-white/40"
          }`}
        >
          {open ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-7 text-white/45">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="mx-auto max-w-4xl px-5 sm:px-6 py-24" id="faq">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">
          Support · Documentation · Help Center
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white">
          Frequently Asked Questions
        </h2>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <FAQItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>

      {/* Bottom links */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 text-sm">
        <Link
          href="/docs"
          className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Visit our Help Center →
        </Link>
        <span className="hidden sm:block text-white/20">·</span>
        <Link
          href="/login"
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          Contact Support
        </Link>
        <span className="hidden sm:block text-white/20">·</span>
        <Link
          href="/docs"
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          View Documentation
        </Link>
      </div>
    </section>
  );
}
