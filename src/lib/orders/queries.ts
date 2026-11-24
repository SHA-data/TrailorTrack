import { createClient } from "@/lib/supabase/server";
import type { Database, OrderStatus, ShopDashboardStats } from "@/types/database";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemMeasurementRow =
  Database["public"]["Tables"]["order_item_measurements"]["Row"];
export type OrderEventRow = Database["public"]["Tables"]["order_events"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export interface OrderDetailWithItems extends OrderRow {
  items: (OrderItemRow & {
    snapshot: OrderItemMeasurementRow | null;
  })[];
  events: OrderEventRow[];
}

type RawItemWithSnapshot = OrderItemRow & {
  order_item_measurements: OrderItemMeasurementRow | null;
};

/**
 * Fetches all orders belonging to the authenticated tailor's shop.
 */
export async function getTailorOrders(filters?: {
  status?: OrderStatus;
  tab?: "active" | "closed";
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      `
      id,
      shop_id,
      customer_id,
      person_label,
      shop_name,
      order_seq,
      status,
      total_pkr,
      paid_pkr,
      delivery_date,
      created_at,
      status_changed_at
    `
    )
    .order("created_at", { ascending: false });

  if (filters?.tab === "closed") {
    query = query.in("status", ["delivered", "cancelled"]);
  } else if (filters?.tab === "active") {
    query = query.in("status", ["received", "cutting", "stitching", "ready"]);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching tailor orders:", error);
    return [];
  }

  let orders = data || [];
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        o.person_label.toLowerCase().includes(q) ||
        String(o.order_seq).includes(q) ||
        `#${String(o.order_seq).padStart(4, "0")}`.includes(q)
    );
  }

  return orders;
}

/**
 * Fetches an order in full for the tailor view (including items, snapshots, events).
 */
export async function getTailorOrderById(orderId: string): Promise<OrderDetailWithItems | null> {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return null;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select(
      `
      *,
      order_item_measurements (*)
    `
    )
    .eq("order_id", orderId)
    .order("position", { ascending: true });

  const { data: events } = await supabase
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const formattedItems = ((items as unknown as RawItemWithSnapshot[]) || []).map((item) => ({
    ...item,
    snapshot: item.order_item_measurements || null,
  }));

  return {
    ...order,
    items: formattedItems,
    events: events || [],
  };
}

/**
 * Fetches all orders belonging to the authenticated customer.
 */
export async function getCustomerOrders(tab: "active" | "past" = "active") {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      `
      id,
      shop_id,
      customer_id,
      person_label,
      shop_name,
      shop_city,
      shop_phone,
      order_seq,
      status,
      total_pkr,
      paid_pkr,
      delivery_date,
      created_at,
      status_changed_at,
      closed_at
    `
    )
    .order("created_at", { ascending: false });

  if (tab === "active") {
    query = query.in("status", ["received", "cutting", "stitching", "ready"]);
  } else {
    query = query.in("status", ["delivered", "cancelled"]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetches an order in full for the customer view.
 */
export async function getCustomerOrderById(orderId: string): Promise<OrderDetailWithItems | null> {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return null;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select(
      `
      *,
      order_item_measurements (*)
    `
    )
    .eq("order_id", orderId)
    .order("position", { ascending: true });

  const { data: events } = await supabase
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const formattedItems = ((items as unknown as RawItemWithSnapshot[]) || []).map((item) => ({
    ...item,
    snapshot: item.order_item_measurements || null,
  }));

  return {
    ...order,
    items: formattedItems,
    events: events || [],
  };
}

/**
 * Fetches customer notifications ordered by date.
 */
export async function getCustomerNotifications(limit = 50): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data || [];
}

/**
 * Fetches count of unread notifications for authenticated customer.
 */
export async function getCustomerUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  if (error) return 0;
  return count || 0;
}

/**
 * Calls shop_dashboard_stats RPC for tailor home dashboard.
 */
export async function getShopDashboardStats(): Promise<ShopDashboardStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("shop_dashboard_stats");
  if (error) {
    console.error("Error calling shop_dashboard_stats:", error);
    return null;
  }
  return data as unknown as ShopDashboardStats;
}
