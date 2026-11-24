import React from "react";
import { connection } from "next/server";
import { getTailorOrders } from "@/lib/orders/queries";
import { TailorOrdersBoardClient } from "./orders-board-client";

export default async function TailorOrdersPage() {
  await connection();
  const orders = await getTailorOrders();

  return <TailorOrdersBoardClient initialOrders={orders} />;
}
