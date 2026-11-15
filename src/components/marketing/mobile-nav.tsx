"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, ArrowRight, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";
import { content } from "@/lib/content";

interface MobileNavProps {
  navLinks: Array<{ label: string; href: string }>;
}

export function MobileNav({ navLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-border bg-card/60 text-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 md:hidden"
          aria-label={content.nav.menuLabel}
        >
          <Menu className="text-primary size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-card border-border flex w-[85vw] max-w-xs flex-col justify-between overflow-y-auto p-6 sm:max-w-sm"
      >
        <div className="space-y-6">
          <SheetHeader className="border-border/80 border-b pb-4 text-left">
            <SheetTitle>
              <Logo linkToHome={false} />
            </SheetTitle>
            <SheetDescription className="text-muted-foreground pt-1 font-sans text-xs">
              {content.common.tagline}
            </SheetDescription>
          </SheetHeader>

          {/* Nav Links */}
          <nav className="flex flex-col space-y-1.5" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className="text-foreground hover:bg-muted hover:text-primary focus-visible:ring-ring flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="text-muted-foreground size-3.5" />
                </Link>
              </SheetClose>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="border-border/80 space-y-3 border-t pt-6">
          <div className="bg-background border-border/60 text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <ShieldCheck className="text-accent size-4 shrink-0" />
            <span>Customer-owned • B2C Data Sovereignty</span>
          </div>

          <div className="flex flex-col gap-2">
            <SheetClose asChild>
              <Link href="/signup" className="w-full">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full font-medium">
                  {content.nav.getStarted}
                </Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="border-border w-full">
                  {content.nav.login}
                </Button>
              </Link>
            </SheetClose>
          </div>

          <p className="text-muted-foreground text-center font-sans text-[11px]">
            {content.common.madeInPakistan}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
