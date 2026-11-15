import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NewMeasurementForm, type PersonItem } from "./new-measurement-form";
import type { GarmentType, PreferredUnit } from "@/types/database";

interface PageProps {
  searchParams: Promise<{
    person?: string;
    garment?: string;
  }>;
}

export const instant = false;

export default async function NewMeasurementPage({ searchParams }: PageProps) {
  await connection();
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/measurements/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, fit_category, preferred_unit")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    redirect("/app");
  }

  // Fetch family members
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, full_name, relation, fit_category")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true });

  const people: PersonItem[] = [
    {
      id: "me",
      name: profile?.full_name ? `${profile.full_name.split(" ")[0]} (Me)` : "Me",
      fitCategory: customer.fit_category || "men",
    },
    ...(familyMembers || []).map((m) => ({
      id: m.id,
      name: m.full_name,
      relation: m.relation,
      fitCategory: m.fit_category,
    })),
  ];

  const defaultPersonId = params.person || "me";
  const defaultGarment = (params.garment as GarmentType) || "kameez";
  const defaultUnit: PreferredUnit = customer.preferred_unit || "in";

  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-8 text-center text-xs">
          Loading bespoke measurement form...
        </div>
      }
    >
      <NewMeasurementForm
        people={people}
        defaultPersonId={defaultPersonId}
        defaultGarment={defaultGarment}
        defaultUnit={defaultUnit}
      />
    </Suspense>
  );
}
