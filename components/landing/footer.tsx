import Link from "next/link";
import type { Route } from "next";
import { MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";

const LINKS: Record<string, { label: string; href: Route }[]> = {
  Product: [
    { label: "Features", href: "/#integration" as Route },
    { label: "Pricing", href: "/#pricing" as Route },
    { label: "Documentation", href: "/docs" as Route },
    { label: "API Status", href: "/docs" as Route },
  ],
  Company: [
    { label: "About Us", href: "/blog" as Route },
    { label: "Blog", href: "/blog" as Route },
    { label: "Contact", href: "/login" as Route },
  ],
  Resources: [
    { label: "Help Center", href: "/docs" as Route },
    { label: "Terms of Service", href: "/docs" as Route },
    { label: "Privacy Policy", href: "/docs" as Route },
    { label: "Refund Policy", href: "/docs" as Route },
    { label: "Partner Program", href: "/register" as Route },
  ],
};

const SOCIAL = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: "Product Hunt",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 0-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4H10.2v3.6H7.8V6h5.804a4.2 4.2 0 0 1 0 8.4z" />
      </svg>
    ),
  },
  {
    label: "Trustpilot",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-[#06080A]">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-14 pb-8">
        {/* Top grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 pb-12 border-b border-white/[0.05]">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.2)]">
                <MessageCircle className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-white">{BRAND}</span>
            </Link>
            <p className="mt-3 text-sm leading-7 text-white/35 max-w-xs">
              Developer-first WhatsApp API. Multiple sessions, webhooks, and real-time analytics —
              all in one platform.
            </p>

            {/* Social links */}
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/40 transition hover:border-white/[0.14] hover:text-white/70"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                {section}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/35 transition-colors hover:text-white/70"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-white/25">
            <span>admin.techgentai@gmail.com</span>
            <span>+1 (555) 000-0000</span>
            <span>123 API Street, Tech City, TX 00000</span>
          </div>
          <p className="text-[12px] text-white/20">
            © {new Date().getFullYear()} {BRAND}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
