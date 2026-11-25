import type { OrderStatus } from "@/types/database";

export interface StatusMeta {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  description: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
  badgeClass: string;
}

export const ORDER_PIPELINE: OrderStatus[] = [
  "received",
  "cutting",
  "stitching",
  "ready",
  "delivered",
];

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  received: {
    status: "received",
    label: "Order Received",
    shortLabel: "Received",
    description: "Order booked and recorded in shop diary",
    badgeVariant: "secondary",
    badgeClass: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  cutting: {
    status: "cutting",
    label: "Fabric Cutting",
    shortLabel: "Cutting",
    description: "Fabric patterned and cut to specified measurements",
    badgeVariant: "secondary",
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  stitching: {
    status: "stitching",
    label: "Under Stitching",
    shortLabel: "Stitching",
    description: "Master artisan is stitching collar, cuffs, and seams",
    badgeVariant: "secondary",
    badgeClass: "bg-purple-500/10 text-purple-700 border-purple-200",
  },
  ready: {
    status: "ready",
    label: "Ready for Pickup",
    shortLabel: "Ready",
    description: "Garment is pressed, packaged, and ready for trial or pickup",
    badgeVariant: "secondary",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  delivered: {
    status: "delivered",
    label: "Delivered",
    shortLabel: "Delivered",
    description: "Garment handed over to customer",
    badgeVariant: "default",
    badgeClass: "bg-primary text-primary-foreground border-transparent",
  },
  cancelled: {
    status: "cancelled",
    label: "Cancelled",
    shortLabel: "Cancelled",
    description: "Order has been cancelled",
    badgeVariant: "destructive",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

/**
 * Checks if the order is currently active (not delivered or cancelled).
 */
export function isOrderOpen(status: OrderStatus): boolean {
  return (
    status === "received" || status === "cutting" || status === "stitching" || status === "ready"
  );
}

/**
 * Validates forward progression along the pipeline, or cancellation from any open status.
 */
export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  if (currentStatus === targetStatus) return false;
  if (!isOrderOpen(currentStatus)) return false; // terminal orders cannot transition

  if (targetStatus === "cancelled") {
    return isOrderOpen(currentStatus);
  }

  const currentIndex = ORDER_PIPELINE.indexOf(currentStatus);
  const targetIndex = ORDER_PIPELINE.indexOf(targetStatus);

  if (currentIndex === -1 || targetIndex === -1) return false;
  return targetIndex > currentIndex;
}

/**
 * Returns the immediate next milestone along the pipeline, or null if terminal.
 */
export function getNextMilestone(currentStatus: OrderStatus): OrderStatus | null {
  const currentIndex = ORDER_PIPELINE.indexOf(currentStatus);
  if (currentIndex >= 0 && currentIndex < ORDER_PIPELINE.length - 1) {
    return ORDER_PIPELINE[currentIndex + 1];
  }
  return null;
}
