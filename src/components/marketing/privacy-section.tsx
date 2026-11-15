import React from "react";
import { UserCheck, Sliders, ShieldAlert } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export function PrivacySection() {
  const { privacy } = content;

  const pillarIcons: Record<string, React.ReactNode> = {
    "you-approve": <UserCheck className="text-accent size-6" />,
    "you-choose": <Sliders className="text-accent size-6" />,
    "you-revoke": <ShieldAlert className="text-accent size-6" />,
  };

  return (
    <section id="privacy" className="bg-background border-border/60 border-b py-20 sm:py-28">
      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Reveal>
            <span className="text-accent font-sans text-xs font-semibold tracking-widest uppercase">
              {privacy.badge}
            </span>
            <h2 className="text-primary mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {privacy.title}
            </h2>
            <p className="text-muted-foreground mt-2 font-sans text-base sm:text-lg">
              {privacy.subtitle}
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {privacy.pillars.map((pillar, idx) => (
            <Reveal key={pillar.id} delayMs={idx * 120}>
              <div className="bg-card border-border/80 hover:border-accent/50 flex h-full flex-col justify-between space-y-4 rounded-3xl border p-8 shadow-xs transition-all">
                <div className="space-y-4">
                  <div className="bg-primary/10 border-accent/20 flex size-14 items-center justify-center rounded-2xl border">
                    {pillarIcons[pillar.id]}
                  </div>

                  <h3 className="text-primary font-serif text-xl font-bold sm:text-2xl">
                    {pillar.title}
                  </h3>

                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="border-border/60 border-t pt-4">
                  <span className="text-accent font-sans text-xs font-medium">
                    Customer Sovereignty Guarantee
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
