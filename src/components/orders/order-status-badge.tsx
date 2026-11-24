import React from "react";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_META, type StatusMeta } from "@/lib/orders/status";
import type { OrderStatus } from "@/types/database";
import { Package, Scissors, Sparkles, CheckCircle2, CheckCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
}

export function OrderStatusBadge({ status, className, showIcon = true }: OrderStatusBadgeProps) {
  const meta: StatusMeta = ORDER_STATUS_META[status] || {
    status,
    label: status,
    shortLabel: status,
    description: "",
    badgeVariant: "secondary",
    badgeClass: "bg-muted text-muted-foreground",
  };

  const renderIcon = () => {
    switch (status) {
      case "received":
        return <Package className="size-3" />;
      case "cutting":
        return <Scissors className="size-3" />;
      case "stitching":
        return <Sparkles className="size-3" />;
      case "ready":
        return <CheckCircle2 className="size-3" />;
      case "delivered":
        return <CheckCheck className="size-3" />;
      case "cancelled":
        return <XCircle className="size-3" />;
    }
  };

  return (
    <Badge
      variant={meta.badgeVariant}
      className={cn(
        "gap-1 px-2 py-0.5 text-[11px] font-medium tracking-normal",
        meta.badgeClass,
        className
      )}
    >
      {showIcon && renderIcon()}
      <span>{meta.shortLabel}</span>
    </Badge>
  );
}
