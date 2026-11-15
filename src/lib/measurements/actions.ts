"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseMeasurementToInches } from "./units";
import { createMeasurementValuesSchema, getMeasurementTemplate } from "./templates";
import type { FitCategory, GarmentType, PreferredUnit, FitPreference } from "@/types/database";

// ------------------------------------------------------------------------------
// SCHEMAS
// ------------------------------------------------------------------------------

const onboardingSchema = z.object({
  fitCategory: z.enum(["men", "women", "boys", "girls"]),
  preferredUnit: z.enum(["in", "cm"]),
  city: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(30).optional(),
});

const familyMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be under 80 characters"),
  relation: z.enum(["spouse", "son", "daughter", "father", "mother", "brother", "sister", "other"]),
  fitCategory: z.enum(["men", "women", "boys", "girls"]),
});

const preferencesSchema = z.object({
  fitCategory: z.enum(["men", "women", "boys", "girls"]),
  preferredUnit: z.enum(["in", "cm"]),
});

// ------------------------------------------------------------------------------
// 1. ONBOARDING ACTION
// ------------------------------------------------------------------------------

export async function completeOnboardingAction(formData: FormData) {
  const result = onboardingSchema.safeParse({
    fitCategory: formData.get("fitCategory"),
    preferredUnit: formData.get("preferredUnit"),
    city: formData.get("city") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid onboarding details" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Update customer record
  const { error: customerError } = await supabase
    .from("customers")
    .update({
      fit_category: result.data.fitCategory,
      preferred_unit: result.data.preferredUnit,
      ...(result.data.city ? { city: result.data.city } : {}),
    })
    .eq("user_id", user.id);

  if (customerError) {
    return { error: customerError.message };
  }

  // Update profile phone if supplied
  if (result.data.phone) {
    await supabase.from("profiles").update({ phone: result.data.phone }).eq("id", user.id);
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/app/measurements");
  return { success: true };
}

// ------------------------------------------------------------------------------
// 2. FAMILY MEMBER ACTIONS
// ------------------------------------------------------------------------------

export async function addFamilyMemberAction(formData: FormData) {
  const result = familyMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    relation: formData.get("relation"),
    fitCategory: formData.get("fitCategory"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid family member details" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    return { error: "Customer profile not found" };
  }

  const { error } = await supabase.from("family_members").insert({
    customer_id: customer.id,
    full_name: result.data.fullName,
    relation: result.data.relation,
    fit_category: result.data.fitCategory,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/family");
  revalidatePath("/app/measurements");
  revalidatePath("/app");
  return { success: true, message: `${result.data.fullName} added to family passport!` };
}

export async function updateFamilyMemberAction(id: string, formData: FormData) {
  const result = familyMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    relation: formData.get("relation"),
    fitCategory: formData.get("fitCategory"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid family member details" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("family_members")
    .update({
      full_name: result.data.fullName,
      relation: result.data.relation,
      fit_category: result.data.fitCategory,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/family");
  revalidatePath("/app/measurements");
  return { success: true, message: "Family member updated successfully!" };
}

export async function deleteFamilyMemberAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("family_members").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/family");
  revalidatePath("/app/measurements");
  revalidatePath("/app");
  return { success: true, message: "Family member removed." };
}

// ------------------------------------------------------------------------------
// 3. MEASUREMENT SET ACTIONS
// ------------------------------------------------------------------------------

export async function saveMeasurementSetAction(formData: FormData) {
  const familyMemberId = (formData.get("familyMemberId") as string) || null;
  const garmentType = formData.get("garmentType") as GarmentType;
  const fitPreference = (formData.get("fitPreference") as FitPreference) || "regular";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const takenOn = (formData.get("takenOn") as string) || new Date().toISOString().slice(0, 10);
  const inputUnit = (formData.get("inputUnit") as PreferredUnit) || "in";

  if (!garmentType) {
    return { error: "Please select a garment type" };
  }

  if (notes && notes.length > 500) {
    return { error: "Notes cannot exceed 500 characters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, fit_category")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    return { error: "Customer profile not found" };
  }

  // Determine person's fit category
  let fitCategory: FitCategory = customer.fit_category || "men";
  if (familyMemberId) {
    const { data: member } = await supabase
      .from("family_members")
      .select("fit_category")
      .eq("id", familyMemberId)
      .eq("customer_id", customer.id)
      .single();

    if (!member) {
      return { error: "Family member not found" };
    }
    fitCategory = member.fit_category;
  }

  // Extract and parse template fields
  const templateFields = getMeasurementTemplate(fitCategory, garmentType);
  const rawValues: Record<string, number> = {};

  for (const field of templateFields) {
    const rawInput = formData.get(`val_${field.key}`) as string;
    if (!rawInput) {
      return { error: `Please enter a value for ${field.label}` };
    }

    const parseResult = parseMeasurementToInches(rawInput, inputUnit);
    if (!parseResult.success) {
      return { error: `${field.label}: ${parseResult.error}` };
    }
    rawValues[field.key] = parseResult.inches;
  }

  // Validate values with Zod schema for garment & category
  const schema = createMeasurementValuesSchema(fitCategory, garmentType);
  const validationResult = schema.safeParse(rawValues);

  if (!validationResult.success) {
    return { error: validationResult.error.issues[0]?.message || "Invalid measurement values" };
  }

  // Insert append-only set with source='self' and shop_id=null
  const { data: newSet, error } = await supabase
    .from("measurement_sets")
    .insert({
      customer_id: customer.id,
      family_member_id: familyMemberId,
      garment_type: garmentType,
      values: validationResult.data,
      fit_preference: fitPreference,
      notes,
      taken_on: takenOn,
      source: "self",
      shop_id: null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/measurements");
  return { success: true, setId: newSet.id };
}

export async function updateMeasurementSetNotesAction(setId: string, notes: string) {
  if (notes && notes.length > 500) {
    return { error: "Notes cannot exceed 500 characters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("measurement_sets")
    .update({ notes: notes || null })
    .eq("id", setId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/measurements/${setId}`);
  return { success: true, message: "Notes updated successfully." };
}

export async function deleteMeasurementSetAction(setId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("measurement_sets").delete().eq("id", setId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/measurements");
  return { success: true, message: "Measurement set deleted." };
}

// ------------------------------------------------------------------------------
// 4. PREFERENCES ACTION
// ------------------------------------------------------------------------------

export async function updateCustomerPreferencesAction(formData: FormData) {
  const result = preferencesSchema.safeParse({
    fitCategory: formData.get("fitCategory"),
    preferredUnit: formData.get("preferredUnit"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid preferences" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("customers")
    .update({
      fit_category: result.data.fitCategory,
      preferred_unit: result.data.preferredUnit,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/profile");
  revalidatePath("/app/measurements");
  revalidatePath("/app");
  return { success: true, message: "Preferences updated!" };
}
