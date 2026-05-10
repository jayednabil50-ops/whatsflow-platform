import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import { CommandPalette } from "@/components/command-palette";
import { BRAND, BRAND_DOMAIN } from "@/lib/brand";

const sans = Sora({ subsets: ["latin"], variable: "--font-sora" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });
const metadataBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL(`https://${BRAND_DOMAIN}`);

export const metadata: Metadata = {
  title: `${BRAND} - WhatsApp API for product teams`,
  description:
    "Developer-first WhatsApp API SaaS with multi-session management, webhooks, account protection controls, and usage analytics.",
  metadataBase: metadataBaseUrl
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} min-h-screen bg-background font-sans text-foreground`}>
        <Providers>
          <CommandPalette />
          {children}
        </Providers>
      </body>
    </html>
  );
}
