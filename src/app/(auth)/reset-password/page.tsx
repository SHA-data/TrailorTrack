"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { resetPasswordAction } from "@/lib/auth/actions";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <Card className="border-border bg-card shadow-xl">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-primary font-serif text-3xl font-bold">
          Create New Password
        </CardTitle>
        <CardDescription className="text-muted-foreground font-sans text-sm">
          Enter a secure new password for your TailorTrack account.
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
            <Label htmlFor="password" className="text-foreground text-xs font-semibold">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 8 characters"
                className="bg-background border-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-foreground text-xs font-semibold">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Re-enter password"
              className="bg-background border-input"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 w-full font-medium"
          >
            {isPending ? "Updating Password..." : "Update Password"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="border-border/40 flex justify-center border-t pt-4">
        <Link href="/login" className="text-primary font-sans text-xs font-medium hover:underline">
          Return to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
