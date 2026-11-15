"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle, Save, Sparkles, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { updateProfileAction } from "@/lib/auth/actions";
import { updateCustomerPreferencesAction } from "@/lib/measurements/actions";

interface ProfileEditorFormProps {
  initialFullName: string;
  initialPhone: string;
  initialCity: string;
  initialFitCategory?: string;
  initialPreferredUnit?: string;
}

export function ProfileEditorForm({
  initialFullName,
  initialPhone,
  initialCity,
  initialFitCategory = "men",
  initialPreferredUnit = "in",
}: ProfileEditorFormProps) {
  const [isPendingProfile, startProfileTransition] = useTransition();
  const [isPendingPrefs, startPrefsTransition] = useTransition();

  const [profileError, setProfileError] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);

    const formData = new FormData(e.currentTarget);
    startProfileTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        setProfileError(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.message || "Profile updated!");
      }
    });
  };

  const handlePrefsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPrefsError(null);

    const formData = new FormData(e.currentTarget);
    startPrefsTransition(async () => {
      const result = await updateCustomerPreferencesAction(formData);
      if (result?.error) {
        setPrefsError(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.message || "Preferences saved!");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Personal Info Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-primary font-serif text-xl">Personal Information</CardTitle>
          <CardDescription className="font-sans text-xs">
            Update your displayed name, contact number, and primary city.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-xl border p-3 font-sans text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-foreground text-xs font-semibold">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={initialFullName}
                required
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-foreground text-xs font-semibold">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialPhone}
                placeholder="e.g. +92 300 1234567"
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-foreground text-xs font-semibold">
                City
              </Label>
              <Input
                id="city"
                name="city"
                defaultValue={initialCity}
                placeholder="e.g. Lahore, Karachi, Islamabad"
                className="bg-background border-input"
              />
            </div>

            <Button
              type="submit"
              disabled={isPendingProfile}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 font-medium sm:w-auto"
            >
              <Save className="size-4" />
              <span>{isPendingProfile ? "Saving..." : "Save Profile"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tailoring & Passport Preferences Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="text-accent size-5" />
            <CardTitle className="text-primary font-serif text-xl">Passport Preferences</CardTitle>
          </div>
          <CardDescription className="font-sans text-xs">
            Configure your default fit category and measurement units.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePrefsSubmit} className="space-y-4">
            {prefsError && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-xl border p-3 font-sans text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>{prefsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fitCategory" className="text-foreground text-xs font-semibold">
                  Default Fit Category
                </Label>
                <select
                  id="fitCategory"
                  name="fitCategory"
                  defaultValue={initialFitCategory}
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="men">Men (Gents / مردانہ)</option>
                  <option value="women">Women (Ladies / زنانہ)</option>
                  <option value="boys">Boys (بچے)</option>
                  <option value="girls">Girls (بچیاں)</option>
                </select>
                <p className="text-muted-foreground text-[11px]">
                  Controls which garment templates are displayed by default for you.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredUnit" className="text-foreground text-xs font-semibold">
                  Measurement Unit
                </Label>
                <select
                  id="preferredUnit"
                  name="preferredUnit"
                  defaultValue={initialPreferredUnit}
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="in">Inches (in) — Pakistani Tailoring Standard</option>
                  <option value="cm">Centimeters (cm)</option>
                </select>
                <p className="text-muted-foreground text-[11px]">
                  Measurements are canonically stored in inches and converted seamlessly.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPendingPrefs}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/5 w-full gap-2 font-medium sm:w-auto"
            >
              <Sparkles className="size-4" />
              <span>{isPendingPrefs ? "Saving..." : "Save Preferences"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
