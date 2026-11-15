import React from "react";
import Link from "next/link";
import { Scissors, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export function TailorTeaser() {
  const { tailorTeaser } = content;

  return (
    <section className="bg-cream-50/70 border-border/70 border-b py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="bg-primary border-accent/30 relative overflow-hidden rounded-3xl border p-8 text-[#f7f1e3] shadow-xl sm:p-12 lg:p-16">
            {/* Background decorative embellishment */}
            <div
              className="bg-accent/10 pointer-events-none absolute -right-12 -bottom-12 size-64 rounded-full blur-2xl"
              aria-hidden="true"
            />

            <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="space-y-4 text-center lg:col-span-8 lg:text-left">
                <div className="bg-accent/20 border-accent/40 text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold">
                  <Scissors className="size-3.5" />
                  <span>{tailorTeaser.badge}</span>
                </div>

                <h2 className="font-serif text-3xl font-bold tracking-tight text-[#f7f1e3] sm:text-4xl md:text-5xl">
                  {tailorTeaser.title}
                </h2>

                <p className="max-w-2xl font-sans text-sm leading-relaxed text-[#f7f1e3]/80 sm:text-base">
                  {tailorTeaser.subtitle}
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-2 font-sans text-xs text-[#f7f1e3]/90 sm:grid-cols-2 sm:text-sm">
                  {tailorTeaser.bulletPoints.map((pt) => (
                    <div key={pt} className="flex items-center gap-2">
                      <CheckCircle2 className="text-accent size-4 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center lg:col-span-4 lg:justify-end">
                <Link href="/for-tailors" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="bg-accent w-full gap-2 px-6 py-6 text-sm font-semibold text-[#101312] shadow-md hover:bg-[#b2873c] sm:w-auto sm:text-base"
                  >
                    <span>{tailorTeaser.cta}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
