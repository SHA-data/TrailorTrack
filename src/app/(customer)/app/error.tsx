"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Customer App Error:", error);
  }, [error]);

  return (
    <div className="border-destructive/20 bg-destructive/5 flex min-h-[400px] flex-col items-center justify-center rounded-2xl border p-8 text-center">
      <div className="bg-destructive/10 text-destructive mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-foreground font-serif text-xl font-medium">Something went wrong</h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        We encountered an error loading your tailoring dashboard. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
