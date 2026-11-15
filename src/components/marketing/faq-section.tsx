import React from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

export function FAQSection() {
  const { faq } = content;

  return (
    <section id="faq" className="bg-background border-border/60 border-b py-20 sm:py-28">
      <div className="mx-auto max-w-4xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:px-8">
        <div className="space-y-3 text-center">
          <Reveal>
            <span className="text-accent font-sans text-xs font-semibold tracking-widest uppercase">
              {faq.badge}
            </span>
            <h2 className="text-primary mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {faq.title}
            </h2>
            <p className="text-muted-foreground mt-2 font-sans text-base sm:text-lg">
              {faq.subtitle}
            </p>
          </Reveal>
        </div>

        {/* Accessible Plain HTML <details>/<summary> Accordion */}
        <div className="space-y-4">
          {faq.items.map((item, idx) => (
            <Reveal key={item.question} delayMs={idx * 60}>
              <details className="group bg-card border-border/80 open:border-accent/40 rounded-2xl border shadow-xs transition-all duration-200 open:shadow-md [&_summary::-webkit-details-marker]:hidden">
                <summary className="text-foreground hover:text-primary focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between rounded-2xl p-5 text-left font-serif text-lg font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:p-6 sm:text-xl">
                  <span>{item.question}</span>
                  <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-180">
                    <ChevronDown className="text-accent size-5" />
                  </span>
                </summary>
                <div className="text-muted-foreground border-border/40 border-t px-5 pt-4 pb-5 font-sans text-sm leading-relaxed sm:px-6 sm:pb-6">
                  <p>{item.answer}</p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
