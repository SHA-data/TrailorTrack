import React from "react";
import { Logo } from "@/components/marketing/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-background via-cream-50/70 to-background flex min-h-screen flex-col justify-between bg-gradient-to-b p-4 sm:p-6 lg:p-8">
      {/* Top Logo */}
      <div className="mx-auto flex w-full max-w-md justify-center pt-6 sm:pt-10">
        <Logo />
      </div>

      {/* Auth Content */}
      <div className="mx-auto my-auto w-full max-w-md py-8">{children}</div>

      {/* Footer */}
      <div className="text-muted-foreground mx-auto w-full max-w-md pb-6 text-center font-sans text-xs">
        TailorTrack • Digital Tailoring Passport • Pakistan
      </div>
    </div>
  );
}
