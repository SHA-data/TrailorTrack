"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { updateShopAction } from "@/lib/auth/actions";

interface ShopEditorFormProps {
  initialShopName: string;
  initialCity: string;
  initialAddress: string;
  initialPhone: string;
}

export function ShopEditorForm({
  initialShopName,
  initialCity,
  initialAddress,
  initialPhone,
}: ShopEditorFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateShopAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.message || "Shop details saved!");
      }
    });
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-primary font-serif text-xl">Shop Details</CardTitle>
        <CardDescription className="font-sans text-xs">
          This information is displayed to customers when they grant tailoring consent.
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
            <Label htmlFor="shopName" className="text-foreground text-xs font-semibold">
              Shop Name
            </Label>
            <Input
              id="shopName"
              name="shopName"
              defaultValue={initialShopName}
              required
              placeholder="e.g. Royal Master Tailors"
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
              placeholder="e.g. Lahore, Karachi, Rawalpindi"
              className="bg-background border-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-foreground text-xs font-semibold">
              Shop Address / Market Location
            </Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialAddress}
              placeholder="e.g. Shop 14, Anarkali Bazaar, Mall Road"
              className="bg-background border-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-foreground text-xs font-semibold">
              Business Contact Number
            </Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initialPhone}
              placeholder="e.g. +92 321 9876543"
              className="bg-background border-input"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 font-medium sm:w-auto"
          >
            <Save className="size-4" />
            <span>{isPending ? "Saving..." : "Save Shop Details"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
