import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { content } from "@/lib/content";

export function Navbar() {
  const navLinks = [
    { label: content.nav.howItWorks, href: "/#how-it-works" },
    { label: content.nav.features, href: "/#features" },
    { label: content.nav.tryon, href: "/#try-on" },
    { label: content.nav.forTailors, href: "/for-tailors" },
    { label: content.nav.faq, href: "/#faq" },
  ];

  return (
    <header className="border-border/70 bg-background/85 sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          {/* Brand Logo */}
          <Logo />

          {/* Desktop Navigation Links */}
          <nav
            className="text-muted-foreground hidden items-center gap-1 text-sm font-medium md:flex lg:gap-2"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-primary hover:bg-muted/60 focus-visible:ring-ring rounded-md px-3 py-1.5 transition-colors focus-visible:ring-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted/70 hover:text-primary text-sm font-medium"
              >
                {content.nav.login}
              </Button>
            </Link>

            <Link href="/signup">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 text-xs font-medium shadow-xs sm:px-4 sm:text-sm"
              >
                {content.nav.getStarted}
              </Button>
            </Link>

            {/* Mobile Navigation Sheet */}
            <MobileNav navLinks={navLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}
