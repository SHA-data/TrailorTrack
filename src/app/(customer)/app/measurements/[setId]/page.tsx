import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetailClient } from "./detail-client";
import type { FitCategory, PreferredUnit, GarmentType } from "@/types/database";

interface PageProps {
  params: Promise<{
    setId: string;
  }>;
}

export const instant = false;

export default async function MeasurementSetDetailPage({ params }: PageProps) {
  await connection();
  const { setId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch customer record
  const { data: customer } = await supabase
    .from("customers")
    .select("id, fit_category, preferred_unit")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    redirect("/app");
  }

  // Fetch the specific measurement set
  const { data: currentSet, error: setError } = await supabase
    .from("measurement_sets")
    .select(
      "id, customer_id, family_member_id, garment_type, fit_preference, values, notes, source, taken_on, created_at"
    )
    .eq("id", setId)
    .eq("customer_id", customer.id)
    .single();

  if (setError || !currentSet) {
    notFound();
  }

  // Determine person name & fit category
  let personName = "Me";
  let fitCategory: FitCategory = customer.fit_category || "men";

  if (currentSet.family_member_id) {
    const { data: member } = await supabase
      .from("family_members")
      .select("full_name, fit_category")
      .eq("id", currentSet.family_member_id)
      .single();

    if (member) {
      personName = member.full_name;
      fitCategory = member.fit_category as FitCategory;
    } else {
      personName = "Family Member";
    }
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      personName = `${profile.full_name} (Me)`;
    }
  }

  // Fetch all history sets for this same person and garment type
  let historyQuery = supabase
    .from("measurement_sets")
    .select("id, taken_on, created_at, fit_preference, values, notes")
    .eq("customer_id", customer.id)
    .eq("garment_type", currentSet.garment_type)
    .order("taken_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (currentSet.family_member_id) {
    historyQuery = historyQuery.eq("family_member_id", currentSet.family_member_id);
  } else {
    historyQuery = historyQuery.is("family_member_id", null);
  }

  const { data: historySetsRaw } = await historyQuery;

  const historySets = (historySetsRaw || []).map((s) => ({
    id: s.id,
    taken_on: s.taken_on,
    created_at: s.created_at,
    fit_preference: s.fit_preference,
    values: s.values as Record<string, number>,
    notes: s.notes,
  }));

  const preferredUnit: PreferredUnit = customer.preferred_unit || "in";

  return (
    <div className="container max-w-4xl py-6 md:py-8">
      <DetailClient
        currentSet={{
          id: currentSet.id,
          garment_type: currentSet.garment_type as GarmentType,
          fit_preference: currentSet.fit_preference,
          values: currentSet.values as Record<string, number>,
          notes: currentSet.notes,
          source: currentSet.source,
          taken_on: currentSet.taken_on,
          created_at: currentSet.created_at,
        }}
        historySets={historySets}
        personName={personName}
        fitCategory={fitCategory}
        preferredUnit={preferredUnit}
      />
    </div>
  );
}
