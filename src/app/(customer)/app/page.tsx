import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  QrCode,
  Ruler,
  Users,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingWizard } from "@/components/customer/onboarding-wizard";

export const instant = false;

export default async function CustomerDashboardPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, city, qr_token, fit_category, preferred_unit")
    .eq("user_id", user.id)
    .single();

  // Fetch real counts
  const { count: measurementCount } = await supabase
    .from("measurement_sets")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer?.id || "");

  const { count: familyCount } = await supabase
    .from("family_members")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer?.id || "");

  const { count: activeOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["received", "cutting", "stitching", "ready"]);

  const totalMeasurements = measurementCount || 0;
  const totalFamily = familyCount || 0;
  const totalActiveOrders = activeOrdersCount || 0;

  // Calculate profile completion percentage
  let completionPoints = 0;
  if (profile?.full_name) completionPoints += 20;
  if (customer?.city) completionPoints += 20;
  if (profile?.phone) completionPoints += 20;
  if (customer?.fit_category) completionPoints += 20;
  if (totalMeasurements > 0) completionPoints += 20;

  const firstName = profile?.full_name?.split(" ")[0] || "Customer";
  const showOnboarding = customer && !customer.fit_category;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Onboarding Dialog if profile incomplete */}
      {showOnboarding && (
        <OnboardingWizard
          initialFullName={profile?.full_name || ""}
          initialCity={customer.city}
          initialPhone={profile?.phone}
        />
      )}

      {/* Welcome Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="border-accent/40 bg-card text-accent mb-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>Digital Tailoring Passport</span>
          </div>
          <h1 className="text-primary font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Khush Amdeed, {firstName}
          </h1>
          <p className="text-muted-foreground font-sans text-sm">
            Your personal measurements and family tailoring profiles are protected and ready.
          </p>
        </div>

        <Button asChild size="sm" className="w-fit gap-1.5 shadow-sm">
          <Link href="/app/measurements/new?garment=kameez">
            <Plus className="size-4" />
            <span>Add Measurements</span>
          </Link>
        </Button>
      </div>

      {/* Profile Completion Bar */}
      <Card className="border-border/80 bg-card/60 p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-foreground text-xs font-semibold">Passport Completion</span>
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                {completionPoints}% Ready
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {completionPoints === 100
                ? "Your digital passport is complete and ready for any participating tailor."
                : totalMeasurements === 0
                  ? "Next step: Add your first Kameez or Shalwar measurement set."
                  : "Add family member profiles to manage household tailoring together."}
            </p>
          </div>

          <div className="bg-muted h-2 w-full overflow-hidden rounded-full sm:w-48">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPoints}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Main Digital Passport Card */}
      <Card className="border-border/80 from-card via-card to-cream-50/70 relative overflow-hidden bg-gradient-to-br shadow-sm">
        <div className="flex flex-col items-center justify-between gap-6 p-6 sm:flex-row sm:p-8">
          <div className="space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge className="bg-primary text-primary-foreground">Active Passport</Badge>
              {customer?.city && (
                <Badge variant="outline" className="border-accent text-accent">
                  {customer.city}
                </Badge>
              )}
              {customer?.preferred_unit && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Unit: {customer.preferred_unit}
                </Badge>
              )}
            </div>
            <h2 className="text-foreground font-serif text-2xl font-bold sm:text-3xl">
              {profile?.full_name}
            </h2>
            <p className="text-muted-foreground max-w-md font-sans text-xs sm:text-sm">
              Present your QR passport at participating tailor shops in Lahore, Karachi, or
              Islamabad to grant secure, instant measurement access.
            </p>
            <div className="text-muted-foreground flex items-center justify-center gap-2 pt-2 font-sans text-xs sm:justify-start">
              <ShieldCheck className="text-accent size-4" />
              <span>Consent-controlled • You can revoke access anytime</span>
            </div>
          </div>

          {/* QR Code Box */}
          <Link
            href="/app/passport"
            className="group bg-primary border-accent/30 hover:border-accent w-44 shrink-0 space-y-2 rounded-2xl border p-4 text-center text-[#f7f1e3] shadow-md transition-all hover:shadow-lg"
          >
            <div className="bg-card/90 text-primary mx-auto flex size-24 items-center justify-center rounded-xl p-2 transition-transform group-hover:scale-105">
              <QrCode className="text-primary size-16" />
            </div>
            <div className="text-accent font-mono text-[10px] font-semibold tracking-widest uppercase group-hover:underline">
              Open Passport QR &rarr;
            </div>
          </Link>
        </div>
      </Card>

      {/* Real Counts & Feature Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Orders Card */}
        <Card className="border-border bg-card flex flex-col justify-between shadow-xs">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between">
              <div className="bg-primary/10 border-accent/30 text-primary flex size-10 items-center justify-center rounded-xl border">
                <ShoppingBag className="text-accent size-5" />
              </div>
              <span className="text-foreground font-serif text-2xl font-bold">
                {totalActiveOrders}
              </span>
            </div>
            <CardTitle className="text-primary font-serif text-lg">Active Orders</CardTitle>
            <CardDescription className="font-sans text-xs">
              {totalActiveOrders === 0
                ? "No suits currently in stitching."
                : `${totalActiveOrders} active ${totalActiveOrders === 1 ? "suit" : "suits"} in progress.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Link href="/app/orders">
                <span>View Orders</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Measurements Card */}
        <Card className="border-border bg-card flex flex-col justify-between shadow-xs">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between">
              <div className="bg-primary/10 border-accent/30 text-primary flex size-10 items-center justify-center rounded-xl border">
                <Ruler className="text-accent size-5" />
              </div>
              <span className="text-foreground font-serif text-2xl font-bold">
                {totalMeasurements}
              </span>
            </div>
            <CardTitle className="text-primary font-serif text-lg">Measurements</CardTitle>
            <CardDescription className="font-sans text-xs">
              {totalMeasurements === 0
                ? "No saved garments yet. Add your first fit."
                : `${totalMeasurements} saved garment ${totalMeasurements === 1 ? "set" : "sets"} in history.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Link href="/app/measurements">
                <span>View Passport</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Family Profiles Card */}
        <Card className="border-border bg-card flex flex-col justify-between shadow-xs">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between">
              <div className="bg-primary/10 border-accent/30 text-primary flex size-10 items-center justify-center rounded-xl border">
                <Users className="text-accent size-5" />
              </div>
              <span className="text-foreground font-serif text-2xl font-bold">{totalFamily}</span>
            </div>
            <CardTitle className="text-primary font-serif text-lg">Family Profiles</CardTitle>
            <CardDescription className="font-sans text-xs">
              {totalFamily === 0
                ? "Manage measurements for parents, spouse, or kids."
                : `${totalFamily} household ${totalFamily === 1 ? "member" : "members"} registered.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Link href="/app/family">
                <span>Manage Family</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Profile & Preferences Card */}
        <Card className="border-border bg-card flex flex-col justify-between shadow-xs">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between">
              <div className="bg-primary/10 border-accent/30 text-primary flex size-10 items-center justify-center rounded-xl border">
                <CheckCircle2 className="text-accent size-5" />
              </div>
              <Badge variant="outline" className="text-xs uppercase">
                {customer?.preferred_unit || "in"}
              </Badge>
            </div>
            <CardTitle className="text-primary font-serif text-lg">Preferences</CardTitle>
            <CardDescription className="font-sans text-xs">
              Fit: <strong className="capitalize">{customer?.fit_category || "Not set"}</strong> •
              Unit: <strong className="uppercase">{customer?.preferred_unit || "in"}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Link href="/app/profile">
                <span>Edit Preferences</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
