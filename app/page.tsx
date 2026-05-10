import { Nav } from "@/components/nav";
import { HeroSection } from "@/components/landing/hero";
import { CodeSection } from "@/components/landing/code-section";
import { SdkSection } from "@/components/landing/sdk-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { MessageTypesSection } from "@/components/landing/message-types";
import { UseCasesSection } from "@/components/landing/use-cases";
import { PricingSection } from "@/components/landing/pricing";
import { FaqSection } from "@/components/landing/faq";
import { CtaBottomSection } from "@/components/landing/cta-bottom";
import { Footer } from "@/components/landing/footer";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#08090C]">
      <Nav />

      <main>
        {/* 1 — Hero */}
        <HeroSection />

        {/* 2 — Code Integration */}
        <CodeSection />

        {/* 3 — SDK Libraries */}
        <SdkSection />

        {/* 4 — How It Works */}
        <HowItWorksSection />

        {/* 5 — Message Types + WhatsApp Mockup */}
        <MessageTypesSection />

        {/* 6 — Use Cases */}
        <UseCasesSection />

        {/* 7 — Pricing */}
        <PricingSection />

        {/* 8 — FAQ */}
        <FaqSection />

        {/* 9 — Bottom CTA */}
        <CtaBottomSection />
      </main>

      <Footer />

      {/* Floating WhatsApp button — fixed bottom-right, always visible */}
      <WhatsAppFloat />
    </div>
  );
}
