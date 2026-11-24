import React from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerOrderById } from "@/lib/orders/queries";
import { CustomerOrderDetailClient } from "./order-detail-client";

export const instant = false;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  await connection();
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/app/orders/${id}`);
  }

  const order = await getCustomerOrderById(id);
  if (!order) {
    notFound();
  }

  // Check if newer measurement sets exist for any item
  const hasNewerMeasurementsMap: Record<string, string> = {};
  for (const item of order.items) {
    if (item.snapshot?.taken_on) {
      const query = supabase
        .from("measurement_sets")
        .select("taken_on")
        .eq("customer_id", order.customer_id)
        .eq("garment_type", item.garment_type)
        .gt("taken_on", item.snapshot.taken_on)
        .order("taken_on", { ascending: false })
        .limit(1);

      const { data: newer } = await query;
      if (newer && newer.length > 0) {
        hasNewerMeasurementsMap[item.id] = newer[0].taken_on;
      }
    }
  }

  return (
    <div className="container max-w-5xl px-4 py-8">
      <CustomerOrderDetailClient order={order} hasNewerMeasurementsMap={hasNewerMeasurementsMap} />
    </div>
  );
}
