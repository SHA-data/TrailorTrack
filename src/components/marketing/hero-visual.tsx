import React from "react";
import { QrCode, Shield, Check, Scissors } from "lucide-react";
import { content } from "@/lib/content";

export function HeroVisual() {
  const cardData = content.hero.passportCard;

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none sm:max-w-[380px] lg:max-w-[420px]">
      {/* Decorative Warm Ambient Glow */}
      <div
        className="from-accent/20 via-primary/15 pointer-events-none absolute -inset-4 rounded-[48px] bg-gradient-to-tr to-transparent opacity-70 blur-2xl sm:-inset-6"
        aria-hidden="true"
      />

      {/* Floating Cultural Badge 1 (Top Left) */}
      <div
        className="xs:flex bg-card/90 border-accent/40 absolute -top-3 -left-3 z-20 hidden animate-[bounce_4s_infinite_ease-in-out] items-center gap-2 rounded-full border px-3 py-1.5 shadow-md backdrop-blur-md sm:-left-6"
        aria-hidden="true"
      >
        <span className="bg-primary text-accent flex size-5 items-center justify-center rounded-full">
          <Scissors className="size-3" />
        </span>
        <span className="text-foreground font-sans text-xs font-semibold">
          Kameez Shalwar & Kurta
        </span>
      </div>

      {/* Floating Security Badge 2 (Bottom Right) */}
      <div
        className="bg-card/95 border-accent/40 absolute -right-2 -bottom-4 z-20 flex items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-md backdrop-blur-md sm:-right-6"
        aria-hidden="true"
      >
        <Shield className="text-accent size-4" />
        <span className="text-foreground font-sans text-xs font-semibold">You Own Your Data</span>
      </div>

      {/* Smartphone Chassis */}
      <div className="border-accent/30 relative rounded-[40px] border-2 bg-gradient-to-b from-[#1f4d3a] via-[#153427] to-[#0e241c] p-3 shadow-2xl ring-1 ring-black/20 sm:rounded-[46px] sm:p-3.5">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-4 left-1/2 z-20 flex h-4 w-24 -translate-x-1/2 items-center justify-end rounded-full bg-black/70 pr-2.5">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500/80" />
        </div>

        {/* Screen Bezel / Container */}
        <div className="border-border/80 relative flex flex-col space-y-3.5 overflow-hidden rounded-[32px] border bg-[#fbf9f5] p-4 pt-8 text-[#1a1f1d] shadow-inner sm:rounded-[36px] sm:p-5">
          {/* Phone Header Strip */}
          <div className="border-border/70 flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-2">
              <span className="bg-accent size-2.5 rounded-full" />
              <span className="text-primary font-serif text-xs font-bold tracking-wider uppercase">
                Digital Passport
              </span>
            </div>
            <span className="bg-accent/20 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-[#76522c]">
              {cardData.passportId}
            </span>
          </div>

          {/* Owner Profile Banner */}
          <div className="bg-primary relative space-y-1 overflow-hidden rounded-2xl p-3.5 text-[#f7f1e3] shadow-sm">
            <div className="bg-accent/10 pointer-events-none absolute top-0 right-0 size-20 translate-x-3 -translate-y-3 rounded-full" />
            <div className="flex items-center justify-between">
              <span className="text-accent font-sans text-[10px] font-semibold tracking-wider uppercase">
                Customer Passport
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#f7f1e3]/80">
                <Check className="text-accent size-3" /> Verified
              </span>
            </div>
            <h4 className="font-serif text-lg font-bold tracking-tight text-[#f7f1e3]">
              {cardData.ownerName}
            </h4>
            <p className="font-sans text-xs text-[#f7f1e3]/80">{cardData.garment}</p>
          </div>

          {/* Measurement Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Chest", val: cardData.chest },
              { label: "Length", val: cardData.length },
              { label: "Waist", val: cardData.waist },
              { label: "Shoulder", val: cardData.shoulder },
              { label: "Collar (Band)", val: cardData.collar },
              { label: "Sleeve", val: cardData.sleeve },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-card border-border/80 flex items-center justify-between rounded-xl border p-2.5 shadow-2xs"
              >
                <span className="text-muted-foreground text-[11px] font-medium">{item.label}</span>
                <span className="text-primary font-mono font-bold">{item.val}</span>
              </div>
            ))}
          </div>

          {/* Stylized QR Access Token */}
          <div className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3 shadow-2xs">
            {/* Pure SVG QR Code Motif */}
            <div className="bg-primary/95 border-accent/40 flex size-16 shrink-0 items-center justify-center rounded-xl border p-1.5">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-accent h-full w-full"
              >
                {/* QR corner 1 */}
                <rect
                  x="2"
                  y="2"
                  width="10"
                  height="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  rx="2"
                />
                <rect x="5" y="5" width="4" height="4" fill="currentColor" />
                {/* QR corner 2 */}
                <rect
                  x="20"
                  y="2"
                  width="10"
                  height="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  rx="2"
                />
                <rect x="23" y="5" width="4" height="4" fill="currentColor" />
                {/* QR corner 3 */}
                <rect
                  x="2"
                  y="20"
                  width="10"
                  height="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  rx="2"
                />
                <rect x="5" y="23" width="4" height="4" fill="currentColor" />
                {/* QR Data Dots */}
                <rect x="15" y="4" width="2" height="4" fill="#f7f1e3" />
                <rect x="14" y="14" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="20" y="16" width="3" height="3" fill="#f7f1e3" />
                <rect x="26" y="22" width="4" height="4" fill="currentColor" />
                <rect x="14" y="24" width="3" height="3" fill="#f7f1e3" />
              </svg>
            </div>

            <div className="space-y-0.5">
              <div className="text-primary flex items-center gap-1.5 text-xs font-semibold">
                <QrCode className="text-accent size-3.5" />
                <span>One-Time Scan Token</span>
              </div>
              <p className="text-muted-foreground text-[10px] leading-snug">
                Present to tailor to authorize read-only measurements.
              </p>
              <span className="inline-block text-[10px] font-medium text-emerald-700">
                ● Ready for scan
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
