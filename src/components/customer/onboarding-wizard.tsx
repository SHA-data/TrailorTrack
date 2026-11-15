"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Ruler, Compass } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboardingAction } from "@/lib/measurements/actions";
import type { FitCategory, PreferredUnit } from "@/types/database";

interface OnboardingWizardProps {
  initialFullName: string;
  initialCity?: string | null;
  initialPhone?: string | null;
}

export function OnboardingWizard({
  initialFullName,
  initialCity = "",
  initialPhone = "",
}: OnboardingWizardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  const [fitCategory, setFitCategory] = useState<FitCategory>("men");
  const [preferredUnit, setPreferredUnit] = useState<PreferredUnit>("in");
  const [city, setCity] = useState(initialCity || "");
  const [phone, setPhone] = useState(initialPhone || "");

  const handleComplete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("fitCategory", fitCategory);
      formData.set("preferredUnit", preferredUnit);
      if (city) formData.set("city", city);
      if (phone) formData.set("phone", phone);

      const result = await completeOnboardingAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Welcome to your TailorTrack Passport!");
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleAddMeasurementsNow = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("fitCategory", fitCategory);
      formData.set("preferredUnit", preferredUnit);
      if (city) formData.set("city", city);
      if (phone) formData.set("phone", phone);

      const result = await completeOnboardingAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setIsOpen(false);
        router.push("/app/measurements/new?garment=kameez");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="border-border bg-card max-w-md p-6 sm:p-8">
        <DialogHeader className="space-y-2 text-center">
          <div className="bg-primary/10 border-accent/40 text-primary mx-auto flex size-12 items-center justify-center rounded-2xl border">
            <Sparkles className="text-accent size-6" />
          </div>
          <DialogTitle className="text-primary font-serif text-2xl font-bold">
            Welcome to TailorTrack
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-sans text-xs">
            Assalam-o-Alaikum, {initialFullName.split(" ")[0]}. Let&apos;s personalize your
            tailoring passport.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 1 ? "bg-primary w-8" : "bg-muted w-2"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 2 ? "bg-primary w-8" : "bg-muted w-2"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 3 ? "bg-primary w-8" : "bg-muted w-2"
            }`}
          />
        </div>

        {/* STEP 1: Fit Category & Preferred Unit */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-semibold">Primary Fit Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "men", label: "Men", desc: "Kurta, Shalwar, Sherwani" },
                  { id: "women", label: "Women", desc: "Kameez, Trouser, Daman" },
                  { id: "boys", label: "Boys", desc: "Kurta, Shalwar, Waistcoat" },
                  { id: "girls", label: "Girls", desc: "Kameez & Trouser" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFitCategory(item.id as FitCategory)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      fitCategory === item.id
                        ? "border-primary bg-primary/10 text-primary ring-primary ring-1"
                        : "border-border/80 bg-background hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div className="font-serif text-sm font-bold">{item.label}</div>
                    <div className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-foreground text-xs font-semibold">
                Preferred Measurement Unit
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredUnit("in")}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    preferredUnit === "in"
                      ? "border-primary bg-primary/10 text-primary ring-primary ring-1"
                      : "border-border/80 bg-background hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="font-sans text-sm font-bold">Inches (in)</div>
                  <div className="text-muted-foreground text-[10px]">
                    Standard in Pakistani shops (e.g. 40 1/2&quot;)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredUnit("cm")}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    preferredUnit === "cm"
                      ? "border-primary bg-primary/10 text-primary ring-primary ring-1"
                      : "border-border/80 bg-background hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="font-sans text-sm font-bold">Centimeters (cm)</div>
                  <div className="text-muted-foreground text-[10px]">
                    Metric system (e.g. 102.5 cm)
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} className="gap-2">
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: City & Phone Number */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-foreground text-xs font-semibold">
                City / Region
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lahore, Karachi, Rawalpindi"
                className="bg-background"
              />
              <p className="text-muted-foreground text-[11px]">
                Helps match local master tailors in your market.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-foreground text-xs font-semibold">
                WhatsApp / Phone Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
                className="bg-background"
              />
              <p className="text-muted-foreground text-[11px]">
                Used to share order updates and trial fitting alerts.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5 text-xs">
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Next <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: First Measurement Prompt */}
        {step === 3 && (
          <div className="space-y-4 py-2 text-center">
            <div className="border-primary/20 bg-primary/5 space-y-2 rounded-2xl border p-4 text-left">
              <div className="text-primary flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Passport Profile Configured</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Fit Category: <strong className="text-foreground capitalize">{fitCategory}</strong>{" "}
                • Unit: <strong className="text-foreground uppercase">{preferredUnit}</strong>
                {city ? ` • ${city}` : ""}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                onClick={handleAddMeasurementsNow}
                disabled={isPending}
                className="bg-primary text-primary-foreground w-full gap-2 py-2.5 font-medium"
              >
                <Ruler className="text-accent size-4" />
                <span>Add First Kameez Measurements Now</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleComplete}
                disabled={isPending}
                className="w-full gap-2 text-xs"
              >
                <Compass className="size-4" />
                <span>Explore Dashboard First</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
