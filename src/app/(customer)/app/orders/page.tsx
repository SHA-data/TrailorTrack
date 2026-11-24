import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/lib/orders/queries";
import { CustomerOrdersClient, type CustomerOrderSummary } from "./orders-client";

export const instant = false;

export default async function CustomerOrdersPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/orders");
  }

  // Fetch active and past orders via RLS
  const [activeOrdersRaw, pastOrdersRaw] = await Promise.all([
    getCustomerOrders("active"),
    getCustomerOrders("past"),
  ]);

  return (
    <div className="container max-w-4xl px-4 py-8">
      <CustomerOrdersClient
        activeOrders={activeOrdersRaw as unknown as CustomerOrderSummary[]}
        pastOrders={pastOrdersRaw as unknown as CustomerOrderSummary[]}
      />
    </div>
  );
}
