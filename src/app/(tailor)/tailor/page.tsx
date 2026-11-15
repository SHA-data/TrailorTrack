import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, Users, ShoppingBag, Clock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TailorDashboardPage() {
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
    .select("shop_name, city, address, phone")
    .eq("owner_id", user.id)
    .maybeSingle();

  const shopDisplayName = shop?.shop_name || "Your Tailor Shop";
  const tailorName = profile?.full_name || "Master Tailor";

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

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Active Orders
            </CardTitle>
            <ShoppingBag className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground font-serif text-2xl font-bold">0</div>
            <p className="text-muted-foreground mt-1 text-xs">In cutting & stitching</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Pending Fittings
            </CardTitle>
            <Clock className="text-accent h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground font-serif text-2xl font-bold">0</div>
            <p className="text-muted-foreground mt-1 text-xs">Trial fittings scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Connected Clients
            </CardTitle>
            <Users className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground font-serif text-2xl font-bold">0</div>
            <p className="text-muted-foreground mt-1 text-xs">With active consent</p>
          </CardContent>
        </Card>
      </div>

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
            Scan a customer’s digital passport QR to load verified Shalwar Kameez, Kurta, or
            Sherwani specifications instantly.
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
