import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OrderCreatorClient } from "./order-creator-client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";
import type { ConsentScope, GarmentType } from "@/types/database";

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    customerId?: string;
  }>;
}

interface ConsentedCustomerRpcResult {
  customer_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  scopes: ConsentScope[];
  expires_at: string;
}

export default async function NewOrderPage({ searchParams }: PageProps) {
  await connection();
  const { customerId: preselectedCustomerId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/tailor/orders/new");
  }

  // Fetch shop's consented customers
  const { data: rawCustomers, error: customersErr } = await supabase.rpc(
    "list_my_consented_customers"
  );

  if (customersErr) {
    console.error("Error fetching consented customers:", customersErr);
  }

  // Filter customers with active 'orders' scope
  const allConsented: ConsentedCustomerRpcResult[] = (rawCustomers || []).map((c) => ({
    customer_id: c.customer_id,
    full_name: c.full_name,
    phone: c.phone || null,
    city: c.city || null,
    scopes: c.scopes || [],
    expires_at: c.expires_at,
  }));

  const eligibleCustomers = allConsented.filter((c) => c.scopes.includes("orders"));

  // If no customers have consented with orders scope, show guidance
  if (eligibleCustomers.length === 0) {
    return (
      <div className="container max-w-lg px-4 py-12">
        <Card className="border-border bg-card space-y-4 p-6 text-center shadow-md">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600">
            <UserX className="size-7" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-foreground font-serif text-xl">
              No Client Order Consent
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs leading-relaxed">
              To create an order, a client must first scan their digital passport QR code and grant
              your shop access with the <strong>Orders</strong> scope.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full text-xs">
              <Link href="/tailor/scan">Scan Client Passport</Link>
            </Button>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/tailor/orders">
                <ArrowLeft className="mr-1.5 size-3.5" />
                Back to Orders
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const customerIds = eligibleCustomers.map((c) => c.customer_id);

  // Fetch family members for eligible customers
  const { data: rawFamily } = await supabase
    .from("family_members")
    .select("id, customer_id, full_name, relation")
    .in("customer_id", customerIds);

  const familyMembers = (rawFamily || []).map((f) => ({
    id: f.id,
    customer_id: f.customer_id,
    full_name: f.full_name,
    relation: f.relation,
  }));

  // Fetch measurement sets for eligible customers
  const { data: rawMeasurements } = await supabase
    .from("measurement_sets")
    .select("id, customer_id, family_member_id, garment_type, fit_preference, taken_on")
    .in("customer_id", customerIds);

  const measurementSets = (rawMeasurements || []).map((m) => ({
    id: m.id,
    customer_id: m.customer_id,
    family_member_id: m.family_member_id || null,
    garment_type: m.garment_type as GarmentType,
    fit_preference: m.fit_preference || null,
    taken_on: m.taken_on,
  }));

  // If a preselected customer is specified, move them to the front if eligible
  if (preselectedCustomerId) {
    const preselectedIndex = eligibleCustomers.findIndex(
      (c) => c.customer_id === preselectedCustomerId
    );
    if (preselectedIndex > 0) {
      const [preselected] = eligibleCustomers.splice(preselectedIndex, 1);
      eligibleCustomers.unshift(preselected);
    }
  }

  return (
    <div className="container max-w-4xl px-4 py-8">
      <OrderCreatorClient
        customers={eligibleCustomers}
        familyMembers={familyMembers}
        measurementSets={measurementSets}
      />
    </div>
  );
}
