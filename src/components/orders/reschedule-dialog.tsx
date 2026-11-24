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
import { formatKarachiDate, getKarachiTodayDate } from "@/lib/format";
import { rescheduleOrderAction } from "@/lib/orders/actions";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentDeliveryDate: string;
  onSuccess?: () => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  orderId,
  currentDeliveryDate,
  onSuccess,
}: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState(currentDeliveryDate.slice(0, 10));
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const minDate = getKarachiTodayDate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    startTransition(async () => {
      const res = await rescheduleOrderAction({
        order_id: orderId,
        new_date: newDate,
        note: note.trim() || null,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Delivery rescheduled to ${formatKarachiDate(newDate)}`);
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
            <Calendar className="text-primary size-5" />
            <DialogTitle className="font-serif text-lg">Reschedule Delivery</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            Update the committed delivery date. The customer will receive an alert with the new
            date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="bg-muted/40 rounded-lg border p-3">
            <span className="text-muted-foreground text-[10px] uppercase">Current Delivery</span>
            <p className="text-foreground font-semibold">
              {formatKarachiDate(currentDeliveryDate)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-date" className="text-xs">
              New Delivery Date:
            </Label>
            <Input
              id="new-date"
              type="date"
              min={minDate}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reschedule-note" className="text-xs">
              Reason / Message for Customer (Optional):
            </Label>
            <Textarea
              id="reschedule-note"
              placeholder="e.g. Hand-embroidery requires 2 additional days..."
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
              disabled={isPending || !newDate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              {isPending ? "Rescheduling..." : "Save Delivery Date"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
