"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";
import { toast } from "sonner";
import { Flashlight, AlertCircle, ArrowRight, Sparkles, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { accessContent } from "@/lib/content/access-content";

export function ScannerClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [manualToken, setManualToken] = useState("");

  const extractToken = (rawInput: string): string => {
    const trimmed = rawInput.trim();
    if (trimmed.includes("/t/")) {
      const parts = trimmed.split("/t/");
      return parts[1].split("?")[0].split("#")[0].trim();
    }
    // Reject arbitrary URLs that do not contain a /t/ passport path
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return "";
    }
    return trimmed;
  };

  const handleScannedData = useCallback(
    (scannedText: string) => {
      const token = extractToken(scannedText);
      if (token) {
        toast.success("Passport scanned! Opening...");
        if (scannerRef.current) {
          scannerRef.current.stop();
        }
        router.push(`/t/${token}`);
      }
    },
    [router]
  );

  useEffect(() => {
    let isCancelled = false;

    async function initScanner() {
      if (!videoRef.current) return;

      try {
        const hasCam = await QrScanner.hasCamera();
        if (!hasCam) {
          if (!isCancelled) {
            setCameraError("No camera found on this device.");
          }
          return;
        }

        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            if (result?.data) {
              handleScannedData(result.data);
            }
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current = qrScanner;
        await qrScanner.start();

        if (!isCancelled) {
          const flash = await qrScanner.hasFlash();
          setHasFlash(flash);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : "Could not access camera. Please allow camera permissions or enter passport link.";
          setCameraError(msg);
        }
      }
    }

    initScanner();

    return () => {
      isCancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [handleScannedData]);

  const handleToggleFlash = async () => {
    if (!scannerRef.current || !hasFlash) return;
    try {
      await scannerRef.current.toggleFlash();
      setIsFlashOn(scannerRef.current.isFlashOn());
    } catch {
      toast.error("Could not toggle flashlight");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extractToken(manualToken);
    if (!token) {
      toast.error("Please enter a valid token or passport link");
      return;
    }
    router.push(`/t/${token}`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="border-accent/40 bg-card text-accent mb-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold">
          <Sparkles className="size-3.5" />
          <span>Tailor Intake</span>
        </div>
        <h1 className="text-primary font-serif text-3xl font-bold tracking-tight">
          {accessContent.scanner.title}
        </h1>
        <p className="text-muted-foreground mt-0.5 font-sans text-xs sm:text-sm">
          {accessContent.scanner.subtitle}
        </p>
      </div>

      {/* Camera Viewport Card */}
      <Card className="border-border bg-card overflow-hidden shadow-md">
        <CardContent className="relative flex min-h-[320px] flex-col items-center justify-center bg-black p-0 sm:min-h-[400px]">
          {cameraError ? (
            <div className="max-w-sm space-y-3 p-8 text-center text-white">
              <AlertCircle className="mx-auto size-10 text-amber-400" />
              <p className="font-serif text-lg font-bold">Camera Unavailable</p>
              <p className="text-xs leading-relaxed text-zinc-300">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="max-h-[480px] w-full object-cover"
                playsInline
                muted
              />

              {/* Viewfinder Overlay Frame */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="border-accent/80 relative size-60 rounded-2xl border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] sm:size-72">
                  <div className="border-accent absolute top-2 left-2 size-4 border-t-2 border-l-2" />
                  <div className="border-accent absolute top-2 right-2 size-4 border-t-2 border-r-2" />
                  <div className="border-accent absolute bottom-2 left-2 size-4 border-b-2 border-l-2" />
                  <div className="border-accent absolute right-2 bottom-2 size-4 border-r-2 border-b-2" />
                </div>
              </div>

              {/* Camera Controls Bar */}
              {hasFlash && (
                <div className="absolute right-0 bottom-4 left-0 flex justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleFlash}
                    className="border-white/20 bg-black/60 text-xs text-white backdrop-blur-md hover:bg-black/80"
                  >
                    <Flashlight className="mr-1.5 size-3.5" />
                    <span>{isFlashOn ? "Turn Flash Off" : "Turn Flash On"}</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Link / Token Fallback Form */}
      <Card className="border-border bg-card p-5 shadow-xs">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-foreground flex items-center gap-2 font-serif text-base">
            <LinkIcon className="text-accent size-4" />
            <span>{accessContent.scanner.fallbackLabel}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            If scanning is slow or camera is restricted, paste the customer&apos;s full passport URL
            or token.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-2.5 sm:flex-row">
            <Input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder={accessContent.scanner.fallbackPlaceholder}
              className="bg-background font-mono text-xs"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!manualToken.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 gap-1.5 text-xs"
            >
              <span>{accessContent.scanner.lookupButton}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
