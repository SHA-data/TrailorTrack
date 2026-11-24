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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPKR } from "@/lib/format";
import { changeOrderPriceAction } from "@/lib/orders/actions";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface ChangePriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentTotal: number;
  paidPkr: number;
  onSuccess?: () => void;
}

export function ChangePriceDialog({
  open,
  onOpenChange,
  orderId,
  currentTotal,
  paidPkr,
  onSuccess,
}: ChangePriceDialogProps) {
  const [newTotal, setNewTotal] = useState(String(currentTotal));
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const numNewTotal = parseInt(newTotal, 10) || 0;
  const isInvalid = numNewTotal < paidPkr || numNewTotal < 1 || numNewTotal > 10000000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    startTransition(async () => {
      const res = await changeOrderPriceAction({
        order_id: orderId,
        new_total: numNewTotal,
        note: note.trim() || null,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Order total updated to ${formatPKR(numNewTotal)}`);
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
            <DollarSign className="text-primary size-5" />
            <DialogTitle className="font-serif text-lg">Adjust Order Price</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            Update the total price for additions, design changes, or discounts. The customer will be
            notified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="bg-muted/40 grid grid-cols-2 gap-2 rounded-lg border p-3 text-center">
            <div>
              <span className="text-muted-foreground text-[10px] uppercase">Current Total</span>
              <p className="text-foreground font-semibold">{formatPKR(currentTotal)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase">Already Paid</span>
              <p className="font-semibold text-emerald-700">{formatPKR(paidPkr)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-total" className="text-xs">
              New Total Price (PKR):
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs">
                PKR
              </span>
              <Input
                id="new-total"
                type="number"
                inputMode="numeric"
                min={paidPkr}
                max={10000000}
                step={1}
                value={newTotal}
                onChange={(e) => setNewTotal(e.target.value)}
                className="pl-12 text-sm"
                required
              />
            </div>
            {numNewTotal < paidPkr && (
              <p className="text-destructive text-[11px]">
                New total cannot be less than already paid amount of {formatPKR(paidPkr)}.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price-note" className="text-xs">
              Reason / Explanation (Optional):
            </Label>
            <Textarea
              id="price-note"
              placeholder="e.g. Added ban collar and lining fabric..."
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              maxLength={280}
              className="resize-none text-xs"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
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
              type="submit"
              size="sm"
              disabled={isPending || isInvalid}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              {isPending ? "Updating..." : "Update Total Price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
