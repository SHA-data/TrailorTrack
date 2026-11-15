"use client";

import React, { useEffect, useState } from "react";
import { getPendingRequestsCountAction } from "@/lib/access/actions";

interface AccessBadgeProps {
  initialCount?: number;
}

export function AccessBadge({ initialCount = 0 }: AccessBadgeProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let isMounted = true;

    async function checkPending() {
      if (document.hidden) return;
      try {
        const count = await getPendingRequestsCountAction();
        if (isMounted) setCount(count);
      } catch {
        // Silent fail on network blip
      }
    }

    // Interval every 20 seconds
    const interval = setInterval(checkPending, 20000);

    // Refresh when user tabs back into the app
    const onVisibilityChange = () => {
      if (!document.hidden) {
        checkPending();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="bg-accent text-accent-foreground ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
      {count > 9 ? "9+" : count}
    </span>
  );
}
