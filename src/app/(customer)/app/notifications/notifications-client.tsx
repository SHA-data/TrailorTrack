"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markNotificationsReadAction } from "@/lib/orders/actions";
import { renderNotificationText } from "@/lib/content/orders";
import { formatKarachiDate } from "@/lib/format";
import type { NotificationRow } from "@/lib/orders/queries";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Scissors,
  CheckCircle2,
  Calendar,
  Banknote,
  Clock,
  ArrowRight,
} from "lucide-react";

interface NotificationsClientProps {
  notifications: NotificationRow[];
}

export function NotificationsClient({ notifications }: NotificationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const res = await markNotificationsReadAction();
      if (res.success) {
        toast.success("All notifications marked as read");
        router.refresh();
      } else {
        toast.error("Failed to mark notifications as read");
      }
    });
  };

  const handleNotificationClick = (n: NotificationRow) => {
    if (!n.read_at) {
      startTransition(async () => {
        await markNotificationsReadAction([n.id]);
        router.refresh();
      });
    }
  };

  // Group notifications by date (YYYY-MM-DD in Karachi time)
  const groupedByDay = notifications.reduce<Record<string, NotificationRow[]>>((acc, n) => {
    const day = n.created_at.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(n);
    return acc;
  }, {});

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "order_status_changed":
        return <Scissors className="text-primary size-4" />;
      case "order_ready":
      case "order_delivered":
        return <CheckCircle2 className="size-4 text-emerald-600" />;
      case "order_rescheduled":
        return <Calendar className="size-4 text-blue-600" />;
      case "order_price_changed":
      case "payment_recorded":
        return <Banknote className="size-4 text-amber-600" />;
      case "consent_requested":
      case "consent_revoked":
        return <Clock className="size-4 text-purple-600" />;
      default:
        return <Bell className="text-primary size-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-foreground font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-sans text-xs sm:text-sm">
            Live updates on your tailoring orders and consent access.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="w-fit text-xs"
          >
            <CheckCheck className="mr-1.5 size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications Grouped List */}
      {notifications.length === 0 ? (
        <Card className="border-border bg-card space-y-3 p-12 text-center shadow-xs">
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
            <Bell className="size-6" />
          </div>
          <h3 className="text-foreground font-serif text-lg font-bold">No Notifications</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs leading-relaxed">
            You will receive updates here when your tailor starts cutting, stitching, or finishes
            your clothes.
          </p>
          <div className="pt-2">
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/app/orders">View My Orders</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDay).map(([dayString, dayNotifications]) => (
            <div key={dayString} className="space-y-2">
              <h3 className="text-muted-foreground px-1 font-sans text-xs font-semibold tracking-wider uppercase">
                {formatKarachiDate(dayString)}
              </h3>

              <div className="space-y-2">
                {dayNotifications.map((n) => {
                  const rendered = renderNotificationText(
                    n.kind,
                    (n.data as Record<string, unknown>) || {}
                  );
                  const isUnread = !n.read_at;
                  const orderId = (n.data as Record<string, unknown>)?.order_id as
                    string | undefined;

                  const content = (
                    <Card
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`border-border flex cursor-pointer items-start gap-3.5 p-4 shadow-xs transition-all ${
                        isUnread
                          ? "bg-card border-primary/40 ring-primary/20 ring-1"
                          : "bg-muted/30 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="bg-background border-border mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border">
                        {getKindIcon(n.kind)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`truncate text-xs font-semibold ${
                              isUnread ? "text-foreground font-bold" : "text-foreground"
                            }`}
                          >
                            {rendered.title}
                          </h4>
                          <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                            {new Date(n.created_at).toLocaleTimeString("en-PK", {
                              timeZone: "Asia/Karachi",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {rendered.body}
                        </p>
                        {orderId && (
                          <div className="text-primary flex items-center gap-1 pt-1 text-[11px] font-medium">
                            <span>View order progress</span>
                            <ArrowRight className="size-3" />
                          </div>
                        )}
                      </div>

                      {isUnread && (
                        <span className="bg-primary size-2 shrink-0 self-center rounded-full" />
                      )}
                    </Card>
                  );

                  if (orderId) {
                    return (
                      <Link key={n.id} href={`/app/orders/${orderId}`}>
                        {content}
                      </Link>
                    );
                  }

                  return <div key={n.id}>{content}</div>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
