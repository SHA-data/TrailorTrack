import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatMeasurement } from "@/lib/measurements/units";
import {
  MeasurementsClient,
  type PersonOption,
  type LatestSetSummary,
} from "./measurements-client";
import type { GarmentType, PreferredUnit } from "@/types/database";

export default async function MeasurementsHubPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/measurements");
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

  // Build person list: "Me" first, then family members
  const people: PersonOption[] = [
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

  // Fetch all measurement sets ordered by created_at desc
  const { data: allSets } = await supabase
    .from("measurement_sets")
    .select("id, family_member_id, garment_type, values, fit_preference, taken_on, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const preferredUnit: PreferredUnit = customer.preferred_unit || "in";

  // Group latest sets by personKey ('me' or family_member_id) and garmentType
  const latestSetsByPersonAndGarment: Record<string, Record<string, LatestSetSummary>> = {};
  const historyCounts: Record<string, Record<string, number>> = {};

  (allSets || []).forEach((set) => {
    const personKey = set.family_member_id || "me";
    const garmentKey = set.garment_type;

    if (!historyCounts[personKey]) historyCounts[personKey] = {};
    historyCounts[personKey][garmentKey] = (historyCounts[personKey][garmentKey] || 0) + 1;

    if (!latestSetsByPersonAndGarment[personKey]) {
      latestSetsByPersonAndGarment[personKey] = {};
    }

    // Since sets are ordered desc, the first time we see a garment for a person, it is the latest
    if (!latestSetsByPersonAndGarment[personKey][garmentKey]) {
      const vals = (set.values as Record<string, number>) || {};
      const keyValues = Object.entries(vals).map(([k, numVal]) => ({
        label: k.charAt(0).toUpperCase() + k.slice(1),
        valueFormatted: formatMeasurement(numVal, preferredUnit),
      }));

      latestSetsByPersonAndGarment[personKey][garmentKey] = {
        id: set.id,
        garmentType: set.garment_type as GarmentType,
        fitPreference: set.fit_preference,
        takenOn: set.taken_on,
        keyValues,
        historyCount: 1, // Will be updated below
      };
    }
  });

  // Assign total history counts
  Object.keys(latestSetsByPersonAndGarment).forEach((personKey) => {
    Object.keys(latestSetsByPersonAndGarment[personKey]).forEach((garmentKey) => {
      latestSetsByPersonAndGarment[personKey][garmentKey].historyCount =
        historyCounts[personKey]?.[garmentKey] || 1;
    });
  });

  return (
    <MeasurementsClient
      people={people}
      preferredUnit={preferredUnit}
      latestSetsByPersonAndGarment={latestSetsByPersonAndGarment}
    />
  );
}
