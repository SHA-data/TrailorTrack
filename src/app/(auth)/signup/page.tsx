"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, User, Scissors, Sparkles, AlertCircle } from "lucide-react";
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
import { signUpAction } from "@/lib/auth/actions";

export default function SignUpPage() {
  const [role, setRole] = useState<"customer" | "tailor">("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Password strength calculations
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strengthScore = [hasMinLength, hasUppercase, hasNumber].filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      } else if (result?.success) {
        setInfoMessage(result.message || "Account created successfully!");
        toast.success("Account created!");
      }
    });
  };

  return (
    <Card className="border-border bg-card shadow-xl">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-primary font-serif text-3xl font-bold">
          Create Your Passport
        </CardTitle>
        <CardDescription className="text-muted-foreground font-sans text-sm">
          Join TailorTrack to secure your fit across Pakistan.
        </CardDescription>

        {/* Role Toggle Selector */}
        <div className="pt-2">
          <div className="bg-muted/80 border-border/80 grid grid-cols-2 rounded-xl border p-1">
            <button
              type="button"
              onClick={() => {
                setRole("customer");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
                role === "customer"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="size-4" />
              <span>I&apos;m a Customer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("tailor");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
                role === "tailor"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scissors className="size-4" />
              <span>I&apos;m a Tailor</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {infoMessage ? (
          <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-900">
            <Sparkles className="mx-auto size-8 text-emerald-600" />
            <h3 className="font-serif text-lg font-bold">Check Your Email</h3>
            <p className="font-sans text-xs leading-relaxed text-emerald-800 sm:text-sm">
              {infoMessage}
            </p>
            <Link href="/login" className="inline-block pt-2">
              <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-800">
                Proceed to Log In
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

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-foreground text-xs font-semibold">
                {role === "tailor" ? "Master Tailor / Owner Name" : "Full Name"}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder={role === "tailor" ? "e.g. Master Aslam" : "e.g. Tariq Mahmood"}
                className="bg-background border-input"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-xs font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="bg-background border-input"
              />
            </div>

            {/* Tailor Specific: Shop Name & City */}
            {role === "tailor" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="shopName" className="text-foreground text-xs font-semibold">
                    Shop / Boutique Name
                  </Label>
                  <Input
                    id="shopName"
                    name="shopName"
                    required
                    placeholder="e.g. Royal Bespoke Tailors"
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
                    required
                    placeholder="e.g. Lahore, Karachi, Rawalpindi"
                    className="bg-background border-input"
                  />
                </div>
              </>
            )}

            {/* Customer Specific: City (Optional) */}
            {role === "customer" && (
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-foreground text-xs font-semibold">
                  City (Optional)
                </Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  className="bg-background border-input"
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-xs font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {/* Password strength indicators */}
              {password.length > 0 && (
                <div className="space-y-1.5 pt-1.5">
                  <div className="grid grid-cols-3 gap-1">
                    <div
                      className={`h-1 rounded-full ${
                        strengthScore >= 1 ? "bg-amber-500" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full ${
                        strengthScore >= 2 ? "bg-amber-500" : "bg-muted"
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full ${
                        strengthScore === 3 ? "bg-emerald-500" : "bg-muted"
                      }`}
                    />
                  </div>
                  <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 font-sans text-[11px]">
                    <span className={hasMinLength ? "font-medium text-emerald-700" : ""}>
                      {hasMinLength ? "✓" : "○"} 8+ chars
                    </span>
                    <span className={hasUppercase ? "font-medium text-emerald-700" : ""}>
                      {hasUppercase ? "✓" : "○"} Uppercase
                    </span>
                    <span className={hasNumber ? "font-medium text-emerald-700" : ""}>
                      {hasNumber ? "✓" : "○"} Number
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 w-full font-medium"
            >
              {isPending
                ? "Creating Account..."
                : role === "tailor"
                  ? "Register Tailor Shop"
                  : "Create Customer Passport"}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="border-border/40 flex justify-center border-t pt-4">
        <div className="text-muted-foreground font-sans text-xs">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Log in instead
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
