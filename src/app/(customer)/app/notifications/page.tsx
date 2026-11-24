import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerNotifications } from "@/lib/orders/queries";
import { NotificationsClient } from "./notifications-client";

export const instant = false;

export default async function CustomerNotificationsPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/notifications");
  }

  const notifications = await getCustomerNotifications(50);

  return (
    <div className="container max-w-3xl px-4 py-8">
      <NotificationsClient notifications={notifications} />
    </div>
  );
}
