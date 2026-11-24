"use client";

import React, { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import {
  Download,
  Printer,
  Share2,
  Copy,
  RefreshCw,
  ShieldCheck,
  Check,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { rotateQrTokenAction } from "@/lib/access/actions";
import { accessContent } from "@/lib/content/access-content";

interface PassportCardProps {
  fullName: string;
  city: string | null;
  fitCategory: string | null;
  qrToken: string;
  qrSvg: string;
  passportUrl: string;
}

export function PassportCard({
  fullName,
  city,
  fitCategory,
  qrToken,
  qrSvg,
  passportUrl,
}: PassportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(passportUrl);
      setCopied(true);
      toast.success("Passport link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSavePng = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 3,
        backgroundColor: "#1F4D3A",
      });
      const link = document.createElement("a");
      link.download = `TailorTrack-Passport-${fullName.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Passport image saved!");
    } catch {
      toast.error("Failed to generate passport image");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = accessContent.passport.whatsappShareText(passportUrl, fullName);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleResetToken = () => {
    startTransition(async () => {
      const res = await rotateQrTokenAction();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(accessContent.passport.resetSuccess);
        setIsResetOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="border-accent/40 bg-card text-accent mb-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>{accessContent.passport.badge}</span>
          </div>
          <h1 className="text-primary font-serif text-3xl font-bold tracking-tight">
            {accessContent.passport.title}
          </h1>
          <p className="text-muted-foreground mt-0.5 font-sans text-xs sm:text-sm">
            {accessContent.passport.subtitle}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsResetOpen(true)}
          className="border-destructive/30 text-destructive hover:bg-destructive/10 w-fit gap-1.5 font-sans text-xs"
        >
          <RefreshCw className="size-3.5" />
          <span>{accessContent.passport.resetQr}</span>
        </Button>
      </div>

      {/* The Printable / Saveable Passport Card */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="passport-printable-card border-accent/40 relative w-full max-w-sm overflow-hidden rounded-2xl border-2 bg-[#1F4D3A] p-6 text-[#F7F1E3] shadow-2xl"
          style={{ minHeight: "420px" }}
        >
          {/* Subtle Islamic / Geometric Watermark Ornament */}
          <div className="border-accent/15 pointer-events-none absolute -top-12 -right-12 size-48 rounded-full border-8" />
          <div className="border-accent/15 pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full border-8" />

          {/* Card Top Brand */}
          <div className="border-accent/30 flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-accent font-serif text-lg font-bold tracking-wider">
                TAILORTRACK
              </span>
              <p className="text-[10px] tracking-widest text-[#F7F1E3]/70 uppercase">
                Digital Tailoring Passport
              </p>
            </div>
            <Badge className="bg-accent text-accent-foreground font-sans text-[10px] font-bold tracking-wider uppercase">
              {fitCategory || "Bespoke"}
            </Badge>
          </div>

          {/* QR Code Frame */}
          <div className="my-5 flex flex-col items-center justify-center">
            <div className="flex size-52 items-center justify-center rounded-xl bg-white p-3 shadow-md">
              <div
                className="size-full [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
            <p className="mt-2.5 font-mono text-[11px] tracking-widest text-[#F7F1E3]/80">
              TOKEN: {qrToken.slice(0, 8).toUpperCase()}...
            </p>
          </div>

          {/* Customer Identity Footer */}
          <div className="border-accent/30 border-t pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-lg leading-tight font-bold">{fullName}</p>
                <p className="text-xs text-[#F7F1E3]/70">
                  {city ? `${city}, Pakistan` : "Pakistan"}
                </p>
              </div>
              <div className="text-accent flex items-center gap-1.5 text-[11px] font-medium">
                <ShieldCheck className="size-4" />
                <span>Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSavePng}
          disabled={isDownloading}
          className="bg-card hover:bg-muted gap-2 font-sans text-xs"
        >
          <Download className="text-primary size-3.5" />
          <span>{isDownloading ? "Saving..." : accessContent.passport.savePng}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="bg-card hover:bg-muted gap-2 font-sans text-xs"
        >
          <Printer className="text-primary size-3.5" />
          <span>{accessContent.passport.printCard}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShareWhatsApp}
          className="bg-card hover:bg-muted gap-2 font-sans text-xs"
        >
          <Share2 className="size-3.5 text-[#25D366]" />
          <span>WhatsApp</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="bg-card hover:bg-muted gap-2 font-sans text-xs"
        >
          {copied ? (
            <Check className="size-3.5 text-green-600" />
          ) : (
            <Copy className="text-primary size-3.5" />
          )}
          <span>{copied ? "Copied!" : accessContent.passport.copyLink}</span>
        </Button>
      </div>

      {/* Reset Token Confirmation Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-destructive mb-1 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              <DialogTitle className="font-serif text-lg">Reset Passport QR Code?</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground space-y-2 pt-1 font-sans text-xs">
              <span className="block">{accessContent.passport.resetWarning}</span>
              <span className="text-foreground block font-medium">
                Are you sure you want to invalidate your current QR code?
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleResetToken} disabled={isPending}>
              {isPending ? "Resetting..." : "Yes, Reset My QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
