"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_META } from "@/lib/orders/status";
import { updateOrderStatusAction } from "@/lib/orders/actions";
import { formatPKR } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface StatusActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentStatus: OrderStatus;
  targetStatus: OrderStatus | null;
  totalPkr: number;
  paidPkr: number;
  onSuccess?: () => void;
}

export function StatusActionDialog({
  open,
  onOpenChange,
  orderId,
  currentStatus,
  targetStatus,
  totalPkr,
  paidPkr,
  onSuccess,
}: StatusActionDialogProps) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!targetStatus) return null;

  const targetMeta = ORDER_STATUS_META[targetStatus];
  const balance = totalPkr - paidPkr;
  const hasUnpaidBalance = balance > 0;
  const isDelivered = targetStatus === "delivered";
  const isCancelled = targetStatus === "cancelled";

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        order_id: orderId,
        new_status: targetStatus,
        note: note.trim() || null,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Milestone updated to ${targetMeta.label}`);
        setNote("");
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isCancelled ? (
              <AlertTriangle className="text-destructive size-5" />
            ) : (
              <CheckCircle2 className="text-primary size-5" />
            )}
            <DialogTitle className="font-serif text-lg">
              {isCancelled
                ? "Cancel Order"
                : isDelivered
                  ? "Mark as Delivered"
                  : `Update Status: ${targetMeta.label}`}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            {isCancelled
              ? "Are you sure you want to cancel this order? This action is terminal and will notify the customer."
              : isDelivered
                ? "Marking this order as delivered closes active production. The customer will be notified."
                : `Advance this order from ${currentStatus} to ${targetMeta.label}. The customer will be alerted with this milestone.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Warning if marking delivered with unpaid balance */}
          {isDelivered && hasUnpaidBalance && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div className="space-y-0.5">
                <p className="font-semibold">Unpaid Balance Notice</p>
                <p className="text-[11px] leading-relaxed">
                  This order still has an outstanding balance of{" "}
                  <strong>{formatPKR(balance)}</strong>. You can still deliver the garment and
                  record payment later.
                </p>
              </div>
            </div>
          )}

          {/* Optional reason / craftsman note */}
          <div className="space-y-1.5">
            <Label htmlFor="status-note" className="text-xs">
              Craftsman Note (Optional, shared with customer):
            </Label>
            <Textarea
              id="status-note"
              placeholder="e.g. Master cutting completed, trial fitting scheduled..."
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              maxLength={280}
              className="resize-none text-xs"
              rows={3}
            />
            <p className="text-muted-foreground text-right text-[10px]">
              {note.length}/280 characters
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isCancelled ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
            className="text-xs"
          >
            {isPending
              ? "Updating..."
              : isCancelled
                ? "Confirm Cancellation"
                : isDelivered
                  ? "Confirm Delivery"
                  : `Move to ${targetMeta.shortLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
