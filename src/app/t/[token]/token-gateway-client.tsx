"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Clock, AlertCircle, QrCode, ArrowRight, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { requestAccessAction, getMyConsentStatusAction } from "@/lib/access/actions";
import { accessContent } from "@/lib/content/access-content";

export interface LookupData {
  masked_name: string;
  status: "none" | "pending" | "active" | "expired" | "declined" | "revoked";
  consent_id: string | null;
  cooldown_until: string | null;
}

interface TokenGatewayClientProps {
  token: string;
  viewerState: "logged_out" | "customer" | "tailor";
  initialLookup: LookupData | null;
}

export function TokenGatewayClient({ token, viewerState, initialLookup }: TokenGatewayClientProps) {
  const router = useRouter();
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["measurements", "orders"]);
  const [isPending, startTransition] = useTransition();
  const [consentId, setConsentId] = useState<string | null>(initialLookup?.consent_id || null);
  const [currentStatus, setCurrentStatus] = useState<string>(initialLookup?.status || "none");

  // If already active on load, redirect to customer profile immediately
  useEffect(() => {
    if (viewerState === "tailor" && initialLookup?.status === "active" && consentId) {
      getMyConsentStatusAction(consentId).then((data) => {
        if (data?.customer_id) {
          router.replace(`/tailor/customers/${data.customer_id}`);
        }
      });
    }
  }, [viewerState, initialLookup, consentId, router]);

  // Polling for pending status (every 4 seconds)
  useEffect(() => {
    if (viewerState !== "tailor" || currentStatus !== "pending" || !consentId) {
      return;
    }

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const data = await getMyConsentStatusAction(consentId);
        if (!isMounted || !data) return;

        if (data.status === "active" && data.customer_id) {
          toast.success("Access approved by customer!");
          router.replace(`/tailor/customers/${data.customer_id}`);
        } else if (data.status !== "pending") {
          setCurrentStatus(data.status);
        }
      } catch {
        // Silently retry on next tick
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [viewerState, currentStatus, consentId, router]);

  const handleRequestAccess = () => {
    startTransition(async () => {
      const res = await requestAccessAction(token, selectedScopes);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.consentId) {
        setConsentId(res.consentId);
        setCurrentStatus("pending");
        toast.success("Access request sent to customer!");
      }
    });
  };

  // 1. LOGGED OUT VIEW
  if (viewerState === "logged_out") {
    return (
      <Card className="border-border bg-card mx-auto max-w-md space-y-4 p-6 text-center shadow-lg">
        <div className="bg-primary/10 border-accent/40 text-primary mx-auto flex size-14 items-center justify-center rounded-full border">
          <QrCode className="text-accent size-7" />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-primary font-serif text-2xl">
            {accessContent.gateway.loggedOutTitle}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs leading-relaxed">
            {accessContent.gateway.loggedOutMessage}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={`/login?redirectTo=/t/${token}`}>Tailor Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // 2. LOGGED IN AS CUSTOMER VIEW
  if (viewerState === "customer") {
    return (
      <Card className="border-border bg-card mx-auto max-w-md space-y-4 p-6 text-center shadow-lg">
        <div className="bg-primary/10 border-accent/40 text-primary mx-auto flex size-14 items-center justify-center rounded-full border">
          <ShieldCheck className="text-accent size-7" />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-primary font-serif text-2xl">
            Digital Passport Gateway
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs leading-relaxed">
            {accessContent.gateway.customerMessage}
          </CardDescription>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/app/passport">Open My Passport QR</Link>
        </Button>
      </Card>
    );
  }

  // 3. TAILOR VIEW: TOKEN INVALID OR EXPIRED
  if (!initialLookup) {
    return (
      <Card className="border-border bg-card mx-auto max-w-md space-y-4 p-6 text-center shadow-lg">
        <div className="bg-destructive/10 border-destructive/30 text-destructive mx-auto flex size-14 items-center justify-center rounded-full border">
          <AlertCircle className="size-7" />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-foreground font-serif text-xl">Passport Not Found</CardTitle>
          <CardDescription className="text-muted-foreground text-xs leading-relaxed">
            This passport token is invalid or has been reset by the customer. Please ask the
            customer to display their latest QR code.
          </CardDescription>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/tailor/scan">Scan Again</Link>
        </Button>
      </Card>
    );
  }

  // 4. TAILOR VIEW: PENDING APPROVAL (LIVE WAITING)
  if (currentStatus === "pending") {
    return (
      <Card className="border-border bg-card mx-auto max-w-md space-y-5 p-6 text-center shadow-lg">
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <div className="border-accent/30 border-t-accent absolute inset-0 animate-spin rounded-full border-4" />
          <Clock className="text-accent size-7" />
        </div>
        <div className="space-y-1.5">
          <Badge className="bg-accent/20 text-accent font-mono text-[10px] tracking-wider uppercase">
            Awaiting Customer Approval
          </Badge>
          <CardTitle className="text-primary font-serif text-2xl">
            {initialLookup.masked_name}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs leading-relaxed">
            {accessContent.gateway.pendingSubtitle}
          </CardDescription>
        </div>
        <div className="bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs">
          Checking status automatically every 4 seconds...
        </div>
        <Button asChild variant="outline" size="sm" className="w-full text-xs">
          <Link href="/tailor/customers">View My Customer List</Link>
        </Button>
      </Card>
    );
  }

  // 5. TAILOR VIEW: DECLINED WITH COOLDOWN
  if (currentStatus === "declined") {
    return (
      <Card className="border-border bg-card mx-auto max-w-md space-y-4 p-6 text-center shadow-lg">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600">
          <Lock className="size-7" />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-foreground font-serif text-xl">
            {accessContent.gateway.cooldownTitle}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs leading-relaxed">
            {accessContent.gateway.cooldownSubtitle}
          </CardDescription>
          {initialLookup.cooldown_until && (
            <p className="text-muted-foreground pt-1 font-mono text-xs">
              Cooldown ends: {new Date(initialLookup.cooldown_until).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/tailor/scan">Return to Scanner</Link>
        </Button>
      </Card>
    );
  }

  // 6. TAILOR VIEW: NONE (REQUEST ACCESS FORM)
  return (
    <Card className="border-border bg-card mx-auto max-w-md space-y-5 p-6 shadow-lg">
      <CardHeader className="space-y-1.5 p-0 text-center">
        <div className="border-accent/40 bg-card text-accent mx-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          <span>Customer Found</span>
        </div>
        <CardTitle className="text-primary font-serif text-2xl">
          {initialLookup.masked_name}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          {accessContent.gateway.requestAccessSubtitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-0">
        <label className="text-foreground block text-xs font-semibold">
          Select Required Scopes:
        </label>

        <label className="border-input hover:bg-muted/50 flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors">
          <input
            type="checkbox"
            checked={selectedScopes.includes("measurements")}
            onChange={() => {
              if (selectedScopes.includes("measurements")) {
                if (selectedScopes.length > 1) {
                  setSelectedScopes(selectedScopes.filter((s) => s !== "measurements"));
                }
              } else {
                setSelectedScopes([...selectedScopes, "measurements"]);
              }
            }}
            className="border-input text-primary focus:ring-primary mt-0.5 rounded"
          />
          <div>
            <p className="text-foreground text-xs font-bold">Measurements & Family</p>
            <p className="text-muted-foreground text-[11px]">
              View body measurements for Shalwar Kameez, Kurtas, Waistcoats, and family members.
            </p>
          </div>
        </label>

        <label className="border-input hover:bg-muted/50 flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors">
          <input
            type="checkbox"
            checked={selectedScopes.includes("orders")}
            onChange={() => {
              if (selectedScopes.includes("orders")) {
                if (selectedScopes.length > 1) {
                  setSelectedScopes(selectedScopes.filter((s) => s !== "orders"));
                }
              } else {
                setSelectedScopes([...selectedScopes, "orders"]);
              }
            }}
            className="border-input text-primary focus:ring-primary mt-0.5 rounded"
          />
          <div>
            <p className="text-foreground text-xs font-bold">Orders & History</p>
            <p className="text-muted-foreground text-[11px]">
              Create stitching orders and track milestone delivery statuses.
            </p>
          </div>
        </label>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-0 pt-2">
        <Button
          onClick={handleRequestAccess}
          disabled={isPending || selectedScopes.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 text-xs font-semibold"
        >
          {isPending ? "Sending Request..." : "Send Permission Request"}
          <ArrowRight className="size-3.5" />
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full text-xs">
          <Link href="/tailor/scan">Cancel & Scan Another</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
