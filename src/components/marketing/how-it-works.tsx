import React from "react";
import { UserCheck, QrCode, Sparkles } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export function HowItWorks() {
  const { howItWorks } = content;

  const stepIcons = [
    <UserCheck key="1" className="text-accent size-6" />,
    <QrCode key="2" className="text-accent size-6" />,
    <Sparkles key="3" className="text-accent size-6" />,
  ];

  return (
    <section id="how-it-works" className="bg-cream-50/50 border-border/60 border-b py-20 sm:py-28">
      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Reveal>
            <span className="text-accent font-sans text-xs font-semibold tracking-widest uppercase">
              {howItWorks.badge}
            </span>
            <h2 className="text-primary mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {howItWorks.title}
            </h2>
            <p className="text-muted-foreground mt-2 font-sans text-base sm:text-lg">
              {howItWorks.subtitle}
            </p>
          </Reveal>
        </div>

        {/* 3 Step Timeline Container */}
        <div className="relative">
          {/* Connecting line for desktop */}
          <div
            className="from-accent/20 via-accent/60 to-accent/20 absolute top-20 right-[16%] left-[16%] z-0 hidden h-[2px] bg-gradient-to-r lg:block"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-3">
            {howItWorks.steps.map((step, idx) => (
              <Reveal key={step.number} delayMs={idx * 150}>
                <div className="bg-card border-border/80 group relative flex h-full flex-col justify-between space-y-5 rounded-3xl border p-7 shadow-xs transition-all hover:shadow-md sm:p-8">
                  <div className="space-y-4">
                    {/* Step Number & Icon Header */}
                    <div className="flex items-center justify-between">
                      <div className="bg-primary text-accent border-accent/30 flex size-14 items-center justify-center rounded-2xl border shadow-xs transition-transform group-hover:scale-105">
                        {stepIcons[idx]}
                      </div>
                      <span className="text-accent/60 group-hover:text-accent font-serif text-3xl font-bold transition-colors sm:text-4xl">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-primary font-serif text-xl font-bold sm:text-2xl">
                      {step.title}
                    </h3>

                    <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="border-border/60 border-t pt-4">
                    <span className="text-primary/80 inline-flex items-center font-sans text-xs font-medium">
                      ✓ {step.detail}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
