"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Trash2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { exportMyDataAction, deleteMyAccountAction } from "@/lib/account/actions";

interface DataControlCardProps {
  role: "customer" | "tailor";
  userEmail: string;
}

export function DataControlCard({ role, userEmail }: DataControlCardProps) {
  const router = useRouter();
  const [isExporting, startExport] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hasOpenOrdersError, setHasOpenOrdersError] = useState(false);

  const ordersHref = role === "customer" ? "/app/orders" : "/tailor/orders";

  const handleDownloadData = () => {
    startExport(async () => {
      const res = await exportMyDataAction();
      if (res.error || !res.data) {
        toast.error(res.error ?? "Failed to download data.");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `tailortrack-data-${today}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Your data download has started.");
    });
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setHasOpenOrdersError(false);

    startDelete(async () => {
      const res = await deleteMyAccountAction(confirmEmail);
      if (res.success) {
        setIsDialogOpen(false);
        toast.success("Your account has been deleted.");
        router.replace("/");
        router.refresh();
        return;
      }

      if (res.errorCode === "open_orders_exist") {
        setHasOpenOrdersError(true);
      }
      setDeleteError(res.error ?? "Could not delete your account.");
    });
  };

  return (
    <>
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground font-serif text-lg">Your data</CardTitle>
          <CardDescription className="font-sans text-xs">
            {role === "customer"
              ? "Download a copy of your measurements, family profiles, orders, and consent history, or permanently delete your account."
              : "Download a copy of your shop profile, consents, and order records, or permanently delete your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadData}
            disabled={isExporting || isDeleting}
            className="gap-2 font-sans"
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span>Download my data</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirmEmail("");
              setDeleteError(null);
              setHasOpenOrdersError(false);
              setIsDialogOpen(true);
            }}
            disabled={isExporting || isDeleting}
            className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2 font-sans"
          >
            <Trash2 className="size-4" />
            <span>Delete my account</span>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 font-serif text-xl">
              <AlertTriangle className="size-5 shrink-0" />
              <span>Delete my account</span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-muted-foreground space-y-2 pt-2 font-sans text-xs leading-relaxed">
                {role === "customer" ? (
                  <>
                    <p>
                      This permanently deletes your profile, QR passport, family profiles,
                      measurement sets, consent history, access log entries, notifications, and
                      closed orders.
                    </p>
                    <p className="text-foreground font-medium">
                      Orders that are still open (received, cutting, stitching, or ready) must be
                      finished or cancelled first.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      This permanently deletes your tailor profile, shop listing, active consents,
                      and access log entries. Closed orders remain visible to customers using the
                      shop name, city, and phone stored on those orders.
                    </p>
                    <p className="text-foreground font-medium">
                      Orders that are still open (received, cutting, stitching, or ready) must be
                      finished or cancelled first.
                    </p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-delete-email" className="text-xs font-medium">
                Type <span className="font-mono font-semibold">{userEmail}</span> to confirm
              </Label>
              <Input
                id="confirm-delete-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={userEmail}
                autoComplete="off"
                required
                disabled={isDeleting}
              />
            </div>

            {deleteError && (
              <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs">
                <p>{deleteError}</p>
                {hasOpenOrdersError && (
                  <Link
                    href={ordersHref}
                    onClick={() => setIsDialogOpen(false)}
                    className="mt-1.5 inline-flex items-center gap-1 font-semibold underline"
                  >
                    <span>Go to orders</span>
                    <ArrowRight className="size-3" />
                  </Link>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={
                  isDeleting ||
                  confirmEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase()
                }
                className="gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                <span>Permanently delete</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
