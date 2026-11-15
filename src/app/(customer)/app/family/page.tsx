import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FamilyClient, type FamilyMemberItem } from "./family-client";

export const instant = false;

export default async function FamilyPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/family");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    redirect("/app");
  }

  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, full_name, relation, fit_category, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true });

  const initialMembers: FamilyMemberItem[] = (familyMembers || []).map((m) => ({
    id: m.id,
    full_name: m.full_name,
    relation: m.relation,
    fit_category: m.fit_category,
    created_at: m.created_at,
  }));

  return <FamilyClient initialMembers={initialMembers} />;
}
