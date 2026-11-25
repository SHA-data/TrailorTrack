"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const deleteAccountSchema = z.object({
  confirmEmail: z.string().trim().email("Please enter your account email address"),
});

export interface ExportDataResult {
  data?: Json;
  error?: string;
}

export interface DeleteAccountResult {
  success?: boolean;
  errorCode?: "open_orders_exist" | "email_mismatch" | "not_authenticated" | "unexpected";
  error?: string;
}

export async function exportMyDataAction(): Promise<ExportDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again to download your data." };
  }

  const { data, error } = await supabase.rpc("export_my_data");
  if (error) {
    return { error: "Could not export your data right now. Please try again." };
  }

  return { data };
}

export async function deleteMyAccountAction(confirmEmail: string): Promise<DeleteAccountResult> {
  const parsed = deleteAccountSchema.safeParse({ confirmEmail });
  if (!parsed.success) {
    return {
      errorCode: "email_mismatch",
      error: parsed.error.issues[0]?.message ?? "Please enter your account email address.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return {
      errorCode: "not_authenticated",
      error: "Your session has expired. Please sign in again.",
    };
  }

  if (parsed.data.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
    return {
      errorCode: "email_mismatch",
      error: "The email entered does not match your account email.",
    };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.message?.includes("open_orders_exist")) {
      return {
        errorCode: "open_orders_exist",
        error: "You still have open orders that must be completed or cancelled first.",
      };
    }
    return {
      errorCode: "unexpected",
      error: "Could not delete your account right now. Please try again.",
    };
  }

  await supabase.auth.signOut();
  return { success: true };
}
