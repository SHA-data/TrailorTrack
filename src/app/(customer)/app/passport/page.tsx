import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { PassportCard } from "./passport-card";

export const instant = false;

export default async function CustomerPassportPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/passport");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, qr_token, city, fit_category")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    redirect("/app");
  }

  // Dynamically resolve siteUrl from incoming request headers or environment variable
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const proto =
    headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const detectedUrl = host ? `${proto}://${host}` : "http://localhost:3000";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : detectedUrl;

  const passportUrl = `${siteUrl}/t/${customer.qr_token}`;

  // Generate crisp server-side SVG QR code
  const qrSvg = await QRCode.toString(passportUrl, {
    type: "svg",
    margin: 1,
    color: {
      dark: "#1F4D3A",
      light: "#FFFFFF",
    },
  });

  return (
    <div className="container max-w-3xl space-y-6 py-6 md:py-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .passport-printable-card, .passport-printable-card * {
            visibility: visible;
          }
          .passport-printable-card {
            position: fixed;
            left: 0;
            top: 0;
            width: 85.6mm !important;
            height: 54mm !important;
            min-height: 54mm !important;
            max-width: 85.6mm !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: 1px solid #C9A24B !important;
            page-break-after: avoid;
            background-color: #1F4D3A !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .passport-printable-card .size-52 {
            width: 28mm !important;
            height: 28mm !important;
            padding: 1.5mm !important;
          }
          .passport-printable-card .my-5 {
            margin-top: 1mm !important;
            margin-bottom: 1mm !important;
          }
        }
      `}</style>
      <PassportCard
        fullName={profile?.full_name || "Valued Customer"}
        city={customer.city}
        fitCategory={customer.fit_category}
        qrToken={customer.qr_token}
        qrSvg={qrSvg}
        passportUrl={passportUrl}
      />
    </div>
  );
}
