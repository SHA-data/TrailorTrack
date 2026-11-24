"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { isOrderOpen } from "@/lib/orders/status";
import { formatPKR, formatKarachiDate, formatRelativeDays } from "@/lib/format";
import type { OrderDetailWithItems } from "@/lib/orders/queries";
import {
  ArrowLeft,
  User,
  Store,
  Phone,
  Banknote,
  CheckCircle2,
  Clock,
  Ruler,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

interface CustomerOrderDetailClientProps {
  order: OrderDetailWithItems;
  hasNewerMeasurementsMap: Record<string, string>; // itemId -> newer date string
}

export function CustomerOrderDetailClient({
  order,
  hasNewerMeasurementsMap,
}: CustomerOrderDetailClientProps) {
  const router = useRouter();
  const [expandedSnapshots, setExpandedSnapshots] = useState<Record<string, boolean>>({});

  const isOpen = isOrderOpen(order.status);
  const remainingBalance = Math.max(0, order.total_pkr - order.paid_pkr);
  const isPaidInFull = remainingBalance === 0;

  // Auto-refresh every 30 seconds if open and tab is visible
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        router.refresh();
      }
    }, 30000);

    const handleVisibility = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isOpen, router]);

  const toggleSnapshot = (itemId: string) => {
    setExpandedSnapshots((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const formattedSeq = `#${String(order.order_seq).padStart(4, "0")}`;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-xs">
            <Link href="/app/orders">
              <ArrowLeft className="mr-1 size-3.5" />
              My Orders
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              Order {formattedSeq}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Shop Quick Contact */}
        {order.shop_phone && (
          <Button
            asChild
            size="sm"
            className="w-fit bg-emerald-600 text-xs text-white hover:bg-emerald-700"
          >
            <a href={`tel:${order.shop_phone}`}>
              <Phone className="mr-1.5 size-3.5" />
              Call Shop ({order.shop_name})
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details & Garments (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shop & Booking Card */}
          <Card className="border-border bg-card p-5 shadow-xs">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                  Tailor Shop
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Store className="text-primary size-4 shrink-0" />
                  <p className="text-foreground truncate text-xs font-medium">{order.shop_name}</p>
                </div>
                {order.shop_city && (
                  <p className="text-muted-foreground text-[10px]">{order.shop_city}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                  Suit For
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <User className="text-primary size-4 shrink-0" />
                  <p className="text-foreground truncate text-xs font-medium">
                    {order.person_label}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                  Booked On
                </p>
                <p className="text-foreground mt-1 text-xs font-medium">
                  {formatKarachiDate(order.created_at)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                  {order.status === "delivered" ? "Delivered On" : "Target Delivery"}
                </p>
                <p className="text-foreground mt-1 text-xs font-medium">
                  {formatKarachiDate(order.delivery_date)}
                </p>
                {order.status !== "delivered" && (
                  <p className="text-muted-foreground text-[10px]">
                    {formatRelativeDays(order.delivery_date)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Garments List */}
          <div className="space-y-3">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              Garments in Order ({order.items.length})
            </h2>

            {order.items.map((item, index) => {
              const snapshot = item.snapshot;
              const hasSnapshot = Boolean(snapshot);
              const isExpanded = expandedSnapshots[item.id] || false;
              const snapshotValues = (snapshot?.values as Record<string, number | null>) || {};
              const newerDate = hasNewerMeasurementsMap[item.id];

              return (
                <Card key={item.id} className="border-border bg-card space-y-3 p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full font-mono text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <h3 className="text-foreground text-sm font-medium capitalize">
                          {item.garment_type.replace(/_/g, " ")}
                        </h3>
                        <Badge variant="outline" className="text-[10px]">
                          Qty: {item.quantity}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Fabric:{" "}
                        <span className="text-foreground font-medium capitalize">
                          {item.fabric_source === "customer" ? "Client Provided" : "Shop Fabric"}
                        </span>
                        {item.fabric_details && ` • ${item.fabric_details}`}
                        {item.fabric_metres && ` • ${item.fabric_metres}m`}
                      </p>
                      {item.design_notes && (
                        <p className="text-muted-foreground mt-1 text-xs italic">
                          Notes: &quot;{item.design_notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Newer measurement alert if customer updated measurements since order creation */}
                  {newerDate && (
                    <div className="flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] text-amber-800">
                      <Info className="size-3.5 shrink-0 text-amber-600" />
                      <span>
                        Note: You recorded a newer measurement set on{" "}
                        <strong>{formatKarachiDate(newerDate)}</strong> after this order was booked.
                        This order is stitched according to the frozen snapshot below.
                      </span>
                    </div>
                  )}

                  {/* Measurement snapshot display */}
                  <div className="border-border border-t pt-2">
                    {hasSnapshot ? (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSnapshot(item.id)}
                          className="text-primary h-7 px-2 text-xs"
                        >
                          <Ruler className="mr-1.5 size-3" />
                          <span>
                            {isExpanded ? "Hide Saved Measurements" : "View Saved Measurements"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="ml-1 size-3" />
                          ) : (
                            <ChevronDown className="ml-1 size-3" />
                          )}
                        </Button>

                        {isExpanded && (
                          <div className="border-border/70 bg-muted/40 space-y-2 rounded-md border p-3 text-xs">
                            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                              <span>
                                Snapshot taken:{" "}
                                <strong className="text-foreground">
                                  {snapshot?.taken_on
                                    ? formatKarachiDate(snapshot.taken_on)
                                    : "N/A"}
                                </strong>
                              </span>
                              <span>
                                Fit:{" "}
                                <strong className="text-foreground capitalize">
                                  {snapshot?.fit_preference || "Standard"}
                                </strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] sm:grid-cols-3">
                              {Object.entries(snapshotValues).map(([key, val]) => (
                                <div
                                  key={key}
                                  className="border-border/40 flex justify-between border-b py-1"
                                >
                                  <span className="text-muted-foreground capitalize">
                                    {key.replace(/_/g, " ")}:
                                  </span>
                                  <span className="text-foreground font-semibold">
                                    {val ?? "—"} in
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs italic">
                        No measurement set snapshot attached to this garment item.
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Payment & Timeline (1 col) */}
        <div className="space-y-6">
          {/* Payment Card */}
          <Card className="border-border bg-card space-y-4 p-5 shadow-xs">
            <h2 className="text-foreground flex items-center gap-1.5 font-serif text-base font-semibold">
              <Banknote className="size-4 text-emerald-600" />
              Bill & Payment
            </h2>
            <div className="space-y-2 text-xs">
              <div className="border-border flex justify-between border-b py-1">
                <span className="text-muted-foreground">Total Bill:</span>
                <span className="text-foreground font-mono font-semibold">
                  {formatPKR(order.total_pkr)}
                </span>
              </div>
              <div className="border-border flex justify-between border-b py-1">
                <span className="text-muted-foreground">Paid So Far:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatPKR(order.paid_pkr)}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 text-sm font-semibold">
                <span className="text-foreground">Remaining Balance:</span>
                <span
                  className={`font-mono ${
                    remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {formatPKR(remainingBalance)}
                </span>
              </div>
            </div>

            {isPaidInFull ? (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 p-2 text-xs text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                <span>Paid in full</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-[11px]">
                Please settle the remaining {formatPKR(remainingBalance)} with your tailor upon
                trial or delivery.
              </p>
            )}
          </Card>

          {/* Timeline */}
          <Card className="border-border bg-card space-y-4 p-5 shadow-xs">
            <h2 className="text-foreground flex items-center gap-1.5 font-serif text-base font-semibold">
              <Clock className="text-primary size-4" />
              Order Progress
            </h2>
            <OrderTimeline events={order.events} />
          </Card>
        </div>
      </div>
    </div>
  );
}
