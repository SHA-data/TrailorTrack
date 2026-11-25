import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { privacyPolicy, SUPPORT_EMAIL, isSupportEmailConfigured } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — TailorTrack",
  description:
    "How TailorTrack stores, shares under consent, exports, and deletes customer and tailor data.",
};

export default function PrivacyPage() {
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
            Privacy & Data Control
          </Badge>
          <span className="text-muted-foreground font-mono text-xs">
            Last updated: {privacyPolicy.lastUpdated}
          </span>
        </div>
        <h1 className="text-primary font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
          {privacyPolicy.title}
        </h1>
        <p className="text-muted-foreground font-sans text-base leading-relaxed">
          {privacyPolicy.intro}
        </p>
      </div>

      <div className="space-y-6">
        {privacyPolicy.sections.map((sec) => (
          <section
            key={sec.heading}
            className="bg-card border-border space-y-3 rounded-2xl border p-6"
          >
            <h2 className="text-primary flex items-center gap-2 font-serif text-xl font-bold">
              <ShieldCheck className="text-accent size-5 shrink-0" />
              <span>{sec.heading}</span>
            </h2>
            <div className="text-muted-foreground space-y-2.5 pl-7 font-sans text-sm leading-relaxed">
              {sec.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="bg-card border-border space-y-2 rounded-2xl border p-6">
          <h2 className="text-primary font-serif text-xl font-bold">6. Contact</h2>
          {isSupportEmailConfigured ? (
            <p className="text-muted-foreground font-sans text-sm leading-relaxed">
              Questions about this policy can be sent to{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary font-medium underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          ) : (
            <p className="text-muted-foreground font-sans text-sm leading-relaxed">
              {privacyPolicy.contactNote}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
