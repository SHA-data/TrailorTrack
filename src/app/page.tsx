"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Scissors,
  CheckCircle2,
  SlidersHorizontal,
  Bell,
  ShieldCheck,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { content } from "@/lib/content";

export default function Home() {
  const [customerName, setCustomerName] = React.useState("Tariq Mahmood");

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      {/* Top Temporary Verification Banner */}
      <div className="flex items-center justify-between border-b border-[#c9a24b]/30 bg-[#1f4d3a] px-4 py-2 text-xs font-medium tracking-wide text-[#f7f1e3] md:text-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="inline-block size-2 animate-pulse rounded-full bg-[#c9a24b]" />
            <strong className="tracking-wider uppercase">Phase 0: Project Foundation</strong>
            <span className="hidden text-[#f7f1e3]/80 sm:inline">
              — Temporary Verification Page (Will be replaced in Phase 1)
            </span>
          </span>
          <Badge
            variant="outline"
            className="border-[#c9a24b] bg-[#1f4d3a]/60 text-[11px] text-[#c9a24b]"
          >
            Light Mode Ready
          </Badge>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-12 px-4 pt-8 sm:px-6 lg:px-8">
        {/* Brand Header */}
        <section className="space-y-4 pt-4 pb-2 text-center">
          <div className="border-border bg-card/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-xs">
            <Scissors className="text-accent size-3.5" />
            <span>Digital Tailoring Passport for Pakistan</span>
          </div>
          <h1 className="text-primary font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            TailorTrack
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl font-sans text-base sm:text-lg">
            {content.phase0.subtitle}
          </p>
        </section>

        {/* 1. Typography Showcase */}
        <section className="bg-card border-border space-y-6 rounded-xl border p-6 shadow-xs">
          <div className="border-border/80 flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-primary font-serif text-xl font-bold">
                1. Typography Verification
              </h2>
              <p className="text-muted-foreground text-xs">
                Loaded via next/font with CSS variables & Tailwind font families
              </p>
            </div>
            <Badge variant="secondary">next/font</Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-background border-border/60 space-y-2 rounded-lg border p-4">
              <span className="text-accent font-sans text-xs font-semibold tracking-wider uppercase">
                Display & Heading Serif (Cormorant Garamond)
              </span>
              <p className="text-foreground font-serif text-2xl font-bold">
                &ldquo;{content.phase0.serifSample}&rdquo;
              </p>
              <p className="text-muted-foreground font-serif text-lg italic">
                Tailored Craftsmanship • Heritage Textures • Precision Fit
              </p>
              <div className="text-muted-foreground pt-1 font-mono text-xs">
                Class: font-serif / font-display
              </div>
            </div>

            <div className="bg-background border-border/60 space-y-2 rounded-lg border p-4">
              <span className="text-accent font-sans text-xs font-semibold tracking-wider uppercase">
                UI & Body Sans (DM Sans)
              </span>
              <p className="text-foreground font-sans text-base font-medium">
                {content.phase0.sansSample}
              </p>
              <p className="text-muted-foreground font-sans text-sm">
                Mobile-first QR scanning, encrypted measurements, and instant tailor handoffs.
              </p>
              <div className="text-muted-foreground pt-1 font-mono text-xs">
                Class: font-sans (Default root UI)
              </div>
            </div>
          </div>
        </section>

        {/* 2. Color Palette Swatches */}
        <section className="bg-card border-border space-y-6 rounded-xl border p-6 shadow-xs">
          <div className="border-border/80 flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-primary font-serif text-xl font-bold">
                2. Brand Color Palette Swatches
              </h2>
              <p className="text-muted-foreground text-xs">
                Forest Green 50-950, Cream 50-500, Gold 50-950, and Neutral Warm Ink
              </p>
            </div>
            <Badge variant="outline">TailorTrack Tokens</Badge>
          </div>

          {/* Forest Green Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-primary font-semibold">
                Forest Green (Primary Brand: #1F4D3A)
              </span>
              <span className="text-muted-foreground">50 — 950</span>
            </div>
            <div className="grid grid-cols-11 gap-1 text-center font-mono text-[10px]">
              {[
                { step: "50", bg: "bg-[#f0f7f4]", text: "text-zinc-800" },
                { step: "100", bg: "bg-[#dbeee5]", text: "text-zinc-800" },
                { step: "200", bg: "bg-[#b9decb]", text: "text-zinc-800" },
                { step: "300", bg: "bg-[#8dc6ac]", text: "text-zinc-800" },
                { step: "400", bg: "bg-[#5fa88a]", text: "text-zinc-900" },
                { step: "500", bg: "bg-[#3f8c6f]", text: "text-white" },
                { step: "600", bg: "bg-[#2f6f57]", text: "text-white" },
                { step: "700", bg: "bg-[#265947]", text: "text-white" },
                { step: "800*", bg: "bg-[#1f4d3a]", text: "text-[#f7f1e3] ring-2 ring-[#c9a24b]" },
                { step: "900", bg: "bg-[#1a4031]", text: "text-white" },
                { step: "950", bg: "bg-[#0e241c]", text: "text-white" },
              ].map((swatch) => (
                <div
                  key={swatch.step}
                  className={`${swatch.bg} ${swatch.text} flex flex-col justify-end rounded-sm px-0.5 py-3 shadow-xs`}
                >
                  <span>{swatch.step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cream & Gold & Ink Scales */}
          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-3">
            {/* Cream */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground font-semibold">Cream (Canvas: #F7F1E3)</span>
                <span className="text-muted-foreground">50 — 500</span>
              </div>
              <div className="grid grid-cols-6 gap-1 text-center font-mono text-[10px]">
                {[
                  { step: "50", bg: "bg-[#fdfbf7]" },
                  { step: "100*", bg: "bg-[#f7f1e3] ring-2 ring-primary" },
                  { step: "200", bg: "bg-[#efe4cb]" },
                  { step: "300", bg: "bg-[#e4d3ac]" },
                  { step: "400", bg: "bg-[#d7be8a]" },
                  { step: "500", bg: "bg-[#c8a86a]" },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`${s.bg} border-border/60 flex flex-col justify-end rounded-sm border py-3 text-zinc-900`}
                  >
                    <span>{s.step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gold */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-accent font-semibold">Gold Accent (#C9A24B)</span>
                <span className="text-muted-foreground">50 — 950</span>
              </div>
              <div className="grid grid-cols-6 gap-1 text-center font-mono text-[10px]">
                {[
                  { step: "100", bg: "bg-[#f7f0d3]", text: "text-zinc-900" },
                  { step: "300", bg: "bg-[#e4cc76]", text: "text-zinc-900" },
                  { step: "500*", bg: "bg-[#c9a24b]", text: "text-zinc-950 ring-2 ring-primary" },
                  { step: "700", bg: "bg-[#906632]", text: "text-white" },
                  { step: "800", bg: "bg-[#76522c]", text: "text-white" },
                  { step: "950", bg: "bg-[#3a2413]", text: "text-white" },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`${s.bg} ${s.text} flex flex-col justify-end rounded-sm py-3`}
                  >
                    <span>{s.step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ink */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground font-semibold">Neutral Warm Ink</span>
                <span className="text-muted-foreground">#1A1F1D</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                {[
                  { step: "100", bg: "bg-[#e2e5e3]", text: "text-zinc-900" },
                  { step: "400", bg: "bg-[#78837c]", text: "text-white" },
                  { step: "700", bg: "bg-[#3b423e]", text: "text-white" },
                  {
                    step: "900*",
                    bg: "bg-[#1a1f1d]",
                    text: "text-[#f7f1e3] ring-2 ring-[#c9a24b]",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`${s.bg} ${s.text} flex flex-col justify-end rounded-sm py-3`}
                  >
                    <span>{s.step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Installed shadcn/ui Component Showcase */}
        <section className="space-y-6">
          <div className="border-border/80 flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-primary font-serif text-2xl font-bold">
                3. Installed shadcn/ui Primitives (10 Components)
              </h2>
              <p className="text-muted-foreground text-xs">
                Testing button, card, input, label, dialog, sheet, tabs, badge, skeleton, sonner
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-primary text-primary-foreground">
                Theme Mapped
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1: Buttons & Badges */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary font-serif text-xl">
                    Buttons & Badges
                  </CardTitle>
                  <Badge variant="outline" className="border-[#c9a24b] text-[#c9a24b]">
                    Primitives 1 & 2
                  </Badge>
                </div>
                <CardDescription>
                  Verifying theme variants across interactive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="default">Primary Forest</Button>
                  <Button variant="secondary">Secondary Cream</Button>
                  <Button variant="outline">Outline</Button>
                  <Button className="bg-[#c9a24b] font-semibold text-[#101312] hover:bg-[#b2873c]">
                    Gold Accent
                  </Button>
                  <Button variant="destructive">Destructive</Button>
                </div>

                <div className="border-border/60 flex flex-wrap items-center gap-2 border-t pt-2">
                  <Badge variant="default">Default Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1f4d3a] px-2.5 py-0.5 text-xs font-semibold text-[#f7f1e3]">
                    <ShieldCheck className="size-3 text-[#c9a24b]" />
                    Verified Passport
                  </span>
                </div>
              </CardContent>
              <CardFooter className="text-muted-foreground border-border/40 border-t pt-3 text-xs">
                Buttons inherit `--primary` and `--secondary` HSL variables directly.
              </CardFooter>
            </Card>

            {/* Card 2: Form Inputs & Labels */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary font-serif text-xl">Inputs & Labels</CardTitle>
                  <Badge variant="outline" className="border-[#c9a24b] text-[#c9a24b]">
                    Primitives 3 & 4
                  </Badge>
                </div>
                <CardDescription>
                  Form controls with boutique borders and focus ring styling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customer-name" className="text-foreground text-xs font-semibold">
                    Customer Full Name
                  </Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter full name"
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sample-measurement"
                    className="text-foreground text-xs font-semibold"
                  >
                    Chest / Chest Circumference (Inches)
                  </Label>
                  <Input
                    id="sample-measurement"
                    defaultValue="40.5"
                    placeholder="e.g. 40.5"
                    className="bg-background border-input"
                  />
                </div>
              </CardContent>
              <CardFooter className="text-muted-foreground border-border/40 border-t pt-3 text-xs">
                Focus rings utilize TailorTrack forest green token.
              </CardFooter>
            </Card>

            {/* Card 3: Interactive Dialog & Sheet */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary font-serif text-xl">Dialog & Sheet</CardTitle>
                  <Badge variant="outline" className="border-[#c9a24b] text-[#c9a24b]">
                    Primitives 5 & 6
                  </Badge>
                </div>
                <CardDescription>
                  Modal and mobile drawer triggers with accessible overlays
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {/* Dialog Trigger */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Sparkles className="text-accent size-4" />
                      Open Dialog Modal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-primary font-serif text-2xl">
                        Customer Passport Preview
                      </DialogTitle>
                      <DialogDescription>
                        This modal verifies the Dialog primitive within the TailorTrack design
                        system.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div className="bg-background border-border/70 flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="text-sm font-semibold">{customerName}</div>
                          <div className="text-muted-foreground text-xs">
                            Digital Passport #TT-9482
                          </div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">Active Consent</Badge>
                      </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <DialogClose asChild>
                        <Button variant="secondary">Close</Button>
                      </DialogClose>
                      <Button
                        className="bg-primary text-primary-foreground"
                        onClick={() => toast.success("Passport verified successfully!")}
                      >
                        Confirm Passport
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Sheet Trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <SlidersHorizontal className="text-accent size-4" />
                      Open Mobile Sheet
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-card border-border">
                    <SheetHeader>
                      <SheetTitle className="text-primary font-serif text-2xl">
                        Tailor Quick Actions
                      </SheetTitle>
                      <SheetDescription>
                        A lightweight mobile drawer optimized for tailor shop workflows.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-6">
                      <div className="space-y-1">
                        <Label className="text-xs">Tailor Shop</Label>
                        <p className="text-foreground text-sm font-semibold">
                          Royal Bespoke, Lahore
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">QR Scan Status</Label>
                        <p className="text-muted-foreground text-xs">
                          Ready to accept incoming passport scan.
                        </p>
                      </div>
                      <Button
                        className="w-full bg-[#1f4d3a] text-[#f7f1e3]"
                        onClick={() => toast.info("Scanner activated (Phase 2 Preview)")}
                      >
                        Start QR Scanner
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </CardContent>
              <CardFooter className="text-muted-foreground border-border/40 border-t pt-3 text-xs">
                Overlays and backdrop filters retain cream/ink contrast.
              </CardFooter>
            </Card>

            {/* Card 4: Tabs, Skeleton & Sonner Toast */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary font-serif text-xl">
                    Tabs, Skeleton & Toast
                  </CardTitle>
                  <Badge variant="outline" className="border-[#c9a24b] text-[#c9a24b]">
                    Primitives 7, 8, 9 & 10
                  </Badge>
                </div>
                <CardDescription>
                  Tab switching, loading placeholders, and toast feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tabs */}
                <Tabs defaultValue="measurements" className="w-full">
                  <TabsList className="bg-muted/80 grid grid-cols-2">
                    <TabsTrigger value="measurements">Measurements</TabsTrigger>
                    <TabsTrigger value="skeleton">Loading State</TabsTrigger>
                  </TabsList>

                  <TabsContent value="measurements" className="space-y-3 pt-3">
                    <div className="bg-background border-border/60 flex items-center justify-between rounded border p-2 text-xs">
                      <span>
                        Kameez Length: <strong>42.0 in</strong>
                      </span>
                      <span>
                        Shoulder: <strong>18.5 in</strong>
                      </span>
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    {/* Sonner Trigger */}
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground w-full gap-1.5 font-semibold hover:bg-[#b2873c]"
                      onClick={() =>
                        toast.success("TailorTrack Toast Verified!", {
                          description:
                            "Sonner toaster is configured with brand palette and rich colors.",
                        })
                      }
                    >
                      <Bell className="size-3.5" />
                      Trigger Toast Notification
                    </Button>
                  </TabsContent>

                  <TabsContent value="skeleton" className="space-y-2 pt-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="bg-muted size-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="bg-muted h-4 w-3/4" />
                        <Skeleton className="bg-muted h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="bg-muted h-8 w-full rounded-md" />
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="text-muted-foreground border-border/40 border-t pt-3 text-xs">
                All 10 required shadcn components functioning in unison.
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 4. Architecture Verification Checklist */}
        <section className="bg-card border-border space-y-4 rounded-xl border p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <Layers className="text-accent size-5" />
            <h3 className="text-primary font-serif text-xl font-bold">
              Phase 0 Architecture & Compliance Summary
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-background border-border/70 space-y-1 rounded-lg border p-3">
              <span className="text-foreground flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="text-primary size-3.5" />
                Folder Structure
              </span>
              <p className="text-muted-foreground">
                (marketing), (auth), (customer), (tailor), ui, shared, lib/supabase, content, types
              </p>
            </div>
            <div className="bg-background border-border/70 space-y-1 rounded-lg border p-3">
              <span className="text-foreground flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="text-primary size-3.5" />
                Supabase SSR Client
              </span>
              <p className="text-muted-foreground">
                SSR helpers in lib/supabase, .env.example with anon placeholders, gitignored
                .env.local
              </p>
            </div>
            <div className="bg-background border-border/70 space-y-1 rounded-lg border p-3">
              <span className="text-foreground flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="text-primary size-3.5" />
                Developer Tooling
              </span>
              <p className="text-muted-foreground">
                Prettier + Tailwind plugin, npm scripts for lint, typecheck, format passing cleanly
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
