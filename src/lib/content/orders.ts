import type { NotificationKind } from "@/types/database";
import { formatPKR, formatKarachiDate } from "@/lib/format";

export const ordersContent = {
  tailor: {
    boardTitle: "Orders Board",
    boardSubtitle: "Track active stitching workflows, production milestones, and deliveries.",
    newOrderButton: "New Order",
    emptyActiveOrders: "No active orders in this column.",
    emptyAllOrders: "No orders found matching your search or filters.",
    columns: {
      received: "Received",
      cutting: "Cutting",
      stitching: "Stitching",
      ready: "Ready for Pickup",
      closed: "Closed Orders",
    },
    tabs: {
      active: "Active Workflows",
      closed: "Delivered & Cancelled",
    },
    filters: {
      all: "All Active",
      dueToday: "Due Today",
      dueThisWeek: "Due This Week",
      overdue: "Overdue",
    },
    stepper: {
      title: "Create Stitching Order",
      subtitle: "Book a new order from a consented customer profile.",
      stepCustomer: "1. Select Client",
      stepPerson: "2. Family Member",
      stepItems: "3. Garments & Fabric",
      stepPricing: "4. Schedule & Price",
      stepReview: "5. Review & Confirm",
      missingMeasurementsScopeHint:
        "The customer did not grant measurements scope. Measurements can be taken in person.",
      noConsentedCustomers:
        "No customers found with active orders permission. Ask the customer to scan their passport QR first.",
    },
    detail: {
      orderNumberPrefix: "Order #",
      timelineTitle: "Milestone History",
      itemsTitle: "Garments in Order",
      pricingTitle: "Payment & Financial Summary",
      actionsTitle: "Order Actions",
      advancePaidLabel: "Advance Paid",
      balanceRemainingLabel: "Balance Due",
      changeStatusButton: "Update Milestone",
      rescheduleButton: "Reschedule Delivery",
      changePriceButton: "Adjust Total Price",
      recordPaymentButton: "Record Payment",
      measurementHiddenNotice:
        "Measurement specifications cannot be opened because consent has ended and this order is closed.",
      unpaidBalanceWarning:
        "This order still has an unpaid balance. Are you sure you want to mark it as Delivered?",
    },
  },
  customer: {
    listTitle: "My Orders",
    listSubtitle: "Track your garments across each stitching stage (updates about every 30 seconds while open).",
    tabs: {
      active: "Active Orders",
      past: "Order History",
    },
    emptyActive: "You have no active orders in progress.",
    emptyPast: "No past tailoring orders found.",
    detail: {
      timelineTitle: "Production Milestones",
      itemsTitle: "Garments & Fabric",
      measurementsTitle: "Measurements Used for this Order",
      paymentTitle: "Payment Summary",
      callShopButton: "Call Tailor Shop",
      newerMeasurementExistsHint:
        "A newer measurement set is available in your passport, but this order was stitched using the specifications recorded above at order booking.",
    },
    notifications: {
      title: "Order Notifications",
      subtitle: "Milestone alerts and delivery updates sent by your tailor.",
      empty: "You have no notifications.",
      markAllRead: "Mark all as read",
    },
  },
  errors: {
    consent_required: "Active consent with orders permission is required to create an order.",
    scope_missing:
      "Active consent with measurements permission is required to attach measurement sets.",
    invalid_transition: "This status transition is not permitted.",
    order_closed: "Cannot modify an order that has already been delivered or cancelled.",
    amount_invalid: "The payment amount is invalid or exceeds the order balance.",
    limit_reached: "The limit of 10 open orders for this customer has been reached.",
    invalid_family_member: "The selected family member does not belong to this customer.",
    invalid_measurement_set:
      "The selected measurement set does not match the customer or garment type.",
    delivery_date_invalid: "The delivery date must be between today and 365 days in the future.",
    order_not_found: "Order not found or access denied.",
    generic: "An unexpected error occurred. Please try again.",
  },
};

/**
 * Maps PostgreSQL machine-readable exceptions to user-friendly error strings.
 */
export function getFriendlyOrderError(errorMessage: string | undefined): string {
  if (!errorMessage) return ordersContent.errors.generic;
  const msg = errorMessage.toLowerCase();

  for (const [key, text] of Object.entries(ordersContent.errors)) {
    if (msg.includes(key)) return text;
  }
  return errorMessage;
}

/**
 * Pure machine-readable to human wording renderer for customer notifications.
 * Database stores only kind + jsonb; all UI presentation lives here.
 */
export function renderNotificationText(
  kind: NotificationKind,
  data: Record<string, unknown>
): { title: string; body: string; link: string } {
  const orderId = (data?.order_id as string) || "";
  const orderSeq = data?.order_seq ? `#${String(data.order_seq).padStart(4, "0")}` : "Order";
  const shopName = (data?.shop_name as string) || "Your tailor";
  const link = orderId ? `/app/orders/${orderId}` : "/app/orders";

  switch (kind) {
    case "order_created": {
      const total = formatPKR(data?.total_pkr as number);
      const delivery = data?.delivery_date ? formatKarachiDate(data.delivery_date as string) : "";
      return {
        title: `${shopName} booked ${orderSeq}`,
        body: `New order confirmed for ${total}${delivery ? `, delivery expected ${delivery}` : ""}.`,
        link,
      };
    }
    case "order_status": {
      const toStatus = data?.to_status || "";
      const note = data?.note ? ` Note: "${data.note}"` : "";
      let statusLabel = toStatus;
      if (toStatus === "cutting") statusLabel = "Fabric cutting started";
      else if (toStatus === "stitching") statusLabel = "Stitching in progress";
      else if (toStatus === "ready") statusLabel = "Ready for pickup / trial";
      else if (toStatus === "delivered") statusLabel = "Garment delivered";
      else if (toStatus === "cancelled") statusLabel = "Order cancelled";

      return {
        title: `${orderSeq}: ${statusLabel}`,
        body: `${shopName} updated your order milestone.${note}`,
        link,
      };
    }
    case "order_rescheduled": {
      const newDate = data?.to_date ? formatKarachiDate(data.to_date as string) : "a new date";
      const note = data?.note ? ` Reason: "${data.note}"` : "";
      return {
        title: `${orderSeq} Rescheduled`,
        body: `Delivery date updated to ${newDate} by ${shopName}.${note}`,
        link,
      };
    }
    case "order_price_changed": {
      const newTotal = formatPKR(data?.to_total as number);
      const note = data?.note ? ` Reason: "${data.note}"` : "";
      return {
        title: `${orderSeq} Price Updated`,
        body: `Order total updated to ${newTotal} by ${shopName}.${note}`,
        link,
      };
    }
    case "order_payment": {
      const amount = formatPKR(data?.amount_paid as number);
      const balance = formatPKR(data?.balance_remaining as number);
      return {
        title: `Payment Recorded for ${orderSeq}`,
        body: `Received ${amount}. Remaining balance: ${balance}.`,
        link,
      };
    }
    default:
      return {
        title: `Order Update`,
        body: `There is a new update on your order.`,
        link,
      };
  }
}
