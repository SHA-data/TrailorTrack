import { z } from "zod";

export const garmentTypeSchema = z.enum([
  "kameez",
  "shirt",
  "shalwar",
  "trouser",
  "waistcoat",
  "sherwani",
  "coat",
]);

export const orderStatusSchema = z.enum([
  "received",
  "cutting",
  "stitching",
  "ready",
  "delivered",
  "cancelled",
]);

export const fabricSourceSchema = z.enum(["customer", "shop"]);

export const orderItemInputSchema = z.object({
  garment_type: garmentTypeSchema,
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(10, "Max quantity is 10")
    .default(1),
  fabric_source: fabricSourceSchema,
  fabric_details: z
    .string()
    .max(200, "Fabric details must be 200 characters or fewer")
    .optional()
    .nullable(),
  fabric_metres: z.coerce.number().min(0, "Metres must be 0 or greater").optional().nullable(),
  design_notes: z
    .string()
    .max(1000, "Design notes must be 1000 characters or fewer")
    .optional()
    .nullable(),
  measurement_set_id: z.string().uuid("Invalid measurement set").optional().nullable(),
});

export const createOrderInputSchema = z
  .object({
    customer_id: z.string().uuid("Invalid customer ID"),
    family_member_id: z.string().uuid("Invalid family member ID").optional().nullable(),
    delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Delivery date must be YYYY-MM-DD"),
    total_pkr: z.coerce
      .number()
      .int("Price must be a whole PKR amount")
      .min(1, "Price must be at least PKR 1")
      .max(10000000, "Price exceeds maximum PKR 10,000,000"),
    advance_pkr: z.coerce
      .number()
      .int("Advance must be a whole PKR amount")
      .min(0, "Advance cannot be negative")
      .default(0),
    items: z
      .array(orderItemInputSchema)
      .min(1, "Order must contain at least 1 item")
      .max(6, "Order cannot contain more than 6 items"),
  })
  .refine((data) => data.advance_pkr <= data.total_pkr, {
    message: "Advance payment cannot exceed total order price",
    path: ["advance_pkr"],
  });

export const updateOrderStatusInputSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  new_status: orderStatusSchema,
  note: z.string().max(280, "Note must be 280 characters or fewer").optional().nullable(),
});

export const rescheduleOrderInputSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  note: z.string().max(280, "Note must be 280 characters or fewer").optional().nullable(),
});

export const changeOrderPriceInputSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  new_total: z.coerce
    .number()
    .int("Price must be a whole PKR amount")
    .min(1, "Price must be at least PKR 1")
    .max(10000000, "Price exceeds maximum PKR 10,000,000"),
  note: z.string().max(280, "Note must be 280 characters or fewer").optional().nullable(),
});

export const recordPaymentInputSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  amount: z.coerce
    .number()
    .int("Amount must be a whole PKR amount")
    .min(1, "Payment amount must be at least PKR 1"),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;
export type RescheduleOrderInput = z.infer<typeof rescheduleOrderInputSchema>;
export type ChangeOrderPriceInput = z.infer<typeof changeOrderPriceInputSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentInputSchema>;
