import React from "react";
import { ORDER_PIPELINE, ORDER_STATUS_META } from "@/lib/orders/status";
import { formatKarachiDate } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import type { OrderEventRow } from "@/lib/orders/queries";
import { Check, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MilestoneTimelineProps {
  currentStatus: OrderStatus;
  events: OrderEventRow[];
  createdAt: string;
  statusChangedAt: string;
}

/**
 * Renders the vertical milestone progression for the customer order detail.
 * Highlights reached statuses, displays exact timestamps from events,
 * marks skipped steps as done without timestamp, and displays cancelled as an end state.
 */
export function CustomerOrderTimeline({
  currentStatus,
  events,
  createdAt,
  statusChangedAt,
}: MilestoneTimelineProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className="space-y-3 py-2">
        <div className="border-destructive/30 bg-destructive/10 flex items-start gap-3 rounded-lg border p-3.5">
          <XCircle className="text-destructive mt-0.5 size-5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-destructive text-sm font-semibold">Order Cancelled</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This stitching order has been cancelled by the shop on{" "}
              {formatKarachiDate(statusChangedAt, true)}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_PIPELINE.indexOf(currentStatus);

  // Map each status to the timestamp it was reached based on events
  const statusTimestamps: Record<string, string> = {
    received: createdAt,
  };

  events.forEach((e) => {
    if (e.kind === "status_changed" && e.to_value) {
      statusTimestamps[e.to_value] = e.created_at;
    }
  });

  return (
    <div className="relative space-y-4 py-2 pl-6">
      {/* Vertical timeline rule */}
      <div className="bg-border absolute top-3 bottom-3 left-2.5 w-0.5" />

      {ORDER_PIPELINE.map((status, index) => {
        const meta = ORDER_STATUS_META[status];
        const isReached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const reachedAt = statusTimestamps[status];

        return (
          <div key={status} className="relative flex items-start gap-3">
            {/* Step indicator node */}
            <div
              className={cn(
                "absolute -left-6 flex size-5 items-center justify-center rounded-full border text-[10px] font-bold transition-all",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground ring-primary/20 ring-4"
                  : isReached
                    ? "border-primary/80 bg-primary/20 text-primary"
                    : "border-border bg-muted/60 text-muted-foreground"
              )}
            >
              {isReached ? <Check className="size-3" /> : index + 1}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isCurrent
                      ? "text-primary font-bold"
                      : isReached
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {meta.label}
                </span>

                {reachedAt ? (
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {formatKarachiDate(reachedAt, true)}
                  </span>
                ) : isReached ? (
                  <span className="text-muted-foreground/70 text-[10px] italic">Completed</span>
                ) : null}
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Detailed chronological audit feed for tailor view from order_events.
 */
export function TailorOrderEventsFeed({ events }: { events: OrderEventRow[] }) {
  if (!events || events.length === 0) {
    return <p className="text-muted-foreground text-xs">No recorded events for this order.</p>;
  }

  const getEventText = (event: OrderEventRow) => {
    switch (event.kind) {
      case "created":
        return "Order created (status: received)";
      case "status_changed":
        return `Milestone changed from ${event.from_value} to ${event.to_value}`;
      case "delivery_rescheduled":
        return `Delivery rescheduled to ${event.to_value ? formatKarachiDate(event.to_value) : ""}`;
      case "price_changed":
        return `Total price adjusted from PKR ${event.from_value} to PKR ${event.to_value}`;
      case "payment_recorded":
        return event.note || `Payment recorded: new paid amount PKR ${event.to_value}`;
      default:
        return event.kind;
    }
  };

  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div
          key={e.id}
          className="border-border/60 bg-muted/20 flex items-start gap-2.5 rounded-md border p-2.5 text-xs"
        >
          <Clock className="text-accent mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-foreground font-medium">{getEventText(e)}</span>
              <span className="text-muted-foreground font-mono text-[10px]">
                {formatKarachiDate(e.created_at, true)}
              </span>
            </div>
            {e.note && e.kind !== "payment_recorded" && (
              <p className="text-muted-foreground text-[11px] italic">&quot;{e.note}&quot;</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export const OrderTimeline = TailorOrderEventsFeed;
