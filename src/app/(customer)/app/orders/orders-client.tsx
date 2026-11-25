"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatPKR, formatKarachiDate, formatRelativeDays } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import { ShoppingBag, Store, Phone, Calendar, User, ArrowRight } from "lucide-react";

export interface CustomerOrderSummary {
  id: string;
  shop_id: string;
  customer_id: string;
  person_label: string;
  shop_name: string;
  shop_city: string | null;
  shop_phone: string | null;
  order_seq: number;
  status: OrderStatus;
  total_pkr: number;
  paid_pkr: number;
  delivery_date: string;
  created_at: string;
  status_changed_at: string;
  closed_at: string | null;
}

interface OrdersClientProps {
  activeOrders: CustomerOrderSummary[];
  pastOrders: CustomerOrderSummary[];
}

export function CustomerOrdersClient({ activeOrders, pastOrders }: OrdersClientProps) {
  const [tab, setTab] = useState<"active" | "past">("active");

  const orders = tab === "active" ? activeOrders : pastOrders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            My Orders
          </h1>
          <p className="text-muted-foreground font-sans text-xs sm:text-sm">
            Track your suits in progress and view past tailoring orders.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="border-border bg-muted/40 flex rounded-lg border p-1">
          <button
            onClick={() => setTab("active")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              tab === "active"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setTab("past")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              tab === "past"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Past Orders ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="border-border bg-card space-y-3 p-8 text-center shadow-xs">
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
            <ShoppingBag className="size-6" />
          </div>
          <h3 className="text-foreground font-serif text-lg font-bold">
            {tab === "active" ? "No Active Orders" : "No Past Orders"}
          </h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs leading-relaxed">
            {tab === "active"
              ? "When a tailor accepts your passport and starts cutting or stitching your clothes, live status updates will appear here."
              : "Completed and delivered suits will be archived here for your records."}
          </p>
          {tab === "active" && (
            <div className="pt-2">
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link href="/app/passport">Display QR Passport</Link>
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {orders.map((order) => {
            const formattedSeq = `#${String(order.order_seq).padStart(4, "0")}`;
            const remainingBalance = Math.max(0, order.total_pkr - order.paid_pkr);
            const isDelivered = order.status === "delivered";

            return (
              <Card
                key={order.id}
                className="border-border bg-card hover:border-primary/40 flex flex-col justify-between space-y-4 p-5 shadow-xs transition-all"
              >
                <div className="space-y-3">
                  {/* Shop & Seq */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                        <Store className="text-primary size-4 shrink-0" />
                        <span className="truncate">{order.shop_name}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {order.shop_city && `${order.shop_city} • `}
                        Order {formattedSeq}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Person & Target Date */}
                  <div className="border-border/60 space-y-1.5 border-t pt-2.5 text-xs">
                    <div className="text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="text-primary size-3.5" />
                        <span>For:</span>
                      </span>
                      <strong className="text-foreground">{order.person_label}</strong>
                    </div>

                    <div className="text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="text-primary size-3.5" />
                        <span>{isDelivered ? "Delivered On:" : "Target Delivery:"}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-foreground font-medium">
                          {formatKarachiDate(order.delivery_date)}
                        </span>
                        {!isDelivered && (
                          <span className="text-muted-foreground block text-[10px]">
                            {formatRelativeDays(order.delivery_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Balance */}
                  <div className="bg-muted/40 flex items-center justify-between rounded-md p-2.5 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                        Total
                      </span>
                      <span className="text-foreground font-mono font-bold">
                        {formatPKR(order.total_pkr)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                        Balance
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {remainingBalance > 0 ? formatPKR(remainingBalance) : "Settled"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom link & Shop phone */}
                <div className="border-border/60 flex items-center justify-between border-t pt-3">
                  {order.shop_phone ? (
                    <a
                      href={`tel:${order.shop_phone}`}
                      className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-[11px] transition-colors"
                    >
                      <Phone className="size-3 text-emerald-600" />
                      <span>{order.shop_phone}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">TailorTrack Order</span>
                  )}

                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="text-primary h-7 p-0 text-xs font-medium hover:underline"
                  >
                    <Link href={`/app/orders/${order.id}`}>
                      <span>View Progress</span>
                      <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
