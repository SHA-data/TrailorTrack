import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  QrCode,
  Sparkles,
  CheckCircle2,
  CircleDashed,
  Scissors,
  Calendar,
  Banknote,
  ShoppingBag,
  ChevronRight,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getShopDashboardStats, getTailorOrders } from "@/lib/orders/queries";
import { formatPKR, formatKarachiDate, formatRelativeDays } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

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

  // Fetch real counts & RPC dashboard stats
  let activeClientsCount = 0;

  if (shop?.id) {
    const { data: clientsRaw } = await supabase.rpc("list_my_consented_customers");
    activeClientsCount = (clientsRaw || []).length;
  }

  const stats = await getShopDashboardStats();
  const recentOrders = await getTailorOrders({ tab: "active" });

  const shopDisplayName = shop?.shop_name || "Your Tailor Shop";
  const tailorName = profile?.full_name || "Master Tailor";
  const isProfileComplete = Boolean(shop?.shop_name && shop?.city && shop?.address && shop?.phone);

  const totalActiveOrders =
    (stats?.received_count || 0) +
    (stats?.cutting_count || 0) +
    (stats?.stitching_count || 0) +
    (stats?.ready_count || 0);

  const totalAllOrders =
    totalActiveOrders + (stats?.delivered_count || 0) + (stats?.cancelled_count || 0);

  // Checklist items
  const checklist = [
    {
      title: "Shop Profile",
      description: isProfileComplete
        ? "Shop name, market address, and contact configured."
        : "Add your shop name, city, address and contact number.",
      done: isProfileComplete,
      href: "/tailor/shop",
      actionText: isProfileComplete ? "Edit Profile" : "Complete Profile",
    },
    {
      title: "Scan Client Passport",
      description:
        activeClientsCount > 0
          ? `${activeClientsCount} client passport(s) linked.`
          : "Scan a customer QR code to initiate digital passport access.",
      done: activeClientsCount > 0,
      href: "/tailor/scan",
      actionText: activeClientsCount > 0 ? "Scan Another" : "Launch Scanner",
    },
    {
      title: "Approve Consent",
      description:
        activeClientsCount > 0
          ? "Client approved access to digital measurements."
          : "Customer reviews and confirms consent from their device.",
      done: activeClientsCount > 0,
      href: "/tailor/customers",
      actionText: "View Clients",
    },
    {
      title: "Create First Order",
      description:
        totalAllOrders > 0
          ? `${totalAllOrders} total order(s) booked in system.`
          : "Select a consented client and record a stitching job.",
      done: totalAllOrders > 0,
      href: "/tailor/orders/new",
      actionText: totalAllOrders > 0 ? "New Order" : "Book Order",
    },
    {
      title: "Deliver First Order",
      description:
        (stats?.delivered_count || 0) > 0
          ? `${stats?.delivered_count} suit(s) completed and delivered.`
          : "Advance order through cutting and stitching to delivery.",
      done: (stats?.delivered_count || 0) > 0,
      href: "/tailor/orders",
      actionText: "Orders Board",
    },
  ];

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

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="default" variant="outline" className="gap-1.5 text-xs">
            <Link href="/tailor/orders/new">
              <Plus className="size-3.5" />
              New Order
            </Link>
          </Button>
          <Button asChild size="default" className="gap-2 text-xs shadow-md">
            <Link href="/tailor/scan">
              <QrCode className="size-4" />
              Scan Client QR
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid (4 Cards) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Active Pipeline Card */}
        <Card className="border-border bg-card flex flex-col justify-between p-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">Active Pipeline</span>
              <Scissors className="text-primary size-4" />
            </div>
            <p className="text-foreground mt-2 font-serif text-3xl font-bold">
              {totalActiveOrders}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {stats?.received_count || 0} rcvd • {stats?.cutting_count || 0} cut •{" "}
              {stats?.stitching_count || 0} stch • {stats?.ready_count || 0} ready
            </p>
          </div>
          <Button
            asChild
            variant="link"
            size="sm"
            className="text-primary mt-3 h-auto justify-start p-0 text-xs"
          >
            <Link href="/tailor/orders">Open orders board &rarr;</Link>
          </Button>
        </Card>

        {/* Due & Overdue Alerts */}
        <Card className="border-border bg-card flex flex-col justify-between p-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">Due Schedule</span>
              <Calendar className="size-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-foreground font-serif text-3xl font-bold">
                {stats?.due_today || 0}
              </span>
              <span className="text-muted-foreground text-xs">due today</span>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {(stats?.overdue || 0) > 0 ? (
                <span className="font-semibold text-rose-600">{stats?.overdue} overdue</span>
              ) : (
                "0 overdue"
              )}{" "}
              • {stats?.due_next_7_days || 0} due in 7 days
            </p>
          </div>
          <Button
            asChild
            variant="link"
            size="sm"
            className="text-primary mt-3 h-auto justify-start p-0 text-xs"
          >
            <Link href="/tailor/orders">View schedule &rarr;</Link>
          </Button>
        </Card>

        {/* Outstanding Balance */}
        <Card className="border-border bg-card flex flex-col justify-between p-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">Receivables</span>
              <Banknote className="size-4 text-emerald-600" />
            </div>
            <p className="text-foreground mt-2 truncate font-serif text-2xl font-bold">
              {formatPKR(stats?.outstanding_balance_pkr || 0)}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">Unsettled balance on open jobs</p>
          </div>
          <Button
            asChild
            variant="link"
            size="sm"
            className="text-primary mt-3 h-auto justify-start p-0 text-xs"
          >
            <Link href="/tailor/orders?tab=active">Track balances &rarr;</Link>
          </Button>
        </Card>

        {/* Monthly Production */}
        <Card className="border-border bg-card flex flex-col justify-between p-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">This Month</span>
              <ShoppingBag className="text-accent size-4" />
            </div>
            <p className="text-foreground mt-2 truncate font-serif text-2xl font-bold">
              {stats?.created_this_month || 0} suits
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {stats?.delivered_this_month || 0} delivered (Karachi Time)
            </p>
          </div>
          <Button
            asChild
            variant="link"
            size="sm"
            className="text-primary mt-3 h-auto justify-start p-0 text-xs"
          >
            <Link href="/tailor/orders?tab=closed">Delivered suits &rarr;</Link>
          </Button>
        </Card>
      </div>

      {/* Getting Started Checklist */}
      <Card className="border-border/80 bg-card/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground font-serif text-lg font-medium">
                TailorTrack Workshop Checklist
              </CardTitle>
              <CardDescription className="font-sans text-xs">
                Essential steps to run a digital tailoring workflow in Pakistan.
              </CardDescription>
            </div>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
              <Sparkles className="size-3" />
              {checklist.filter((c) => c.done).length} of {checklist.length} Completed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {checklist.map((item) => (
              <div
                key={item.title}
                className="border-border/70 bg-background/50 flex flex-col justify-between space-y-3 rounded-xl border p-3.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {item.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleDashed className="text-muted-foreground size-4 shrink-0" />
                    )}
                    <span className="text-foreground text-xs font-semibold">{item.title}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="h-7 w-full text-xs">
                  <Link href={item.href}>{item.actionText}</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Orders / Quick Workstation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground flex items-center gap-2 font-serif text-lg font-medium">
            <Scissors className="text-primary size-4" />
            Active Suits in Progress ({recentOrders.length})
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-primary text-xs">
            <Link href="/tailor/orders">View All Orders &rarr;</Link>
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <Card className="border-border/80 bg-card/40 border-dashed p-8 text-center">
            <div className="bg-muted text-muted-foreground mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl">
              <ShoppingBag className="size-6" />
            </div>
            <p className="text-foreground text-sm font-medium">No suits in progress</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              Book your first order for a consented customer to start tracking cutting and
              stitching.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button asChild size="sm" className="text-xs">
                <Link href="/tailor/orders/new">Book New Order</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/tailor/scan">Scan Client QR</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentOrders.slice(0, 6).map((ord) => (
              <Link
                key={ord.id}
                href={`/tailor/orders/${ord.id}`}
                className="group border-border bg-card hover:border-primary/50 flex flex-col justify-between space-y-3 rounded-xl border p-4 shadow-xs transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <span className="text-primary font-mono text-xs font-semibold group-hover:underline">
                      #{String(ord.order_seq).padStart(4, "0")}
                    </span>
                    <OrderStatusBadge status={ord.status} />
                  </div>
                  <h3 className="text-foreground truncate text-xs font-medium">
                    {ord.person_label}
                  </h3>
                  <p className="text-muted-foreground text-[11px]">
                    Due {formatKarachiDate(ord.delivery_date)} (
                    {formatRelativeDays(ord.delivery_date)})
                  </p>
                </div>

                <div className="border-border/60 flex items-center justify-between border-t pt-2 text-xs">
                  <span className="text-foreground font-mono font-bold">
                    {formatPKR(ord.total_pkr)}
                  </span>
                  <span className="text-muted-foreground group-hover:text-primary flex items-center text-[10px] transition-colors">
                    <span>Manage</span>
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
