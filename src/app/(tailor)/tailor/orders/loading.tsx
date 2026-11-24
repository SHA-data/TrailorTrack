import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TailorOrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="rounded-xl border p-3">
        <Skeleton className="h-8 w-full" />
      </div>

      <div className="hidden grid-cols-4 gap-4 lg:grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border p-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-3 lg:hidden">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
