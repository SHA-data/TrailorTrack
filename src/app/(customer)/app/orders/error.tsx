"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function CustomerOrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container max-w-lg px-4 py-16">
      <Card className="border-border bg-card space-y-4 p-6 text-center shadow-md">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-foreground font-serif text-lg">
            Unable to Load Orders
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs leading-relaxed">
            {error.message || "An unexpected error occurred while loading your orders."}
          </CardDescription>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={reset} className="flex-1 text-xs">
            Try Again
          </Button>
          <Button asChild variant="outline" className="flex-1 text-xs">
            <Link href="/app">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
