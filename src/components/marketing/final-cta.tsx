import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export function FinalCTA() {
  const { finalCta } = content;

  return (
    <section className="bg-primary border-accent/20 relative overflow-hidden border-b py-20 text-[#f7f1e3] sm:py-28">
      {/* Background Decorative Needle & Thread Watermark */}
      <div
        className="bg-accent/5 pointer-events-none absolute -top-20 -right-20 size-96 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="bg-accent/5 pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <div className="bg-accent/20 border-accent/40 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-sans text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>Start Today with TailorTrack</span>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <h2 className="mx-auto max-w-3xl font-serif text-3xl leading-tight font-bold tracking-tight text-[#f7f1e3] sm:text-5xl md:text-6xl">
            {finalCta.headline}
          </h2>
        </Reveal>

        <Reveal delayMs={200}>
          <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-[#f7f1e3]/85 sm:text-lg">
            {finalCta.subheading}
          </p>
        </Reveal>

        <Reveal delayMs={300}>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-accent w-full gap-2 px-8 py-6 text-sm font-semibold text-[#101312] shadow-lg hover:bg-[#b2873c] sm:w-auto sm:text-base"
              >
                <span>{finalCta.cta}</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>

            <Link href="/for-tailors" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="border-accent/40 w-full bg-transparent px-6 py-6 text-sm font-medium text-[#f7f1e3] hover:bg-white/10 sm:w-auto sm:text-base"
              >
                {finalCta.secondaryCta}
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delayMs={400}>
          <div className="flex items-center justify-center gap-2 pt-2 font-sans text-xs text-[#f7f1e3]/70">
            <CheckCircle2 className="text-accent size-3.5" />
            <span>{finalCta.guarantee}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
