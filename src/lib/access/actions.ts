"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const scopesSchema = z
  .array(z.enum(["measurements", "orders"]))
  .min(1, "Select at least one permission");

const durationSchema = z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(365)]);

export async function rotateQrTokenAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: newToken, error } = await supabase.rpc("rotate_my_qr_token");
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/passport");
  revalidatePath("/app");
  return { success: true, newToken };
}

export async function lookupPassportAction(token: string) {
  if (!token || typeof token !== "string") {
    return { error: "Invalid token" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to look up passports" };
  }

  const { data, error } = await supabase.rpc("lookup_passport", {
    p_token: token.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, data };
}

export async function requestAccessAction(token: string, scopes: string[]) {
  const validatedScopes = scopesSchema.safeParse(scopes);
  if (!validatedScopes.success) {
    return { error: validatedScopes.error.issues[0]?.message || "Invalid scopes" };
  }

  const cleanToken = token.trim();
  if (!cleanToken) {
    return { error: "Token is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: consentId, error } = await supabase.rpc("request_access", {
    p_token: cleanToken,
    p_scopes: validatedScopes.data,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tailor/customers");
  return { success: true, consentId };
}

export async function respondToConsentAction(
  consentId: string,
  decision: "approve" | "decline",
  scopes: string[] = ["measurements"],
  durationDays: number = 30
) {
  if (!consentId) {
    return { error: "Consent ID is required" };
  }

  if (decision !== "approve" && decision !== "decline") {
    return { error: "Invalid decision" };
  }

  if (decision === "approve") {
    const validScopes = scopesSchema.safeParse(scopes);
    if (!validScopes.success) {
      return { error: validScopes.error.issues[0]?.message || "Select at least one scope" };
    }

    const validDuration = durationSchema.safeParse(durationDays);
    if (!validDuration.success) {
      return { error: "Duration must be 7, 30, 90, or 365 days" };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.rpc("respond_to_consent", {
    p_consent_id: consentId,
    p_decision: decision,
    p_scopes: decision === "approve" ? scopes : null,
    p_duration_days: durationDays,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/access");
  revalidatePath("/app");
  return {
    success: true,
    message: decision === "approve" ? "Access granted!" : "Request declined",
  };
}

export async function revokeConsentAction(consentId: string) {
  if (!consentId) {
    return { error: "Consent ID is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.rpc("revoke_consent", {
    p_consent_id: consentId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/access");
  revalidatePath("/app");
  return { success: true, message: "Access revoked immediately." };
}

export async function getMyConsentStatusAction(consentId: string) {
  if (!consentId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_consent_status", {
    p_consent_id: consentId,
  });

  if (error || !data) return null;
  return data;
}

export async function logMeasurementViewAction(
  customerId: string,
  what: "viewed_measurements" | "viewed_family"
) {
  if (!customerId) return;
  const supabase = await createClient();
  await supabase.rpc("log_measurement_view", {
    p_customer_id: customerId,
    p_what: what,
  });
}

export async function getPendingRequestsCountAction() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_pending_requests");
  if (error || !data) return 0;
  return data.length;
}
