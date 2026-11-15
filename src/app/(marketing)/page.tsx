import React from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemStrip } from "@/components/marketing/problem-strip";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { TryOnShowcase } from "@/components/marketing/tryon-showcase";
import { PrivacySection } from "@/components/marketing/privacy-section";
import { TailorTeaser } from "@/components/marketing/tailor-teaser";
import { FAQSection } from "@/components/marketing/faq-section";
import { FinalCTA } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  title: "TailorTrack — Digital Tailoring Passport for Pakistan",
  description:
    "Your measurements. Your style. Your tailor. Always with you. A digital tailoring passport for Shalwar Kameez, Kurtas, Waistcoats, and Sherwanis across Pakistan.",
  openGraph: {
    title: "TailorTrack — Digital Tailoring Passport for Pakistan",
    description:
      "A customer-owned digital tailoring passport. Keep your measurements, preview designs in the studio, and grant consent-based QR access to any master tailor.",
    type: "website",
    locale: "en_PK",
    siteName: "TailorTrack",
  },
};

export default function LandingPage() {
  return (
    <main className="flex w-full flex-col">
      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. Problem Strip */}
      <ProblemStrip />

      {/* 4. How It Works (3 Steps) */}
      <HowItWorks />

      {/* 5. Features Grid (6 Cards) */}
      <FeaturesGrid />

      {/* 6. Try-on Showcase (2D Studio & 3D Live) */}
      <TryOnShowcase />

      {/* 7. Privacy & Consent Control */}
      <PrivacySection />

      {/* 8. For Tailors Teaser */}
      <TailorTeaser />

      {/* 9. FAQ Section */}
      <FAQSection />

      {/* 10. Final CTA Band */}
      <FinalCTA />
    </main>
  );
}
