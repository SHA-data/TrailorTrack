import React from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTailorOrderById } from "@/lib/orders/queries";
import { TailorOrderDetailClient } from "./order-detail-client";

export const instant = false;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TailorOrderDetailPage({ params }: PageProps) {
  await connection();
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/tailor/orders/${id}`);
  }

  const order = await getTailorOrderById(id);
  if (!order) {
    notFound();
  }

  // Check if shop has active consent with measurements scope
  let activeConsentWithMeasurements = false;
  try {
    const { data: shopId } = await supabase.rpc("get_caller_shop_id");
    if (shopId) {
      const { data: hasConsent } = await supabase.rpc("has_active_consent", {
        p_customer_id: order.customer_id,
        p_shop_id: shopId,
        p_scope: "measurements",
      });
      activeConsentWithMeasurements = Boolean(hasConsent);
    }
  } catch (err) {
    console.warn("Could not check active consent for measurements:", err);
  }

  return (
    <div className="container max-w-5xl px-4 py-8">
      <TailorOrderDetailClient
        order={order}
        activeConsentWithMeasurements={activeConsentWithMeasurements}
      />
    </div>
  );
}
