import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Scissors,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Users,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "For Tailor Shops & Master Craftsmen — TailorTrack",
  description:
    "Speed up customer intake, eliminate measurement loss, and end fitting disputes with the digital tailoring passport.",
};

export default function ForTailorsPage() {
  const { forTailorsPage } = content;

  const benefitIcons = [
    <FileCheck key="1" className="text-accent size-6" />,
    <ShieldAlert key="2" className="text-accent size-6" />,
    <Clock key="3" className="text-accent size-6" />,
    <Users key="4" className="text-accent size-6" />,
  ];

  return (
    <main className="space-y-16 py-12 sm:space-y-24 sm:py-20">
      {/* Header Hero */}
      <section className="mx-auto max-w-4xl space-y-5 px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <div className="border-accent/40 bg-card text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-sans text-xs font-semibold">
            <Scissors className="size-3.5" />
            <span>{forTailorsPage.badge}</span>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <h1 className="text-primary font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl">
            {forTailorsPage.title}
          </h1>
        </Reveal>

        <Reveal delayMs={200}>
          <p className="text-muted-foreground mx-auto max-w-2xl font-sans text-base leading-relaxed sm:text-lg">
            {forTailorsPage.subtitle}
          </p>
        </Reveal>

        <Reveal delayMs={300}>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-6 py-6 text-sm shadow-md sm:text-base"
              >
                <span>{forTailorsPage.ctaButton}</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-muted px-6 py-6 text-sm sm:text-base"
              >
                {forTailorsPage.backLink}
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 4 Benefits Grid */}
      <section id="benefits" className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-2 text-center">
          <h2 className="text-primary font-serif text-2xl font-bold sm:text-3xl">
            Built for the Realities of Pakistani Stitching
          </h2>
          <p className="text-muted-foreground font-sans text-sm">
            TailorTrack respects your craft and speeds up everything else.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          {forTailorsPage.benefits.map((benefit, idx) => (
            <Reveal key={benefit.title} delayMs={idx * 100}>
              <Card className="border-border/80 bg-card hover:border-accent/50 h-full shadow-xs transition-all">
                <CardHeader className="space-y-3">
                  <div className="bg-primary/10 border-accent/30 flex size-12 items-center justify-center rounded-xl border">
                    {benefitIcons[idx]}
                  </div>
                  <CardTitle className="text-primary font-serif text-xl sm:text-2xl">
                    {benefit.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-sans text-sm leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Workflow Step Band */}
      <section className="bg-cream-50/70 border-border/80 border-y py-16">
        <div className="mx-auto max-w-5xl space-y-8 px-4 text-center sm:px-6 lg:px-8">
          <h3 className="text-primary font-serif text-2xl font-bold sm:text-3xl">
            How Your Shop Operates on TailorTrack
          </h3>
          <div className="grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            <div className="bg-card border-border space-y-2 rounded-2xl border p-5">
              <span className="text-accent font-serif text-xl font-bold">1. Scan QR</span>
              <p className="text-muted-foreground font-sans text-xs sm:text-sm">
                Point any smartphone camera at customer passport. Instant verified measurements
                appear on screen.
              </p>
            </div>
            <div className="bg-card border-border space-y-2 rounded-2xl border p-5">
              <span className="text-accent font-serif text-xl font-bold">2. Confirm Style</span>
              <p className="text-muted-foreground font-sans text-xs sm:text-sm">
                Review specific collar cuts, cuffs, pockets, and fabric notes mutually agreed before
                cutting.
              </p>
            </div>
            <div className="bg-card border-border space-y-2 rounded-2xl border p-5">
              <span className="text-accent font-serif text-xl font-bold">3. 1-Tap Status</span>
              <p className="text-muted-foreground font-sans text-xs sm:text-sm">
                Tap &apos;Cutting&apos;, &apos;Stitching&apos;, or &apos;Trial Ready&apos;.
                Customers receive updates automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Partner CTA Box */}
      <section id="join" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="bg-primary border-accent/40 space-y-6 rounded-3xl border p-8 text-center text-[#f7f1e3] shadow-xl sm:p-12">
            <Sparkles className="text-accent mx-auto size-8" />
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold text-[#f7f1e3] sm:text-4xl">
                {forTailorsPage.ctaTitle}
              </h2>
              <p className="mx-auto max-w-xl font-sans text-sm text-[#f7f1e3]/80 sm:text-base">
                {forTailorsPage.ctaSubtitle}
              </p>
            </div>

            <div className="pt-2">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-accent gap-2 px-8 py-6 text-sm font-semibold text-[#101312] shadow-md hover:bg-[#b2873c] sm:text-base"
                >
                  <span>{forTailorsPage.ctaButton}</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
