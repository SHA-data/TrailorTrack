import React from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TokenGatewayClient, type LookupData } from "./token-gateway-client";

export const instant = false;

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function TokenGatewayPage({ params }: PageProps) {
  await connection();
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerState: "logged_out" | "customer" | "tailor" = "logged_out";
  let initialLookup: LookupData | null = null;
  let lookupOutcome: "found" | "not_found" | "rate_limited" | "unexpected_error" = "not_found";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "tailor") {
      viewerState = "tailor";
      // Perform security-definer lookup
      const { data, error } = await supabase.rpc("lookup_passport", {
        p_token: token.trim(),
      });
      if (error) {
        if (error.message?.toLowerCase().includes("rate limit")) {
          lookupOutcome = "rate_limited";
        } else {
          lookupOutcome = "unexpected_error";
        }
      } else if (data) {
        initialLookup = data as unknown as LookupData;
        lookupOutcome = "found";
      } else {
        lookupOutcome = "not_found";
      }
    } else {
      viewerState = "customer";
    }
  }

  return (
    <div className="container max-w-lg px-4 py-12 sm:py-16">
      <TokenGatewayClient
        token={token}
        viewerState={viewerState}
        initialLookup={initialLookup}
        lookupOutcome={lookupOutcome}
      />
    </div>
  );
}
