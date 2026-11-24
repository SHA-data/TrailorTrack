import { NextResponse } from "next/server";
import { getCustomerUnreadNotificationCount } from "@/lib/orders/queries";

export async function GET() {
  try {
    const count = await getCustomerUnreadNotificationCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
