import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  AccessClient,
  type PendingRequestItem,
  type AccessHistoryItem,
  type ActivityLogItem,
} from "./access-client";

export const instant = false;

export default async function AccessPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/access");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    redirect("/app");
  }

  // Fetch pending requests via RPC
  const { data: pendingRaw } = await supabase.rpc("list_pending_requests");
  const pendingRequests = (pendingRaw || []) as PendingRequestItem[];

  // Fetch active and past access via RPC
  const { data: accessRaw } = await supabase.rpc("list_my_access");
  const accessList = (accessRaw || []) as AccessHistoryItem[];

  // Fetch activity log
  const { data: logsRaw } = await supabase
    .from("access_log")
    .select("id, action, created_at, tailor_shops(shop_name)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(50);

  type LogQueryRow = {
    id: string;
    action: "viewed_profile" | "viewed_measurements" | "viewed_family";
    created_at: string;
    tailor_shops: { shop_name: string } | null;
  };

  const activityLogs: ActivityLogItem[] = ((logsRaw || []) as unknown as LogQueryRow[]).map(
    (row) => ({
      id: row.id,
      action: row.action,
      shop_name: row.tailor_shops?.shop_name || "Tailor Shop",
      created_at: row.created_at,
    })
  );

  return (
    <div className="container max-w-4xl space-y-6 py-6 md:py-8">
      <AccessClient
        pendingRequests={pendingRequests}
        accessList={accessList}
        activityLogs={activityLogs}
      />
    </div>
  );
}
