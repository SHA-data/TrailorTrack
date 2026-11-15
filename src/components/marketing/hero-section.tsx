import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export function HeroSection() {
  const { hero } = content;

  return (
    <section className="from-background via-cream-50/60 to-background border-border/50 relative overflow-hidden border-b bg-gradient-to-b pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
      {/* Background Subtle Heritage Grid Pattern (pure CSS/SVG) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#decfa715_1px,transparent_1px),linear-gradient(to_bottom,#decfa715_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:3.5rem_3.5rem]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline & Action */}
          <div className="space-y-6 text-center sm:space-y-8 lg:col-span-7 lg:text-left">
            <Reveal direction="down">
              <div className="border-accent/40 bg-card/80 text-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-xs">
                <Sparkles className="text-accent size-3.5" />
                <span className="font-sans">{hero.badge}</span>
              </div>
            </Reveal>

            <Reveal delayMs={100}>
              <h1 className="text-primary font-serif text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
                <span>{hero.headlineStart} </span>
                <span className="text-primary/95">{hero.headlineMiddle} </span>
                <span className="text-primary/90">{hero.headlineEnd} </span>
                <span className="text-accent block pt-1 font-normal italic">
                  {hero.headlineAccent}
                </span>
              </h1>
            </Reveal>

            <Reveal delayMs={200}>
              <p className="text-muted-foreground mx-auto max-w-2xl font-sans text-base leading-relaxed sm:text-lg md:text-xl lg:mx-0">
                {hero.subheading}
              </p>
            </Reveal>

            <Reveal delayMs={300}>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 px-6 py-6 text-sm font-medium shadow-md sm:w-auto sm:text-base"
                  >
                    <span>{hero.primaryCta}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>

                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border bg-card/50 text-foreground hover:bg-muted w-full px-6 py-6 text-sm font-medium sm:w-auto sm:text-base"
                  >
                    {hero.secondaryCta}
                  </Button>
                </a>
              </div>
            </Reveal>

            <Reveal delayMs={400}>
              <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-4 pt-2 font-sans text-xs sm:gap-6 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="text-accent size-3.5" />
                  Free for Pakistani customers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="text-accent size-3.5" />
                  Zero app install required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="text-accent size-3.5" />
                  Instant QR sharing
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Hero Visual Phone Mockup */}
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <Reveal delayMs={200} direction="left">
              <HeroVisual />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
