"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Share2,
  Copy,
  Trash2,
  Calendar,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  AlertTriangle,
  Edit3,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ALL_GARMENTS, getMeasurementTemplate } from "@/lib/measurements/templates";
import { formatMeasurement, formatDelta } from "@/lib/measurements/units";
import {
  updateMeasurementSetNotesAction,
  deleteMeasurementSetAction,
} from "@/lib/measurements/actions";
import { copyToClipboard } from "@/lib/utils";
import type { FitCategory, GarmentType, PreferredUnit } from "@/types/database";

export interface MeasurementSetDetail {
  id: string;
  garment_type: GarmentType;
  fit_preference: string | null;
  values: Record<string, number>;
  notes: string | null;
  source: string;
  taken_on: string;
  created_at: string;
}

export interface HistorySetItem {
  id: string;
  taken_on: string;
  created_at: string;
  fit_preference: string | null;
  values: Record<string, number>;
  notes: string | null;
}

interface DetailClientProps {
  currentSet: MeasurementSetDetail;
  historySets: HistorySetItem[];
  personName: string;
  fitCategory: FitCategory;
  preferredUnit: PreferredUnit;
}

export function DetailClient({
  currentSet,
  historySets,
  personName,
  fitCategory,
  preferredUnit,
}: DetailClientProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(currentSet.notes || "");
  const [copiedText, setCopiedText] = useState(false);
  const [isPending, startTransition] = useTransition();

  const garmentMeta = ALL_GARMENTS[currentSet.garment_type];
  const templateFields = getMeasurementTemplate(fitCategory, currentSet.garment_type);

  // Find previous set in history to compute deltas
  const currentIndex = historySets.findIndex((s) => s.id === currentSet.id);
  const previousSet =
    currentIndex >= 0 && currentIndex < historySets.length - 1
      ? historySets[currentIndex + 1]
      : null;

  // Selected field for inline SVG sparkline
  const primaryField = templateFields[0]?.key || "length";
  const [sparklineField, setSparklineField] = useState(primaryField);

  // Generate plain text summary for WhatsApp and Clipboard
  const generateTextSummary = () => {
    let summary = `*TailorTrack Digital Passport*\n`;
    summary += `👤 Person: ${personName}\n`;
    summary += `✂️ Garment: ${garmentMeta?.label || currentSet.garment_type} (${garmentMeta?.urduName})\n`;
    summary += `📅 Date: ${currentSet.taken_on}\n`;
    if (currentSet.fit_preference) {
      summary += `👔 Fit: ${currentSet.fit_preference.toUpperCase()}\n`;
    }
    summary += `\n*Measurements:*\n`;

    templateFields.forEach((f) => {
      const val = currentSet.values[f.key];
      if (val !== undefined) {
        summary += `• ${f.label} ${f.localTerm}: ${formatMeasurement(val, preferredUnit)}\n`;
      }
    });

    if (currentSet.notes) {
      summary += `\n📝 Notes: ${currentSet.notes}\n`;
    }
    return summary;
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(generateTextSummary());
    if (success) {
      setCopiedText(true);
      toast.success("Measurement card copied to clipboard!");
      setTimeout(() => setCopiedText(false), 2500);
    } else {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateTextSummary());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleSaveNotes = () => {
    startTransition(async () => {
      const result = await updateMeasurementSetNotesAction(currentSet.id, notesVal);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Notes saved.");
        setIsEditingNotes(false);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMeasurementSetAction(currentSet.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Measurement set deleted.");
        router.push("/app/measurements");
      }
    });
  };

  // Build sparkline coordinates (if >= 2 history points)
  const sparklineData = [...historySets].reverse().map((s) => s.values[sparklineField] || 0);
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / Math.max(1, sparklineData.length - 1)) * 140 + 10;
      const y = 45 - ((val - minVal) / range) * 35;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/app/measurements"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Passport</span>
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            {copiedText ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copiedText ? "Copied" : "Copy as Text"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleWhatsAppShare}
            className="gap-1.5 bg-[#25D366] text-xs text-white shadow-xs hover:bg-[#20ba59]"
          >
            <Share2 className="size-3.5" />
            <span>Share on WhatsApp</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-1.5 text-xs"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Detail Header Card */}
      <Card className="border-border bg-card overflow-hidden shadow-xs">
        <CardHeader className="border-border/60 border-b pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-serif text-2xl font-bold">
                  {garmentMeta?.label || currentSet.garment_type}
                </span>
                <span className="text-accent font-sans text-sm font-medium">
                  {garmentMeta?.urduName}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 font-sans text-xs">
                Bespoke specifications for <strong className="text-foreground">{personName}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {currentSet.fit_preference || "Regular"} Fit
              </Badge>
              <div className="text-muted-foreground bg-muted/50 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs">
                <Calendar className="size-3.5" />
                <span>Measured {currentSet.taken_on}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Values Grid with Deltas */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-primary font-serif text-base font-bold">
                Recorded Specifications
              </h3>
              {previousSet && (
                <span className="text-muted-foreground text-[11px]">
                  Comparing with previous set ({previousSet.taken_on})
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templateFields.map((field) => {
                const currentVal = currentSet.values[field.key];
                const prevVal = previousSet ? previousSet.values[field.key] : undefined;
                const delta =
                  prevVal !== undefined && currentVal !== undefined ? currentVal - prevVal : 0;

                return (
                  <div
                    key={field.key}
                    className="border-border/80 bg-background/50 flex items-center justify-between rounded-xl border p-3.5"
                  >
                    <div>
                      <div className="text-foreground flex items-center gap-1 text-xs font-semibold">
                        <span>{field.label}</span>
                        <span className="text-accent text-[10px] font-normal">
                          {field.localTerm}
                        </span>
                      </div>
                      <div className="text-foreground mt-0.5 font-serif text-sm font-bold">
                        {currentVal !== undefined
                          ? formatMeasurement(currentVal, preferredUnit)
                          : "—"}
                      </div>
                    </div>

                    {/* Delta Indicator */}
                    {previousSet && (
                      <div
                        className={`flex items-center gap-0.5 rounded-md px-2 py-0.5 font-sans text-[11px] font-medium ${
                          Math.abs(delta) < 0.05
                            ? "bg-muted text-muted-foreground"
                            : delta > 0
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {Math.abs(delta) < 0.05 ? (
                          <Minus className="size-3" />
                        ) : delta > 0 ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <TrendingDown className="size-3" />
                        )}
                        <span>{formatDelta(delta, preferredUnit)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fitting Notes (Editable) */}
          <div className="border-border/80 bg-muted/30 space-y-2 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <MessageSquare className="text-primary size-3.5" />
                <span>Tailor & Fitting Notes</span>
              </div>
              {!isEditingNotes && (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-primary flex items-center gap-1 text-xs hover:underline"
                >
                  <Edit3 className="size-3" />
                  <span>Edit notes</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-xl border p-2.5 text-xs focus-visible:ring-1 focus-visible:outline-none"
                  placeholder="Fitting notes, collar preferences, stitch style..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNotes(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={handleSaveNotes}
                    className="h-7 text-xs"
                  >
                    {isPending ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs leading-relaxed italic">
                {currentSet.notes || "No specific fitting notes recorded for this set."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Version History & Timeline */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <History className="text-primary size-4" />
              <CardTitle className="text-foreground font-serif text-lg font-bold">
                Historical Versions ({historySets.length})
              </CardTitle>
            </div>

            {/* Sparkline Field Selector */}
            {historySets.length >= 2 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground text-[11px]">Trend:</span>
                <select
                  value={sparklineField}
                  onChange={(e) => setSparklineField(e.target.value)}
                  className="border-input bg-background text-foreground rounded-lg border px-2 py-1 text-xs"
                >
                  {templateFields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Dependency-Free SVG Sparkline */}
          {historySets.length >= 2 && (
            <div className="border-border/70 bg-background/50 flex flex-col items-center justify-between gap-4 rounded-xl border p-3 sm:flex-row">
              <div className="space-y-0.5 text-xs">
                <span className="text-foreground font-semibold">
                  {templateFields.find((f) => f.key === sparklineField)?.label} Progression
                </span>
                <p className="text-muted-foreground text-[10px]">
                  Ranging from {formatMeasurement(minVal, preferredUnit)} to{" "}
                  {formatMeasurement(maxVal, preferredUnit)}
                </p>
              </div>

              <div className="h-12 w-44">
                <svg viewBox="0 0 160 50" className="h-full w-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke="var(--color-primary, #1F4D3A)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                  {sparklineData.map((val, idx) => {
                    const x = (idx / Math.max(1, sparklineData.length - 1)) * 140 + 10;
                    const y = 45 - ((val - minVal) / range) * 35;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3.5"
                        className="fill-background stroke-primary stroke-2"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Timeline List */}
          <div className="space-y-3">
            {historySets.map((hist, idx) => {
              const isSelected = hist.id === currentSet.id;
              return (
                <div
                  key={hist.id}
                  className={`flex flex-col gap-3 rounded-xl border p-3.5 transition-all sm:flex-row sm:items-center sm:justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-primary/40 ring-1"
                      : "border-border/80 bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-serif text-xs font-bold">
                        Version {historySets.length - idx}
                      </span>
                      {isSelected && (
                        <Badge className="bg-primary text-primary-foreground px-1.5 py-0 text-[10px]">
                          Active View
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-[11px]">{hist.taken_on}</span>
                    </div>

                    <p className="text-muted-foreground line-clamp-1 text-[11px]">
                      {hist.notes ? `"${hist.notes}"` : "No notes"}
                    </p>
                  </div>

                  {!isSelected && (
                    <Button asChild variant="outline" size="sm" className="h-7 w-fit text-xs">
                      <Link href={`/app/measurements/${hist.id}`}>
                        <span>View Version</span>
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="border-destructive/20 bg-card max-w-md p-6">
          <DialogHeader className="space-y-2">
            <div className="bg-destructive/10 text-destructive mx-auto flex size-11 items-center justify-center rounded-2xl">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-foreground text-center font-serif text-xl font-bold">
              Delete Measurement Set?
            </DialogTitle>
            <DialogDescription className="text-center font-sans text-xs">
              Are you sure you want to delete this {garmentMeta?.label} set from{" "}
              {currentSet.taken_on}? This historical entry cannot be recovered.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 pt-3 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting..." : "Delete Set"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
