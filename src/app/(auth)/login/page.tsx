"use client";

import React, { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { signInAction } from "@/lib/auth/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const authError = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo");

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    authError === "auth_failed" ? "Authentication session could not be established" : null
  );
  const [isPending, startTransition] = useTransition();

  const handleFormAction = (formData: FormData) => {
    setErrorMessage(null);

    if (redirectTo) {
      formData.set("redirectTo", redirectTo);
    }

    startTransition(async () => {
      try {
        const result = await signInAction(formData);
        if (result?.error) {
          setErrorMessage(result.error);
          toast.error(result.error);
        } else if (result?.redirectUrl) {
          toast.success("Signed in successfully");
          window.location.href = result.redirectUrl;
        }
      } catch (err) {
        console.error("Sign-in submission error:", err);
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-primary font-serif text-2xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription className="font-sans text-xs">
          Access your digital measurements passport and active tailoring orders.
        </CardDescription>
      </CardHeader>

      <form
        action={handleFormAction}
        onSubmit={(e) => {
          e.preventDefault();
          handleFormAction(new FormData(e.currentTarget));
        }}
      >
        <CardContent className="space-y-4">
          {resetSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>Password successfully updated. Please sign in with your new password.</span>
            </div>
          )}

          {errorMessage && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-foreground text-xs font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={searchParams.get("email") || ""}
              required
              placeholder="you@domain.pk"
              className="bg-background border-input"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground text-xs font-semibold">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-primary text-xs font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="bg-background border-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl py-2 font-medium shadow-xs"
          >
            {isPending ? "Signing in..." : "Sign in to TailorTrack"}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Don&apos;t have a tailoring passport yet?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium transition-colors hover:underline"
            >
              Create passport
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border bg-card text-muted-foreground p-8 text-center text-xs shadow-sm">
          Loading sign in...
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
