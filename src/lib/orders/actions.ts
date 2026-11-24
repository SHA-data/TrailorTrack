"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  rescheduleOrderInputSchema,
  changeOrderPriceInputSchema,
  recordPaymentInputSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type RescheduleOrderInput,
  type ChangeOrderPriceInput,
  type RecordPaymentInput,
} from "./schemas";
import { getFriendlyOrderError } from "@/lib/content/orders";
import type { Json } from "@/types/database";

export async function createOrderAction(rawInput: CreateOrderInput) {
  const validated = createOrderInputSchema.safeParse(rawInput);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid order inputs" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create an order." };
  }

  const { data, error } = await supabase.rpc("create_order", {
    p_customer_id: validated.data.customer_id,
    p_family_member_id: validated.data.family_member_id || null,
    p_delivery_date: validated.data.delivery_date,
    p_total_pkr: validated.data.total_pkr,
    p_advance_pkr: validated.data.advance_pkr,
    p_items: validated.data.items as unknown as Json,
  });

  if (error) {
    return { error: getFriendlyOrderError(error.message) };
  }

  revalidatePath("/tailor");
  revalidatePath("/tailor/orders");
  revalidatePath("/app");
  revalidatePath("/app/orders");

  return { success: true, orderId: data as string };
}

export async function updateOrderStatusAction(rawInput: UpdateOrderStatusInput) {
  const validated = updateOrderStatusInputSchema.safeParse(rawInput);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid status update" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: validated.data.order_id,
    p_new_status: validated.data.new_status,
    p_note: validated.data.note || null,
  });

  if (error) {
    return { error: getFriendlyOrderError(error.message) };
  }

  revalidatePath("/tailor/orders");
  revalidatePath(`/tailor/orders/${validated.data.order_id}`);
  revalidatePath("/app/orders");
  revalidatePath(`/app/orders/${validated.data.order_id}`);

  return { success: true };
}

export async function rescheduleOrderAction(rawInput: RescheduleOrderInput) {
  const validated = rescheduleOrderInputSchema.safeParse(rawInput);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid reschedule inputs" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.rpc("reschedule_order", {
    p_order_id: validated.data.order_id,
    p_new_date: validated.data.new_date,
    p_note: validated.data.note || null,
  });

  if (error) {
    return { error: getFriendlyOrderError(error.message) };
  }

  revalidatePath(`/tailor/orders/${validated.data.order_id}`);
  revalidatePath(`/app/orders/${validated.data.order_id}`);
  revalidatePath("/tailor/orders");

  return { success: true };
}

export async function changeOrderPriceAction(rawInput: ChangeOrderPriceInput) {
  const validated = changeOrderPriceInputSchema.safeParse(rawInput);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid price adjustment" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.rpc("change_order_price", {
    p_order_id: validated.data.order_id,
    p_new_total: validated.data.new_total,
    p_note: validated.data.note || null,
  });

  if (error) {
    return { error: getFriendlyOrderError(error.message) };
  }

  revalidatePath(`/tailor/orders/${validated.data.order_id}`);
  revalidatePath(`/app/orders/${validated.data.order_id}`);

  return { success: true };
}

export async function recordPaymentAction(rawInput: RecordPaymentInput) {
  const validated = recordPaymentInputSchema.safeParse(rawInput);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid payment amount" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.rpc("record_payment", {
    p_order_id: validated.data.order_id,
    p_amount: validated.data.amount,
  });

  if (error) {
    return { error: getFriendlyOrderError(error.message) };
  }

  revalidatePath(`/tailor/orders/${validated.data.order_id}`);
  revalidatePath(`/app/orders/${validated.data.order_id}`);
  revalidatePath("/tailor/orders");
  revalidatePath("/tailor");

  return { success: true };
}

export async function markNotificationsReadAction(ids?: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await supabase.rpc("mark_notifications_read", {
    p_ids: ids && ids.length > 0 ? ids : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/notifications");
  revalidatePath("/app");

  return { success: true, count: data as number };
}
