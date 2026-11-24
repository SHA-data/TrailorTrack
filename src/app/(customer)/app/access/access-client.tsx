"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  KeyRound,
  ShieldCheck,
  Clock,
  AlertTriangle,
  History,
  Store,
  ChevronDown,
  ChevronUp,
  Activity,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { respondToConsentAction, revokeConsentAction } from "@/lib/access/actions";
import { accessContent } from "@/lib/content/access-content";
import type { ConsentScope } from "@/types/database";

export interface PendingRequestItem {
  consent_id: string;
  shop_id: string;
  shop_name: string;
  shop_city: string | null;
  shop_address: string | null;
  shop_phone: string | null;
  requested_scopes: ConsentScope[];
  created_at: string;
}

export interface AccessHistoryItem {
  consent_id: string;
  shop_id: string;
  shop_name: string;
  shop_city: string | null;
  shop_phone: string | null;
  status: "active" | "expired" | "declined" | "revoked";
  scopes: ConsentScope[];
  requested_scopes: ConsentScope[];
  granted_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  responded_at: string | null;
}

export interface ActivityLogItem {
  id: string;
  shop_name: string;
  action: "viewed_profile" | "viewed_measurements" | "viewed_family";
  created_at: string;
}

interface AccessClientProps {
  pendingRequests: PendingRequestItem[];
  accessList: AccessHistoryItem[];
  activityLogs: ActivityLogItem[];
  openOrdersShopIds?: string[];
}

export function AccessClient({
  pendingRequests,
  accessList,
  activityLogs,
  openOrdersShopIds = [],
}: AccessClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"requests" | "active" | "activity">("requests");
  const [isPending, startTransition] = useTransition();

  // Approve dialog state
  const [approvingRequest, setApprovingRequest] = useState<PendingRequestItem | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["measurements"]);
  const [durationDays, setDurationDays] = useState<number>(30);

  // Revoke dialog state
  const [revokingConsent, setRevokingConsent] = useState<AccessHistoryItem | null>(null);

  // History collapse
  const [showHistory, setShowHistory] = useState(false);

  // Auto-refresh every 20 seconds & on focus
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      if (!document.hidden && isMounted) {
        router.refresh();
      }
    }, 20000);

    const onVisibility = () => {
      if (!document.hidden && isMounted) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  const activeConsents = accessList.filter((item) => item.status === "active");
  const pastConsents = accessList.filter((item) => item.status !== "active");

  const handleOpenApprove = (req: PendingRequestItem) => {
    setApprovingRequest(req);
    setSelectedScopes([...req.requested_scopes]);
    setDurationDays(30);
  };

  const handleConfirmApprove = () => {
    if (!approvingRequest) return;
    startTransition(async () => {
      const res = await respondToConsentAction(
        approvingRequest.consent_id,
        "approve",
        selectedScopes,
        durationDays
      );
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        setApprovingRequest(null);
        router.refresh();
      }
    });
  };

  const handleConfirmDecline = (consentId: string) => {
    startTransition(async () => {
      const res = await respondToConsentAction(consentId, "decline");
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        router.refresh();
      }
    });
  };

  const handleConfirmRevoke = () => {
    if (!revokingConsent) return;
    startTransition(async () => {
      const res = await revokeConsentAction(revokingConsent.consent_id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        setRevokingConsent(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-primary font-serif text-3xl font-bold tracking-tight">
          {accessContent.access.title}
        </h1>
        <p className="text-muted-foreground mt-0.5 font-sans text-xs sm:text-sm">
          {accessContent.access.subtitle}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-border/80 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 font-sans text-sm font-medium transition-colors ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <span>{accessContent.access.tabs.requests}</span>
          {pendingRequests.length > 0 && (
            <Badge className="bg-accent text-accent-foreground h-4 px-1.5 py-0 text-[10px] font-bold">
              {pendingRequests.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 font-sans text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <span>{accessContent.access.tabs.active}</span>
          {activeConsents.length > 0 && (
            <span className="text-muted-foreground text-xs">({activeConsents.length})</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 font-sans text-sm font-medium transition-colors ${
            activeTab === "activity"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <span>{accessContent.access.tabs.activity}</span>
        </button>
      </div>

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="bg-card/50 border-dashed p-8 text-center">
              <KeyRound className="text-muted-foreground/60 mx-auto mb-3 size-10" />
              <p className="text-foreground font-serif text-lg font-semibold">
                No Pending Requests
              </p>
              <p className="text-muted-foreground mx-auto mt-1 max-w-md font-sans text-xs">
                {accessContent.access.emptyRequests}
              </p>
            </Card>
          ) : (
            pendingRequests.map((req) => (
              <Card key={req.consent_id} className="border-border bg-card p-5 shadow-xs">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Store className="text-accent size-4" />
                      <h3 className="text-foreground font-serif text-lg font-bold">
                        {req.shop_name}
                      </h3>
                      <Badge variant="outline" className="text-muted-foreground text-[10px]">
                        {req.shop_city || "Pakistan"}
                      </Badge>
                    </div>
                    {req.shop_address && (
                      <p className="text-muted-foreground text-xs">{req.shop_address}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-muted-foreground mr-1 text-xs">
                        Requests access to:
                      </span>
                      {req.requested_scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[11px] capitalize">
                          {s === "measurements" ? "Measurements & Family" : s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirmDecline(req.consent_id)}
                      disabled={isPending}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenApprove(req)}
                      disabled={isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs"
                    >
                      <Check className="size-3.5" />
                      <span>Review & Approve</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE & PAST CONSENTS */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {activeConsents.length === 0 ? (
            <Card className="bg-card/50 border-dashed p-8 text-center">
              <ShieldCheck className="text-muted-foreground/60 mx-auto mb-3 size-10" />
              <p className="text-foreground font-serif text-lg font-semibold">No Active Tailors</p>
              <p className="text-muted-foreground mx-auto mt-1 max-w-md font-sans text-xs">
                {accessContent.access.emptyActive}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activeConsents.map((item) => (
                <Card key={item.consent_id} className="border-border bg-card space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-foreground font-serif text-lg font-bold">
                        {item.shop_name}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {item.shop_city ? `${item.shop_city} • ` : ""}
                        {item.shop_phone || ""}
                      </p>
                    </div>
                    <Badge className="border-green-200 bg-green-600/10 text-[10px] text-green-700">
                      Active
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.scopes.map((s) => (
                      <Badge key={s} variant="outline" className="text-[11px] capitalize">
                        {s === "measurements" ? "Measurements & Family" : s}
                      </Badge>
                    ))}
                  </div>

                  <div className="border-border/60 text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="text-accent size-3.5" />
                      <span>Expires: {item.expires_at ? item.expires_at.slice(0, 10) : "N/A"}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokingConsent(item)}
                      className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    >
                      Revoke Access
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Past History Accordion */}
          {pastConsents.length > 0 && (
            <div className="border-border/80 bg-card/40 overflow-hidden rounded-xl border">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between p-4 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="size-4" />
                  <span>Access History ({pastConsents.length} previous permissions)</span>
                </div>
                {showHistory ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>

              {showHistory && (
                <div className="border-border/80 divide-border/60 space-y-3 divide-y border-t p-4">
                  {pastConsents.map((item) => (
                    <div
                      key={item.consent_id}
                      className="flex items-center justify-between pt-3 first:pt-0"
                    >
                      <div>
                        <p className="text-foreground font-serif text-sm font-bold">
                          {item.shop_name}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {item.status.toUpperCase()} •{" "}
                          {item.responded_at ? item.responded_at.slice(0, 10) : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVITY LOG */}
      {activeTab === "activity" && (
        <Card className="border-border bg-card p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-primary flex items-center gap-2 font-serif text-lg">
              <Activity className="text-accent size-4" />
              <span>Tailor Access Audit Log</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Every instance a master tailor reviews your measurements is securely audited below.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activityLogs.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-xs">
                {accessContent.access.emptyActivity}
              </p>
            ) : (
              <div className="divide-border/60 space-y-3 divide-y">
                {activityLogs.map((log) => {
                  const actionText =
                    log.action === "viewed_measurements"
                      ? "viewed your body measurements"
                      : log.action === "viewed_family"
                        ? "viewed family member measurements"
                        : "viewed your passport profile";
                  return (
                    <div key={log.id} className="flex items-start justify-between pt-3 first:pt-0">
                      <div className="space-y-0.5">
                        <p className="text-foreground text-xs font-semibold">
                          {log.shop_name}{" "}
                          <span className="text-muted-foreground font-normal">{actionText}</span>
                        </p>
                        <p className="text-muted-foreground/70 text-[11px]">
                          {new Date(log.created_at).toLocaleString("en-PK", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-accent text-[10px]">
                        Audited
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* APPROVE MODAL */}
      <Dialog open={!!approvingRequest} onOpenChange={(open) => !open && setApprovingRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif text-lg">
              {accessContent.access.approveTitle}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-sans text-xs">
              {accessContent.access.approveSubtitle}
            </DialogDescription>
          </DialogHeader>

          {approvingRequest && (
            <div className="space-y-4 py-2">
              <div className="bg-primary/5 border-accent/20 rounded-lg border p-3">
                <p className="text-primary text-xs font-semibold">{approvingRequest.shop_name}</p>
                <p className="text-muted-foreground text-[11px]">
                  {approvingRequest.shop_city || "Pakistan"}
                </p>
              </div>

              {/* Shared profile details disclosure */}
              <div className="bg-muted/40 text-muted-foreground rounded-md border p-2.5 text-[11px] leading-relaxed">
                {accessContent.gateway.sharedFieldsDisclosure}
              </div>

              {/* Scope checkboxes */}
              <div className="space-y-2">
                <label className="text-foreground block text-xs font-semibold">
                  Permissions to Grant:
                </label>
                {approvingRequest.requested_scopes.map((scope) => {
                  const isChecked = selectedScopes.includes(scope);
                  return (
                    <label
                      key={scope}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-2.5 rounded-md border p-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            if (selectedScopes.length > 1) {
                              setSelectedScopes(selectedScopes.filter((s) => s !== scope));
                            }
                          } else {
                            setSelectedScopes([...selectedScopes, scope]);
                          }
                        }}
                        className="border-input text-primary focus:ring-primary rounded"
                      />
                      <span>{accessContent.access.scopes[scope] || scope}</span>
                    </label>
                  );
                })}
              </div>

              {/* Duration select */}
              <div className="space-y-1.5">
                <label className="text-foreground block text-xs font-semibold">
                  Access Duration:
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-xs shadow-xs"
                >
                  <option value={7}>{accessContent.access.durations[7]}</option>
                  <option value={30}>{accessContent.access.durations[30]}</option>
                  <option value={90}>{accessContent.access.durations[90]}</option>
                  <option value={365}>{accessContent.access.durations[365]}</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApprovingRequest(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmApprove}
              disabled={isPending || selectedScopes.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Approving..." : "Confirm & Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REVOKE MODAL */}
      <Dialog open={!!revokingConsent} onOpenChange={(open) => !open && setRevokingConsent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-destructive mb-1 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              <DialogTitle className="font-serif text-lg">Revoke Tailor Access?</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs">
              Are you sure you want to revoke access for{" "}
              <strong>{revokingConsent?.shop_name}</strong>? They will immediately lose access to
              your live measurements and cannot create new orders.
              {revokingConsent && openOrdersShopIds.includes(revokingConsent.shop_id) && (
                <span className="mt-2 block rounded border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] font-medium text-amber-800">
                  Notice: You have active orders with this shop. The shop will still be able to
                  fulfill and update these existing orders until delivered.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokingConsent(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmRevoke}
              disabled={isPending}
            >
              {isPending ? "Revoking..." : "Yes, Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
