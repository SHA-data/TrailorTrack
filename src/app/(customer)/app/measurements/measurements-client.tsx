"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ruler, Plus, ArrowRight, History, Calendar, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ALL_GARMENTS, GARMENTS_BY_CATEGORY } from "@/lib/measurements/templates";
import type { FitCategory, GarmentType, PreferredUnit } from "@/types/database";

export interface PersonOption {
  id: string; // 'me' or family_member_id
  name: string;
  relation?: string;
  fitCategory: FitCategory;
}

export interface LatestSetSummary {
  id: string;
  garmentType: GarmentType;
  fitPreference: string | null;
  takenOn: string;
  keyValues: { label: string; valueFormatted: string }[];
  historyCount: number;
}

interface MeasurementsClientProps {
  people: PersonOption[];
  preferredUnit: PreferredUnit;
  latestSetsByPersonAndGarment: Record<string, Record<string, LatestSetSummary>>;
}

function MeasurementsContent({
  people,
  preferredUnit,
  latestSetsByPersonAndGarment,
}: MeasurementsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPersonId = searchParams.get("person") || "me";

  const currentPerson = people.find((p) => p.id === selectedPersonId) || people[0];
  const fitCategory = currentPerson?.fitCategory || "men";
  const garments = GARMENTS_BY_CATEGORY[fitCategory] || [];
  const personSets = latestSetsByPersonAndGarment[currentPerson?.id || "me"] || {};

  const handleSelectPerson = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "me") {
      params.delete("person");
    } else {
      params.set("person", id);
    }
    router.push(`/app/measurements?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="border-accent/40 bg-card text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>Digital Measurement Passport</span>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] uppercase">
              Unit: {preferredUnit}
            </Badge>
          </div>
          <h1 className="text-primary font-serif text-3xl font-bold tracking-tight">
            Garment Measurements
          </h1>
          <p className="text-muted-foreground mt-0.5 font-sans text-xs sm:text-sm">
            Precision bespoke measurements for Shalwar Kameez, Kurtas, Waistcoats, and Sherwanis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
            <Link href="/app/family">
              <Users className="size-3.5" />
              <span>Manage Family</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link href={`/app/measurements/new?person=${currentPerson?.id || "me"}&garment=kameez`}>
              <Plus className="size-4" />
              <span>New Measurement Set</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Person Switcher Chips (Horizontal Scrollable) */}
      <div className="flex scrollbar-none items-center gap-2 overflow-x-auto pb-2">
        {people.map((person) => {
          const isSelected = (currentPerson?.id || "me") === person.id;
          return (
            <button
              key={person.id}
              onClick={() => handleSelectPerson(person.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary ring-primary shadow-xs ring-1"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <span>{person.name}</span>
              {person.relation && (
                <span
                  className={`py-0.2 rounded px-1.5 text-[10px] capitalize ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {person.relation}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Garments Grid for Selected Person */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {garments.map((garmentType) => {
          const meta = ALL_GARMENTS[garmentType];
          const latestSet = personSets[garmentType];

          if (latestSet) {
            return (
              <Card
                key={garmentType}
                className="border-border bg-card hover:border-primary/40 flex flex-col justify-between overflow-hidden shadow-xs transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-foreground font-serif text-lg font-bold">
                          {meta?.label || garmentType}
                        </CardTitle>
                        <span className="text-accent font-sans text-[11px] font-medium">
                          {meta?.urduName}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
                          {latestSet.fitPreference || "Regular"} Fit
                        </Badge>
                        <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                          <Calendar className="size-3" />
                          <span>{latestSet.takenOn}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-1 font-sans text-xs">
                      <History className="text-primary size-3.5" />
                      <span>
                        {latestSet.historyCount} {latestSet.historyCount === 1 ? "v" : "versions"}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key values summary pill row */}
                  <div className="bg-muted/40 border-border/60 grid grid-cols-3 gap-2 rounded-xl border p-2.5">
                    {latestSet.keyValues.slice(0, 3).map((kv) => (
                      <div key={kv.label} className="text-center">
                        <div className="text-muted-foreground truncate font-sans text-[10px]">
                          {kv.label}
                        </div>
                        <div className="text-foreground font-serif text-xs font-bold">
                          {kv.valueFormatted}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                      <Link href={`/app/measurements/${latestSet.id}`}>
                        <span>View & History</span>
                        <ArrowRight className="ml-1 size-3" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="text-xs">
                      <Link
                        href={`/app/measurements/new?person=${currentPerson?.id || "me"}&garment=${garmentType}`}
                      >
                        <Plus className="mr-0.5 size-3.5" />
                        <span>Update</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Empty state card for this garment
          return (
            <Card
              key={garmentType}
              className="border-border/80 bg-card/30 hover:bg-card/60 flex flex-col justify-between border-dashed p-6 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                    <Ruler className="text-accent size-4" />
                  </div>
                  <span className="text-accent font-sans text-[11px]">{meta?.urduName}</span>
                </div>
                <div>
                  <h3 className="text-foreground font-serif text-lg font-bold">
                    {meta?.label || garmentType}
                  </h3>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                    {meta?.description}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <Link
                    href={`/app/measurements/new?person=${currentPerson?.id || "me"}&garment=${garmentType}`}
                  >
                    <Plus className="size-3.5" />
                    <span>Add {meta?.label}</span>
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function MeasurementsClient(props: MeasurementsClientProps) {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-8 text-center text-xs">
          Loading passport measurements...
        </div>
      }
    >
      <MeasurementsContent {...props} />
    </Suspense>
  );
}
