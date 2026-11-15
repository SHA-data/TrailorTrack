import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms of Service — TailorTrack",
  description:
    "Terms and conditions governing the use of the TailorTrack digital passport platform.",
};

export default function TermsPage() {
  const { termsPage } = content;

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <div className="border-border/80 space-y-4 border-b pb-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1.5 font-sans text-xs transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-accent text-accent">
            Customer & Partner Agreement
          </Badge>
          <span className="text-muted-foreground font-mono text-xs">
            Updated: {termsPage.lastUpdated}
          </span>
        </div>
        <h1 className="text-primary font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
          {termsPage.title}
        </h1>
        <p className="text-muted-foreground font-sans text-base leading-relaxed">
          {termsPage.intro}
        </p>
      </div>

      <div className="space-y-8">
        {termsPage.sections.map((sec) => (
          <div key={sec.heading} className="bg-card border-border space-y-2 rounded-2xl border p-6">
            <h2 className="text-primary flex items-center gap-2 font-serif text-xl font-bold">
              <Scale className="text-accent size-5 shrink-0" />
              <span>{sec.heading}</span>
            </h2>
            <p className="text-muted-foreground pl-7 font-sans text-sm leading-relaxed">
              {sec.text}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-muted/60 border-border text-muted-foreground rounded-xl border p-4 text-center font-sans text-xs">
        Note: This is a placeholder agreement preview. Official terms of service govern user account
        registration and tailoring operations.
      </div>
    </main>
  );
}
