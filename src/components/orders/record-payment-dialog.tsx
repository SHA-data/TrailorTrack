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
import { formatPKR } from "@/lib/format";
import { recordPaymentAction } from "@/lib/orders/actions";
import { toast } from "sonner";
import { Banknote } from "lucide-react";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  totalPkr: number;
  paidPkr: number;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  orderId,
  totalPkr,
  paidPkr,
  onSuccess,
}: RecordPaymentDialogProps) {
  const balance = Math.max(0, totalPkr - paidPkr);
  const [amount, setAmount] = useState<string>(String(balance > 0 ? balance : ""));
  const [isPending, startTransition] = useTransition();

  const numAmount = parseInt(amount, 10) || 0;
  const isInvalid = numAmount <= 0 || numAmount > balance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    startTransition(async () => {
      const res = await recordPaymentAction({
        order_id: orderId,
        amount: numAmount,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Payment of ${formatPKR(numAmount)} recorded successfully`);
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
            <Banknote className="text-primary size-5" />
            <DialogTitle className="font-serif text-lg">Record Customer Payment</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            Record cash, bank transfer, or mobile wallet payment received from the customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Summary Box */}
          <div className="bg-muted/40 grid grid-cols-3 gap-2 rounded-lg border p-3 text-center">
            <div>
              <span className="text-muted-foreground text-[10px] uppercase">Order Total</span>
              <p className="text-foreground font-semibold">{formatPKR(totalPkr)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase">Already Paid</span>
              <p className="font-semibold text-emerald-700">{formatPKR(paidPkr)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase">Balance Due</span>
              <p className="text-foreground font-bold">{formatPKR(balance)}</p>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount" className="text-xs">
              Payment Amount (PKR):
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs">
                PKR
              </span>
              <Input
                id="payment-amount"
                type="number"
                inputMode="numeric"
                min={1}
                max={balance}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="pl-12 text-sm"
                required
              />
            </div>
            {numAmount > balance && (
              <p className="text-destructive text-[11px]">
                Payment cannot exceed remaining balance of {formatPKR(balance)}.
              </p>
            )}
          </div>

          {/* Quick preset chips */}
          {balance > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setAmount(String(balance))}
              >
                Full Balance ({formatPKR(balance)})
              </Button>
              {balance > 1000 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setAmount(String(Math.round(balance / 2)))}
                >
                  Half ({formatPKR(Math.round(balance / 2))})
                </Button>
              )}
            </div>
          )}

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
              {isPending ? "Recording..." : `Confirm Payment (${formatPKR(numAmount)})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
