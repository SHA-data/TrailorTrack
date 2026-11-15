import React from "react";
import { BookX, Ruler, Clock, MessageSquareWarning } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export function ProblemStrip() {
  const { problems } = content;

  const iconMap: Record<string, React.ReactNode> = {
    "lost-measurements": <BookX className="text-accent size-6" />,
    "remeasuring-fatigue": <Ruler className="text-accent size-6" />,
    "uncertain-dates": <Clock className="text-accent size-6" />,
    "style-disputes": <MessageSquareWarning className="text-accent size-6" />,
  };

  return (
    <section className="bg-background border-border/60 border-b py-16 sm:py-20">
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Reveal>
            <span className="text-accent font-sans text-xs font-semibold tracking-widest uppercase">
              {problems.badge}
            </span>
            <h2 className="text-primary mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {problems.title}
            </h2>
            <p className="text-muted-foreground mt-2 font-sans text-sm sm:text-base">
              {problems.subtitle}
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {problems.items.map((item, idx) => (
            <Reveal key={item.id} delayMs={idx * 100}>
              <div className="bg-card border-border/80 hover:border-accent/40 flex h-full flex-col justify-between space-y-3 rounded-2xl border p-6 shadow-xs transition-colors">
                <div className="space-y-3">
                  <div className="bg-primary/10 border-accent/20 flex size-12 items-center justify-center rounded-xl border">
                    {iconMap[item.id]}
                  </div>
                  <h3 className="text-foreground font-serif text-lg font-bold">{item.title}</h3>
                  <p className="text-muted-foreground font-sans text-xs leading-relaxed sm:text-sm">
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
