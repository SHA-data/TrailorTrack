import React from "react";
import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { content } from "@/lib/content";

export function Footer() {
  const { footer } = content;

  return (
    <footer className="bg-card border-border/80 text-foreground border-t py-16 sm:py-20">
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-5">
            <Logo />
            <p className="text-muted-foreground max-w-sm font-sans text-sm leading-relaxed">
              {footer.description}
            </p>
            <div className="bg-background border-border/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-xs">
              <span className="size-2 rounded-full bg-emerald-600" />
              <span>{content.common.madeInPakistan}</span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {/* Product Links */}
            <div className="space-y-3">
              <h4 className="text-primary font-serif text-sm font-bold tracking-wider uppercase">
                {footer.sections.product.title}
              </h4>
              <ul className="text-muted-foreground space-y-2 font-sans text-xs sm:text-sm">
                {footer.sections.product.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary focus-visible:ring-ring rounded transition-colors focus-visible:ring-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Professionals */}
            <div className="space-y-3">
              <h4 className="text-primary font-serif text-sm font-bold tracking-wider uppercase">
                {footer.sections.tailors.title}
              </h4>
              <ul className="text-muted-foreground space-y-2 font-sans text-xs sm:text-sm">
                {footer.sections.tailors.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary focus-visible:ring-ring rounded transition-colors focus-visible:ring-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust & Legal */}
            <div className="col-span-2 space-y-3 sm:col-span-1">
              <h4 className="text-primary font-serif text-sm font-bold tracking-wider uppercase">
                {footer.sections.legal.title}
              </h4>
              <ul className="text-muted-foreground space-y-2 font-sans text-xs sm:text-sm">
                {footer.sections.legal.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary focus-visible:ring-ring rounded transition-colors focus-visible:ring-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-border/60 text-muted-foreground flex flex-col items-center justify-between gap-4 border-t pt-8 font-sans text-xs sm:flex-row">
          <p>
            © 2026 TailorTrack. {footer.rights}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/for-tailors" className="hover:text-primary transition-colors">
              For Tailors
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
