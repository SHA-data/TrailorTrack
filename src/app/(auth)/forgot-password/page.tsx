"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { forgotPasswordAction } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        setInfoMessage(result.message || "Reset link dispatched.");
        toast.success("Instructions sent");
      }
    });
  };

  return (
    <Card className="border-border bg-card shadow-xl">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-primary font-serif text-3xl font-bold">Reset Password</CardTitle>
        <CardDescription className="text-muted-foreground font-sans text-sm">
          Enter your registered email address to receive recovery instructions.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {infoMessage ? (
          <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-900">
            <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
            <h3 className="font-serif text-lg font-bold">Check Your Email</h3>
            <p className="font-sans text-xs leading-relaxed text-emerald-800 sm:text-sm">
              {infoMessage}
            </p>
            <Link href="/login" className="inline-block pt-2">
              <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-800">
                Return to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form method="POST" onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-xl border p-3 font-sans text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="bg-background border-input pl-10"
                />
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 w-full font-medium"
            >
              {isPending ? "Sending link..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="border-border/40 flex justify-center border-t pt-4">
        <Link
          href="/login"
          className="text-primary inline-flex items-center gap-1.5 font-sans text-xs font-medium hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Login</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
