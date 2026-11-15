import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ScannerClient } from "./scanner-client";

export const instant = false;

export default async function TailorScanPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/tailor/scan");
  }

  return (
    <div className="container max-w-2xl space-y-6 py-6 md:py-8">
      <ScannerClient />
    </div>
  );
}
