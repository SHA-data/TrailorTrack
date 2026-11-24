"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  initialCount?: number;
  className?: string;
}

export function NotificationBell({ initialCount = 0, className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(initialCount);

  // Poll every 60s while visible
  useEffect(() => {
    let isMounted = true;

    const fetchCount = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/notifications/count");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.count === "number") {
            setUnreadCount(data.count);
          }
        }
      } catch {
        // Silently retry on next tick
      }
    };

    const interval = setInterval(fetchCount, 60000);
    const handleVisibility = () => {
      if (!document.hidden) fetchCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn("text-muted-foreground hover:text-foreground relative size-9", className)}
      aria-label="View notifications"
    >
      <Link href="/app/notifications">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="bg-accent text-accent-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
