import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CustomersClient, type ConsentedCustomerItem } from "./customers-client";

export const instant = false;

export default async function TailorCustomersPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/tailor/customers");
  }

  // Get tailor shop
  const { data: shop } = await supabase
    .from("tailor_shops")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!shop) {
    redirect("/tailor");
  }

  // Fetch active consented customers via RPC
  const { data: customersRaw } = await supabase.rpc("list_my_consented_customers");
  const activeCustomers = (customersRaw || []) as ConsentedCustomerItem[];

  // Fetch count of pending requests
  const { count: pendingCount } = await supabase
    .from("consents")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id)
    .eq("status", "pending");

  return (
    <div className="container max-w-4xl space-y-6 py-6 md:py-8">
      <CustomersClient activeCustomers={activeCustomers} pendingCount={pendingCount || 0} />
    </div>
  );
}
