"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Save, HelpCircle, Sparkles, Info, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ALL_GARMENTS,
  GARMENTS_BY_CATEGORY,
  getMeasurementTemplate,
} from "@/lib/measurements/templates";
import { saveMeasurementSetAction } from "@/lib/measurements/actions";
import { inchesToCm } from "@/lib/measurements/units";
import type { FitCategory, GarmentType, PreferredUnit, FitPreference } from "@/types/database";

export interface PersonItem {
  id: string; // 'me' or family_member_id
  name: string;
  relation?: string;
  fitCategory: FitCategory;
}

interface NewMeasurementFormProps {
  people: PersonItem[];
  defaultPersonId: string;
  defaultGarment: GarmentType;
  defaultUnit: PreferredUnit;
}

export function NewMeasurementForm({
  people,
  defaultPersonId,
  defaultGarment,
  defaultUnit,
}: NewMeasurementFormProps) {
  const router = useRouter();
  const [personId, setPersonId] = useState(defaultPersonId);
  const [garmentType, setGarmentType] = useState<GarmentType>(defaultGarment);
  const [unit, setUnit] = useState<PreferredUnit>(defaultUnit);
  const [fitPreference, setFitPreference] = useState<FitPreference>("regular");
  const [activeTipField, setActiveTipField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPerson = people.find((p) => p.id === personId) || people[0];
  const fitCategory = currentPerson?.fitCategory || "men";
  const availableGarments = GARMENTS_BY_CATEGORY[fitCategory] || ["kameez"];

  // Ensure selected garment is valid for current person
  const activeGarment = availableGarments.includes(garmentType)
    ? garmentType
    : availableGarments[0] || "kameez";

  const fields = getMeasurementTemplate(fitCategory, activeGarment);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("familyMemberId", personId === "me" ? "" : personId);
    formData.set("garmentType", activeGarment);
    formData.set("inputUnit", unit);
    formData.set("fitPreference", fitPreference);

    startTransition(async () => {
      const result = await saveMeasurementSetAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      } else if (result?.success && result?.setId) {
        toast.success("Measurement set saved to passport!");
        router.push(`/app/measurements/${result.setId}`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/app/measurements"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Passport</span>
          </Link>
        </Button>

        {/* In/Cm Unit Toggle */}
        <div className="border-border bg-card flex items-center gap-1 rounded-xl border p-1 text-xs">
          <span className="text-muted-foreground px-2 text-[11px]">Unit:</span>
          <button
            type="button"
            onClick={() => setUnit("in")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              unit === "in"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inches (in)
          </button>
          <button
            type="button"
            onClick={() => setUnit("cm")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              unit === "cm"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Centimeters (cm)
          </button>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="text-accent flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="size-3.5" />
            <span>New Bespoke Measurement Set</span>
          </div>
          <CardTitle className="text-foreground font-serif text-2xl font-bold">
            {ALL_GARMENTS[activeGarment]?.label || activeGarment} Specifications
          </CardTitle>
          <CardDescription className="font-sans text-xs">
            Enter body or sample garment measurements. Values will be saved as an immutable
            versioned entry in your digital passport.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 font-sans text-xs font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Selector Row: Person & Garment */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="personSelect" className="text-foreground text-xs font-semibold">
                  Person / Passport Profile
                </Label>
                <select
                  id="personSelect"
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-xl border px-3 py-2 text-xs focus-visible:ring-1 focus-visible:outline-none"
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.relation ? `(${p.relation})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="garmentSelect" className="text-foreground text-xs font-semibold">
                  Garment Type
                </Label>
                <select
                  id="garmentSelect"
                  value={activeGarment}
                  onChange={(e) => setGarmentType(e.target.value as GarmentType)}
                  className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-xl border px-3 py-2 text-xs capitalize focus-visible:ring-1 focus-visible:outline-none"
                >
                  {availableGarments.map((g) => (
                    <option key={g} value={g}>
                      {ALL_GARMENTS[g]?.label} ({ALL_GARMENTS[g]?.urduName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fit Preference Chips */}
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-semibold">Fit Preference</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "slim", label: "Slim Fit", desc: "Tapered & tailored" },
                  { id: "regular", label: "Regular Fit", desc: "Standard comfort" },
                  { id: "loose", label: "Loose / Traditional", desc: "Classic breezy cut" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFitPreference(item.id as FitPreference)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      fitPreference === item.id
                        ? "border-primary bg-primary/10 text-primary ring-primary ring-1"
                        : "border-border/80 bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="font-serif text-xs font-bold">{item.label}</div>
                    <div className="text-muted-foreground mt-0.5 text-[10px]">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Measurement Inputs */}
            <div className="space-y-4 pt-2">
              <div className="border-border/60 flex items-center justify-between border-b pb-2">
                <h3 className="text-foreground font-serif text-base font-medium">
                  Measurement Specifications ({unit === "in" ? 'Inches "' : "cm"})
                </h3>
                <span className="text-muted-foreground text-[11px]">
                  Supports decimals (e.g. 40.5) & fractions (e.g. 40 1/2)
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                  const minBound = unit === "cm" ? inchesToCm(field.minInches) : field.minInches;
                  const maxBound = unit === "cm" ? inchesToCm(field.maxInches) : field.maxInches;
                  const isTipActive = activeTipField === field.key;

                  return (
                    <div
                      key={field.key}
                      className="border-border/70 bg-background/50 space-y-2 rounded-xl border p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`field_${field.key}`}
                          className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <span>{field.label}</span>
                          <span className="text-accent font-sans text-[11px] font-normal">
                            {field.localTerm}
                          </span>
                        </Label>

                        <button
                          type="button"
                          onClick={() => setActiveTipField(isTipActive ? null : field.key)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          aria-label={`Measurement guide for ${field.label}`}
                        >
                          <HelpCircle className="size-3.5" />
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          id={`field_${field.key}`}
                          name={`val_${field.key}`}
                          required
                          inputMode="decimal"
                          placeholder={`e.g. ${unit === "cm" ? "102" : "40 1/2"}`}
                          className="bg-background pr-10 font-mono text-sm"
                        />
                        <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs">
                          {unit}
                        </span>
                      </div>

                      <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                        <span>
                          Typical range: {minBound}–{maxBound} {unit}
                        </span>
                      </div>

                      {/* Expandable Tip */}
                      {isTipActive && (
                        <div className="bg-primary/5 border-primary/20 text-muted-foreground flex items-start gap-1.5 rounded-lg border p-2 text-[11px] leading-snug">
                          <Info className="text-primary mt-0.5 size-3.5 shrink-0" />
                          <span>{field.tip}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fitting Notes & Date */}
            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes" className="text-foreground text-xs font-semibold">
                  Fitting Notes (Optional)
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  maxLength={500}
                  rows={2}
                  placeholder="e.g. Sherwani collar band, high side slits, extra loose shalwar for Eid..."
                  className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-xl border p-2.5 text-xs focus-visible:ring-1 focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="takenOn"
                  className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Calendar className="size-3.5" />
                  <span>Date Measured</span>
                </Label>
                <Input
                  id="takenOn"
                  name="takenOn"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="bg-background text-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-border/60 flex justify-end border-t pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground gap-2 px-6 font-medium"
              >
                <Save className="size-4" />
                <span>{isPending ? "Saving to Passport..." : "Save Measurement Set"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
