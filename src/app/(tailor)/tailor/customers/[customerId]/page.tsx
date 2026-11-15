import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CustomerDetailClient } from "./customer-detail-client";
import type { FitCategory, GarmentType, PreferredUnit, ConsentScope } from "@/types/database";

export const instant = false;

interface PageProps {
  params: Promise<{
    customerId: string;
  }>;
}

export default async function ConsentedCustomerPage({ params }: PageProps) {
  await connection();
  const { customerId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/tailor/customers/${customerId}`);
  }

  // Fetch consented customer via SECURITY DEFINER RPC
  const { data: customerRaw, error: customerError } = await supabase.rpc("get_consented_customer", {
    p_customer_id: customerId,
  });

  if (customerError || !customerRaw) {
    return (
      <div className="container max-w-lg px-4 py-12">
        <Card className="border-border bg-card space-y-4 p-6 text-center shadow-md">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600">
            <Lock className="size-7" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-foreground font-serif text-xl">
              Consent Inactive or Expired
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs leading-relaxed">
              You do not have an active, unexpired consent agreement to view this customer&apos;s
              measurements. Please ask the customer to scan their QR passport to renew access.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="w-full text-xs">
            <Link href="/tailor/customers">
              <ArrowLeft className="mr-1.5 size-3.5" />
              <span>Back to Client Directory</span>
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const customer = customerRaw as {
    customer_id: string;
    full_name: string;
    phone: string | null;
    city: string | null;
    fit_category: FitCategory | null;
    scopes: ConsentScope[];
    expires_at: string;
  };

  // Fetch customer's preferred unit
  const { data: custRecord } = await supabase
    .from("customers")
    .select("preferred_unit")
    .eq("id", customer.customer_id)
    .single();

  const preferredUnit: PreferredUnit = custRecord?.preferred_unit || "in";

  // Fetch family members (permitted via RLS has_active_consent)
  const { data: familyRaw } = await supabase
    .from("family_members")
    .select("id, full_name, relation, fit_category")
    .eq("customer_id", customer.customer_id);

  const familyMembers = (familyRaw || []).map((f) => ({
    id: f.id,
    full_name: f.full_name,
    relation: f.relation,
    fit_category: f.fit_category as FitCategory,
  }));

  // Fetch measurement sets (permitted via RLS has_active_consent)
  const { data: setsRaw } = await supabase
    .from("measurement_sets")
    .select("id, family_member_id, garment_type, fit_preference, values, notes, taken_on")
    .eq("customer_id", customer.customer_id)
    .order("taken_on", { ascending: false });

  const measurementSets = (setsRaw || []).map((s) => ({
    id: s.id,
    family_member_id: s.family_member_id,
    garment_type: s.garment_type as GarmentType,
    fit_preference: s.fit_preference,
    values: s.values as Record<string, number>,
    notes: s.notes,
    taken_on: s.taken_on,
  }));

  return (
    <div className="container max-w-4xl space-y-6 py-6 md:py-8">
      <CustomerDetailClient
        customer={customer}
        familyMembers={familyMembers}
        measurementSets={measurementSets}
        preferredUnit={preferredUnit}
      />
    </div>
  );
}
