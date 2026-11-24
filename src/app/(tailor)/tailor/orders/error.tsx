"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function TailorOrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tailor orders error:", error);
  }, [error]);

  return (
    <div className="border-destructive/30 bg-card mx-auto max-w-md rounded-2xl border p-8 text-center shadow-sm">
      <div className="bg-destructive/10 text-destructive mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
        <AlertCircle className="size-6" />
      </div>
      <h2 className="text-foreground font-serif text-xl font-semibold">
        Unable to load orders board
      </h2>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        We encountered a problem loading your shop stitching orders.
      </p>
      <Button onClick={reset} variant="outline" size="sm" className="mt-5 gap-1.5 text-xs">
        <RotateCcw className="size-3.5" />
        <span>Try Again</span>
      </Button>
    </div>
  );
}
