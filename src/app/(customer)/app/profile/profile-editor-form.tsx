"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { updateProfileAction } from "@/lib/auth/actions";

interface ProfileEditorFormProps {
  initialFullName: string;
  initialPhone: string;
  initialCity: string;
}

export function ProfileEditorForm({
  initialFullName,
  initialPhone,
  initialCity,
}: ProfileEditorFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.message || "Profile updated!");
      }
    });
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-primary font-serif text-xl">Edit Information</CardTitle>
        <CardDescription className="font-sans text-xs">
          Update your displayed name, contact number, and primary city.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-xl border p-3 font-sans text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
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
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 font-medium sm:w-auto"
          >
            <Save className="size-4" />
            <span>{isPending ? "Saving..." : "Save Changes"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
