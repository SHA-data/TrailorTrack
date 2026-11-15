import React from "react";
import Link from "next/link";
import { QrCode, Ruler, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: customer } = await supabase
    .from("customers")
    .select("city, qr_token")
    .eq("user_id", user!.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] || "Customer";

  return (
    <div className="space-y-8">
      {/* Welcome Greeting */}
      <div className="space-y-2">
        <div className="border-accent/40 bg-card text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold">
          <Sparkles className="size-3.5" />
          <span>Customer Passport Dashboard</span>
        </div>
        <h1 className="text-primary font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Khush Amdeed, {firstName}
        </h1>
        <p className="text-muted-foreground font-sans text-sm">
          Your digital tailoring passport is active and secured.
        </p>
      </div>

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
            </div>
            <h2 className="text-foreground font-serif text-2xl font-bold sm:text-3xl">
              {profile?.full_name}
            </h2>
            <p className="text-muted-foreground max-w-md font-sans text-xs sm:text-sm">
              Present your QR code at participating tailor shops in Lahore, Karachi, or Islamabad to
              grant temporary read-only measurement access.
            </p>
            <div className="text-muted-foreground flex items-center justify-center gap-2 pt-2 font-sans text-xs sm:justify-start">
              <ShieldCheck className="text-accent size-4" />
              <span>Consent-controlled • Zero permanent shop storage</span>
            </div>
          </div>

          {/* QR Code Teaser Box */}
          <div className="bg-primary border-accent/30 w-44 shrink-0 space-y-2 rounded-2xl border p-4 text-center text-[#f7f1e3] shadow-md">
            <div className="bg-card/90 text-primary mx-auto flex size-24 items-center justify-center rounded-xl p-2">
              <QrCode className="text-primary size-16" />
            </div>
            <div className="text-accent font-mono text-[10px] font-semibold tracking-widest uppercase">
              Ready to Scan
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Access Overview Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="space-y-2">
            <div className="bg-primary/10 border-accent/30 text-primary flex size-10 items-center justify-center rounded-xl border">
              <Ruler className="text-accent size-5" />
            </div>
            <CardTitle className="text-primary font-serif text-lg">Body Measurements</CardTitle>
            <CardDescription className="font-sans text-xs">
              Store Kameez length, chest, waist, and collar cuts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/app/measurements">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <span>View Measurements</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="space-y-2">
            <div className="bg-primary/10 border-accent/30 text-primary flex size-10 items-center justify-center rounded-xl border">
              <ShoppingBag className="text-accent size-5" />
            </div>
            <CardTitle className="text-primary font-serif text-lg">Stitching Orders</CardTitle>
            <CardDescription className="font-sans text-xs">
              Track live status from cutting to trial ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/app/orders">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <span>Track Orders</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs sm:col-span-2 lg:col-span-1">
          <CardHeader className="space-y-2">
            <div className="bg-primary/10 border-accent/30 text-primary flex size-10 items-center justify-center rounded-xl border">
              <ShieldCheck className="text-accent size-5" />
            </div>
            <CardTitle className="text-primary font-serif text-lg">Profile & Security</CardTitle>
            <CardDescription className="font-sans text-xs">
              Manage personal details, phone number, and account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/app/profile">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <span>Manage Profile</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
