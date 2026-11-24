"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusActionDialog } from "@/components/orders/status-action-dialog";
import { RescheduleDialog } from "@/components/orders/reschedule-dialog";
import { ChangePriceDialog } from "@/components/orders/change-price-dialog";
import { RecordPaymentDialog } from "@/components/orders/record-payment-dialog";
import { isOrderOpen, getNextMilestone } from "@/lib/orders/status";
import { formatPKR, formatKarachiDate, formatRelativeDays } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import type { OrderDetailWithItems } from "@/lib/orders/queries";
import {
  ArrowLeft,
  Calendar,
  User,
  Banknote,
  Scissors,
  CheckCircle2,
  Clock,
  Ruler,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface OrderDetailClientProps {
  order: OrderDetailWithItems;
  activeConsentWithMeasurements: boolean;
}

export function TailorOrderDetailClient({
  order,
  activeConsentWithMeasurements,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [expandedSnapshots, setExpandedSnapshots] = useState<Record<string, boolean>>({});

  // Controlled dialog states
  const [statusTarget, setStatusTarget] = useState<OrderStatus | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  const isOpen = isOrderOpen(order.status);
  const nextMilestone = getNextMilestone(order.status);
  const remainingBalance = Math.max(0, order.total_pkr - order.paid_pkr);
  const isPaidInFull = remainingBalance === 0;
  const canRecordPayment = remainingBalance > 0 && order.status !== "cancelled";

  const toggleSnapshot = (itemId: string) => {
    setExpandedSnapshots((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const formattedSeq = `#${String(order.order_seq).padStart(4, "0")}`;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-xs">
              <Link href="/tailor/orders">
                <ArrowLeft className="mr-1 size-3.5" />
                Orders
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-mono text-xs font-semibold">{formattedSeq}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground font-serif text-2xl font-bold tracking-tight">
              Order {formattedSeq}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isOpen && nextMilestone && (
            <Button
              size="sm"
              onClick={() => setStatusTarget(nextMilestone)}
              className="bg-primary text-primary-foreground text-xs shadow-sm"
            >
              <Scissors className="mr-1.5 size-3.5" />
              Advance to {nextMilestone}
            </Button>
          )}

          {canRecordPayment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPaymentOpen(true)}
              className="text-xs"
            >
              <Banknote className="mr-1.5 size-3.5 text-emerald-600" />
              Record Payment
            </Button>
          )}

          {isOpen && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRescheduleOpen(true)}
                className="text-xs"
              >
                <Calendar className="mr-1.5 size-3.5" />
                Reschedule
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPriceOpen(true)}
                className="text-xs"
              >
                Adjust Price
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStatusTarget("cancelled")}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Cancel Order
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Order details & items (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Key Meta Card */}
          <Card className="border-border bg-card p-5 shadow-xs">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold uppercase">Client</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <User className="text-primary size-4" />
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
                  Target Delivery
                </p>
                <p className="text-foreground mt-1 text-xs font-medium">
                  {formatKarachiDate(order.delivery_date)}
                </p>
                <p className="text-muted-foreground text-[10px]">
                  {formatRelativeDays(order.delivery_date)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold uppercase">
                  Status Stage
                </p>
                <p className="text-foreground mt-1 text-xs font-medium capitalize">
                  {order.status}
                </p>
              </div>
            </div>
          </Card>

          {/* Items Section */}
          <div className="space-y-3">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              Garments & Items ({order.items.length})
            </h2>

            {order.items.map((item, index) => {
              const snapshot = item.snapshot;
              const hasSnapshot = Boolean(snapshot);
              const isExpanded = expandedSnapshots[item.id] || false;
              const snapshotValues = (snapshot?.values as Record<string, number | null>) || {};

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
                            {isExpanded ? "Hide Measurement Snapshot" : "View Measurement Snapshot"}
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
                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs italic">
                        <AlertCircle className="size-3 text-amber-500" />
                        {!isOpen && !activeConsentWithMeasurements
                          ? "You can no longer open these measurements in TailorTrack. (Consent has ended or order is closed)."
                          : "No measurement set attached to this item."}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Payment & Audit History (1 col) */}
        <div className="space-y-6">
          {/* Payment Card */}
          <Card className="border-border bg-card space-y-4 p-5 shadow-xs">
            <h2 className="text-foreground flex items-center gap-1.5 font-serif text-base font-semibold">
              <Banknote className="size-4 text-emerald-600" />
              Payment Summary
            </h2>
            <div className="space-y-2 text-xs">
              <div className="border-border flex justify-between border-b py-1">
                <span className="text-muted-foreground">Order Total:</span>
                <span className="text-foreground font-mono font-semibold">
                  {formatPKR(order.total_pkr)}
                </span>
              </div>
              <div className="border-border flex justify-between border-b py-1">
                <span className="text-muted-foreground">Amount Paid:</span>
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
                Outstanding balance will be settled upon delivery or subsequent milestone payment.
              </p>
            )}
          </Card>

          {/* Audit History Timeline */}
          <Card className="border-border bg-card space-y-4 p-5 shadow-xs">
            <h2 className="text-foreground flex items-center gap-1.5 font-serif text-base font-semibold">
              <Clock className="text-primary size-4" />
              Audit Log
            </h2>
            <OrderTimeline events={order.events} />
          </Card>
        </div>
      </div>

      {/* Controlled Action Dialogs */}
      <StatusActionDialog
        open={statusTarget !== null}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        orderId={order.id}
        currentStatus={order.status}
        targetStatus={statusTarget}
        totalPkr={order.total_pkr}
        paidPkr={order.paid_pkr}
        onSuccess={() => {
          setStatusTarget(null);
          router.refresh();
        }}
      />

      <RecordPaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        orderId={order.id}
        totalPkr={order.total_pkr}
        paidPkr={order.paid_pkr}
        onSuccess={() => {
          setIsPaymentOpen(false);
          router.refresh();
        }}
      />

      <RescheduleDialog
        open={isRescheduleOpen}
        onOpenChange={setIsRescheduleOpen}
        orderId={order.id}
        currentDeliveryDate={order.delivery_date}
        onSuccess={() => {
          setIsRescheduleOpen(false);
          router.refresh();
        }}
      />

      <ChangePriceDialog
        open={isPriceOpen}
        onOpenChange={setIsPriceOpen}
        orderId={order.id}
        currentTotal={order.total_pkr}
        paidPkr={order.paid_pkr}
        onSuccess={() => {
          setIsPriceOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
