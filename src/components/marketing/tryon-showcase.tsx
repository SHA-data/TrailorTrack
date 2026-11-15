"use client";

import React, { useState } from "react";
import { Scan, Palette } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { content } from "@/lib/content";

const FABRICS = [
  { id: "emerald", name: "Emerald Raw Silk", hex: "#1F4D3A", text: "#f7f1e3" },
  { id: "ruby", name: "Ruby Maroon Velvet", hex: "#7A1C28", text: "#f7f1e3" },
  { id: "indigo", name: "Indigo Classic Wash", hex: "#1E2C48", text: "#f7f1e3" },
  { id: "ivory", name: "Ivory Cotton Karandi", hex: "#EDE4D0", text: "#1a1f1d" },
  { id: "gold", name: "Antique Gold Jacquard", hex: "#C9A24B", text: "#101312" },
];

export function TryOnShowcase() {
  const { tryon } = content;
  const [selectedFabric, setSelectedFabric] = useState(FABRICS[0]);

  return (
    <section id="try-on" className="bg-cream-50/50 border-border/60 border-b py-20 sm:py-28">
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <Reveal>
            <span className="text-accent font-sans text-xs font-semibold tracking-widest uppercase">
              {tryon.badge}
            </span>
            <h2 className="text-primary mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {tryon.title}
            </h2>
            <p className="text-muted-foreground mt-2 font-sans text-base sm:text-lg">
              {tryon.subtitle}
            </p>
          </Reveal>
        </div>

        {/* Interactive Tabs Container */}
        <Reveal delayMs={150}>
          <div className="bg-card border-border/80 mx-auto max-w-4xl rounded-3xl border p-6 shadow-md sm:p-10">
            <Tabs defaultValue="2d" className="w-full space-y-8">
              <div className="flex justify-center">
                <TabsList className="bg-muted/80 rounded-xl p-1">
                  <TabsTrigger
                    value="2d"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all sm:text-sm"
                  >
                    <Palette className="size-4" />
                    <span>{tryon.tabs.twoD}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="3d"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all sm:text-sm"
                  >
                    <Scan className="size-4" />
                    <span>{tryon.tabs.threeD}</span>
                    <Badge variant="outline" className="border-accent text-accent ml-1 text-[10px]">
                      Soon
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: 2D Studio */}
              <TabsContent value="2d" className="mt-0 space-y-8 focus-visible:outline-none">
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
                  {/* Left Column: Visual Kurta SVG Silhouette */}
                  <div className="flex justify-center md:col-span-6">
                    <div className="bg-background border-border/80 relative flex h-80 w-64 items-center justify-center overflow-hidden rounded-2xl border p-4 shadow-inner">
                      {/* Grid background */}
                      <div className="absolute inset-0 bg-[radial-gradient(#decfa725_1px,transparent_1px)] bg-[size:16px_16px]" />

                      {/* Pure SVG Vector Kurta Silhouette */}
                      <svg
                        viewBox="0 0 200 260"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="z-10 h-64 w-48 drop-shadow-md transition-all duration-500 ease-out"
                      >
                        {/* Kurta Body */}
                        <path
                          d="M60 30 L40 50 L15 100 L35 110 L50 80 L48 240 L152 240 L150 80 L165 110 L185 100 L160 50 L140 30 C125 45 75 45 60 30 Z"
                          fill={selectedFabric.hex}
                          stroke="#1A1F1D"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        {/* Sherwani Collar Band */}
                        <path
                          d="M75 28 C85 36 115 36 125 28 L122 42 C112 48 88 48 78 42 Z"
                          fill="#c9a24b"
                          opacity="0.9"
                          stroke="#1A1F1D"
                          strokeWidth="1.5"
                        />
                        {/* Placket Strip with Buttons */}
                        <rect
                          x="96"
                          y="42"
                          width="8"
                          height="70"
                          fill="#f7f1e3"
                          opacity="0.3"
                          stroke="#1A1F1D"
                          strokeWidth="1"
                        />
                        <circle cx="100" cy="52" r="1.5" fill="#1A1F1D" />
                        <circle cx="100" cy="68" r="1.5" fill="#1A1F1D" />
                        <circle cx="100" cy="84" r="1.5" fill="#1A1F1D" />
                        <circle cx="100" cy="100" r="1.5" fill="#1A1F1D" />
                        {/* Breast Pocket */}
                        <path
                          d="M66 90 L82 90 L82 108 L66 108 Z"
                          stroke="#1A1F1D"
                          strokeWidth="1.2"
                          strokeDasharray="2 1"
                        />
                        {/* Side Slits */}
                        <line x1="48" y1="180" x2="48" y2="240" stroke="#c9a24b" strokeWidth="2" />
                        <line
                          x1="152"
                          y1="180"
                          x2="152"
                          y2="240"
                          stroke="#c9a24b"
                          strokeWidth="2"
                        />
                      </svg>

                      {/* Active Fabric Swatch Badge */}
                      <div className="bg-card/90 border-border/80 absolute right-3 bottom-3 left-3 z-20 flex items-center justify-between rounded-lg border px-2.5 py-1 text-xs backdrop-blur-sm">
                        <span className="text-muted-foreground font-sans text-[11px] font-medium">
                          Preview Cut: Regular Kurta
                        </span>
                        <span className="text-primary text-[11px] font-semibold">
                          {selectedFabric.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Fabric Switcher & Copy */}
                  <div className="space-y-5 md:col-span-6">
                    <div className="space-y-2">
                      <h3 className="text-primary font-serif text-2xl font-bold">
                        {tryon.twoD.heading}
                      </h3>
                      <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                        {tryon.twoD.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <span className="text-muted-foreground font-sans text-xs font-semibold tracking-wider uppercase">
                        {tryon.twoD.swatchLabel}
                      </span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {FABRICS.map((fabric) => {
                          const isSelected = selectedFabric.id === fabric.id;
                          return (
                            <button
                              key={fabric.id}
                              type="button"
                              onClick={() => setSelectedFabric(fabric)}
                              className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
                                isSelected
                                  ? "border-accent bg-accent/10 ring-accent/30 font-semibold ring-2"
                                  : "border-border bg-background hover:bg-muted/60"
                              }`}
                            >
                              <span
                                className="size-6 shrink-0 rounded-full border border-black/20 shadow-2xs"
                                style={{ backgroundColor: fabric.hex }}
                              />
                              <span className="text-foreground font-sans text-xs">
                                {fabric.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Live 3D (Coming Soon) */}
              <TabsContent value="3d" className="mt-0 space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
                  {/* Left Column: 3D Radar Mockup */}
                  <div className="flex justify-center md:col-span-6">
                    <div className="border-accent/40 relative flex h-80 w-64 items-center justify-center overflow-hidden rounded-2xl border bg-[#0e1713] p-4 shadow-xl">
                      {/* Stylized Wireframe Matrix Grid */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#5fa88a15_1px,transparent_1px),linear-gradient(to_bottom,#5fa88a15_1px,transparent_1px)] bg-[size:16px_16px]" />

                      {/* Animated Scanning Sweep Bar */}
                      <div className="via-accent absolute top-0 right-0 left-0 h-1 animate-[bounce_3s_infinite_ease-in-out] bg-gradient-to-r from-transparent to-transparent" />

                      {/* Stylized Biometric Silhouette */}
                      <svg
                        viewBox="0 0 160 220"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="z-10 h-56 w-40 opacity-75"
                      >
                        {/* Head */}
                        <circle
                          cx="80"
                          cy="25"
                          r="14"
                          stroke="#5fa88a"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                        {/* Shoulders & Torso */}
                        <path
                          d="M45 50 L115 50 L105 130 L55 130 Z"
                          stroke="#c9a24b"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                        {/* Arms */}
                        <line x1="45" y1="50" x2="30" y2="120" stroke="#5fa88a" strokeWidth="1.5" />
                        <line
                          x1="115"
                          y1="50"
                          x2="130"
                          y2="120"
                          stroke="#5fa88a"
                          strokeWidth="1.5"
                        />
                        {/* Legs */}
                        <line
                          x1="65"
                          y1="130"
                          x2="60"
                          y2="200"
                          stroke="#5fa88a"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="95"
                          y1="130"
                          x2="100"
                          y2="200"
                          stroke="#5fa88a"
                          strokeWidth="1.5"
                        />
                        {/* Pose Landmark points */}
                        <circle cx="80" cy="50" r="3" fill="#c9a24b" />
                        <circle cx="45" cy="50" r="3" fill="#c9a24b" />
                        <circle cx="115" cy="50" r="3" fill="#c9a24b" />
                        <circle cx="80" cy="90" r="3" fill="#5fa88a" />
                        <circle cx="55" cy="130" r="3" fill="#c9a24b" />
                        <circle cx="105" cy="130" r="3" fill="#c9a24b" />
                      </svg>

                      <div className="border-accent/30 text-accent absolute top-3 left-3 rounded border bg-black/60 px-2 py-0.5 font-mono text-[10px] backdrop-blur-xs">
                        FPS: 60 • MediaPipe
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 3D Teaser Description */}
                  <div className="space-y-4 md:col-span-6">
                    <Badge variant="outline" className="border-accent text-accent">
                      {tryon.threeD.badge}
                    </Badge>
                    <h3 className="text-primary font-serif text-2xl font-bold">
                      {tryon.threeD.heading}
                    </h3>
                    <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                      {tryon.threeD.description}
                    </p>
                    <div className="bg-background border-border/80 text-muted-foreground space-y-1 rounded-xl border p-3.5 font-mono text-xs">
                      <div className="text-primary font-sans font-semibold">
                        Technical Capability:
                      </div>
                      <div>{tryon.threeD.scanningNotice}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
