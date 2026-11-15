import React from "react";
import { Compass, Activity, Users, Bookmark, ShieldCheck, History } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Badge } from "@/components/ui/badge";
import { content } from "@/lib/content";

export function FeaturesGrid() {
  const { features } = content;

  const featureIcons: Record<string, React.ReactNode> = {
    "portable-measurements": <Compass className="text-accent size-6" />,
    "order-tracking": <Activity className="text-accent size-6" />,
    "family-profiles": <Users className="text-accent size-6" />,
    "design-archive": <Bookmark className="text-accent size-6" />,
    "consent-control": <ShieldCheck className="text-accent size-6" />,
    "stitching-history": <History className="text-accent size-6" />,
  };

  return (
    <section id="features" className="bg-background border-border/60 border-b py-20 sm:py-28">
      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Reveal>
            <span className="text-accent font-sans text-xs font-semibold tracking-widest uppercase">
              {features.badge}
            </span>
            <h2 className="text-primary mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {features.title}
            </h2>
            <p className="text-muted-foreground mt-2 font-sans text-base sm:text-lg">
              {features.subtitle}
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.items.map((item, idx) => (
            <Reveal key={item.id} delayMs={idx * 80}>
              <div className="bg-card border-border/80 hover:border-accent/50 group flex h-full flex-col justify-between space-y-5 rounded-2xl border p-7 shadow-xs transition-all hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="bg-primary/10 border-accent/30 group-hover:bg-primary group-hover:text-accent flex size-12 items-center justify-center rounded-xl border transition-colors">
                      {featureIcons[item.id]}
                    </div>
                    <Badge
                      variant="outline"
                      className="border-accent/40 font-sans text-[11px] text-[#76522c]"
                    >
                      {item.tag}
                    </Badge>
                  </div>

                  <h3 className="text-foreground group-hover:text-primary font-serif text-xl font-bold transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
