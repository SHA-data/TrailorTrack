import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "./order-status-badge";
import { formatPKR, getRelativeDaysMeta } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: {
    id: string;
    order_seq: number;
    person_label: string;
    shop_name?: string;
    status: OrderStatus;
    total_pkr: number;
    paid_pkr: number;
    delivery_date: string;
    items_summary?: string;
  };
  variant: "tailor" | "customer";
  href?: string;
  className?: string;
}

export function OrderCard({ order, variant, href, className }: OrderCardProps) {
  const targetHref =
    href || (variant === "tailor" ? `/tailor/orders/${order.id}` : `/app/orders/${order.id}`);
  const seqLabel = `#${String(order.order_seq).padStart(4, "0")}`;
  const relative = getRelativeDaysMeta(order.delivery_date);
  const balance = order.total_pkr - order.paid_pkr;
  const isPaidInFull = balance <= 0;

  return (
    <Card
      className={cn(
        "group border-border bg-card hover:border-accent/40 relative overflow-hidden p-4 shadow-xs transition-all hover:shadow-sm",
        className
      )}
    >
      <Link href={targetHref} className="block space-y-3">
        {/* Top Header: Seq, Status, Person / Shop */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-mono text-xs font-semibold">{seqLabel}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <h3 className="text-foreground group-hover:text-primary line-clamp-1 font-serif text-base font-semibold">
              {variant === "tailor" ? order.person_label : order.shop_name || "Tailor Shop"}
            </h3>
          </div>
          <ChevronRight className="text-muted-foreground/60 group-hover:text-primary size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Middle: Items or secondary context */}
        {order.items_summary && (
          <p className="text-muted-foreground line-clamp-1 text-xs">{order.items_summary}</p>
        )}

        {/* Bottom Footer: Delivery Countdown & Financials */}
        <div className="border-border/60 text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs">
          <div
            className={cn(
              "flex items-center gap-1 font-medium",
              relative.isOverdue
                ? "text-destructive"
                : relative.isDueToday
                  ? "text-amber-600"
                  : "text-muted-foreground"
            )}
          >
            <Calendar className="size-3.5" />
            <span>{relative.text}</span>
          </div>

          <div className="text-right">
            {isPaidInFull ? (
              <span className="font-semibold text-emerald-700">
                Paid ({formatPKR(order.total_pkr)})
              </span>
            ) : (
              <span className="font-medium">
                Due: <strong className="text-foreground">{formatPKR(balance)}</strong>
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
