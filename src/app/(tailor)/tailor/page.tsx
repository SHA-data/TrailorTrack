import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CircleDashed,
  Store,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const instant = false;

export default async function TailorDashboardPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: shop } = await supabase
    .from("tailor_shops")
    .select("id, shop_name, city, address, phone")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Fetch real counts via RPC
  let activeClientsCount = 0;
  let pendingRequestsCount = 0;

  if (shop?.id) {
    const { data: clientsRaw } = await supabase.rpc("list_my_consented_customers");
    activeClientsCount = (clientsRaw || []).length;

    const { count } = await supabase
      .from("consents")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id)
      .eq("status", "pending");
    pendingRequestsCount = count || 0;
  }

  const shopDisplayName = shop?.shop_name || "Your Tailor Shop";
  const tailorName = profile?.full_name || "Master Tailor";
  const isProfileComplete = Boolean(shop?.shop_name && shop?.city && shop?.address && shop?.phone);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-accent text-xs font-semibold tracking-wider uppercase">
            Master Tailor Workspace
          </span>
          <h1 className="text-foreground mt-1 font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Assalam-o-Alaikum, {tailorName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {shopDisplayName} {shop?.city ? `• ${shop.city}` : ""}
          </p>
        </div>

        <Button asChild size="lg" className="gap-2 shadow-md">
          <Link href="/tailor/scan">
            <QrCode className="h-4 w-4" />
            Scan Customer QR
          </Link>
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Active Clients</span>
            <Badge variant="outline" className="text-xs">
              Passport
            </Badge>
          </div>
          <p className="text-foreground mt-2 font-serif text-3xl font-bold">{activeClientsCount}</p>
          <Button asChild variant="link" size="sm" className="text-primary mt-1 h-auto p-0 text-xs">
            <Link href="/tailor/customers">View active clients &rarr;</Link>
          </Button>
        </Card>

        <Card className="border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Pending Requests</span>
            {pendingRequestsCount > 0 && (
              <Badge className="bg-accent text-accent-foreground text-[10px]">Action</Badge>
            )}
          </div>
          <p className="text-foreground mt-2 font-serif text-3xl font-bold">
            {pendingRequestsCount}
          </p>
          <Button asChild variant="link" size="sm" className="text-primary mt-1 h-auto p-0 text-xs">
            <Link href="/tailor/customers">Review approvals &rarr;</Link>
          </Button>
        </Card>
      </div>

      {/* Getting Started Checklist */}
      <Card className="border-border/80 bg-card/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground font-serif text-lg font-medium">
                Getting Started as a Partner Tailor
              </CardTitle>
              <CardDescription className="font-sans text-xs">
                Setup your digital workshop to receive customer measurement passports.
              </CardDescription>
            </div>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              {isProfileComplete ? "Ready for Intake" : "Setup in Progress"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-border/70 bg-background/50 flex flex-col justify-between rounded-xl border p-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {isProfileComplete ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <CircleDashed className="text-accent h-4 w-4 shrink-0" />
                  )}
                  <span className="text-foreground text-xs font-semibold">Shop Profile</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {isProfileComplete
                    ? "Shop name, market address, and contact configured."
                    : "Add your market address and contact for customers."}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full text-xs">
                <Link href="/tailor/shop">
                  <Store className="mr-1 h-3.5 w-3.5" />
                  {isProfileComplete ? "Edit Profile" : "Complete Setup"}
                </Link>
              </Button>
            </div>

            <div className="border-border/70 bg-background/50 flex flex-col justify-between rounded-xl border p-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {activeClientsCount > 0 ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <CircleDashed className="text-muted-foreground h-4 w-4 shrink-0" />
                  )}
                  <span className="text-foreground text-xs font-semibold">Digital QR Intake</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {activeClientsCount > 0
                    ? `${activeClientsCount} client passport${activeClientsCount === 1 ? "" : "s"} linked.`
                    : "Direct camera scanner for instant customer passport import."}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full text-xs">
                <Link href="/tailor/scan">
                  <QrCode className="mr-1 h-3.5 w-3.5" />
                  {activeClientsCount > 0 ? "Scan Another" : "Intake Scanner"}
                </Link>
              </Button>
            </div>

            <div className="border-border/70 bg-background/50 flex flex-col justify-between rounded-xl border p-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CircleDashed className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-foreground text-xs font-semibold">Karigar Pipeline</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Track cutting, artisan assignments, and trial fitting milestones.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full text-xs" disabled>
                <span className="flex items-center justify-center">
                  <Layers className="mr-1 h-3.5 w-3.5" />
                  Coming soon
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan & Intake Banner */}
      <Card className="border-primary/20 from-primary/5 via-card to-accent/5 relative overflow-hidden bg-gradient-to-br">
        <div className="bg-accent/10 absolute top-0 right-0 size-48 translate-x-8 -translate-y-8 rounded-full blur-3xl" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary rounded-full p-1.5">
              <QrCode className="h-5 w-5" />
            </span>
            <CardTitle className="font-serif text-xl">Quick Intake Scanner</CardTitle>
          </div>
          <CardDescription>
            Scan a customer’s digital passport QR to load customer Shalwar Kameez, Kurta, or
            Sherwani specifications with their consent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
            Customer consent is granted on-the-fly. No manual paper registers, no lost slips, and
            zero re-measurement disputes.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm">
              <Link href="/tailor/scan" className="gap-2">
                Launch Scanner <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/tailor/shop">Update Shop Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity / Intake List (Empty State) */}
      <div className="space-y-3">
        <h2 className="text-foreground font-serif text-lg font-medium">Recent Intakes</h2>
        <Card className="border-border/80 bg-card/40 border-dashed p-10 text-center">
          <div className="bg-muted text-muted-foreground mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="bg-accent/15 text-accent-700 dark:text-accent-400 mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium">
            <Sparkles className="h-3 w-3" />
            Ready for your first customer
          </div>
          <p className="text-foreground text-sm font-medium">No customer scans yet</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
            When a customer shows their QR code in your shop, use the scanner to link their
            measurements to a new order.
          </p>
        </Card>
      </div>
    </div>
  );
}
