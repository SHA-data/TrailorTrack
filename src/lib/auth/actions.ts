"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// ------------------------------------------------------------------------------
// Zod Schemas
// ------------------------------------------------------------------------------

const signUpSchema = z.object({
  role: z.enum(["customer", "tailor"]),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[0-9]/, "Password must include at least one number"),
  city: z.string().optional(),
  phone: z.string().optional(),
  shopName: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[0-9]/, "Password must include at least one number"),
});

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  city: z.string().optional(),
});

const shopUpdateSchema = z.object({
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// ------------------------------------------------------------------------------
// Server Actions
// ------------------------------------------------------------------------------

export async function signUpAction(formData: FormData) {
  const rawRole = formData.get("role") as string;
  const rawFullName = formData.get("fullName") as string;
  const rawEmail = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;
  const rawCity = (formData.get("city") as string) || undefined;
  const rawPhone = (formData.get("phone") as string) || undefined;
  const rawShopName = (formData.get("shopName") as string) || undefined;

  const result = signUpSchema.safeParse({
    role: rawRole,
    fullName: rawFullName,
    email: rawEmail,
    password: rawPassword,
    city: rawCity,
    phone: rawPhone,
    shopName: rawShopName,
  });

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Invalid input";
    return { error: firstError };
  }

  const { role, fullName, email, password, city, phone, shopName } = result.data;

  if (role === "tailor" && !shopName) {
    return { error: "Shop name is required for tailor accounts" };
  }

  const headerList = await headers();
  const origin = headerList.get("origin") || "http://localhost:3000";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
        city: city || null,
        phone: phone || null,
        shop_name: shopName || null,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If session is immediately available (e.g. email confirmation disabled in project)
  if (data.session) {
    const targetUrl = role === "tailor" ? "/tailor" : "/app";
    return {
      success: true,
      needsEmailConfirmation: false,
      message: "Account created successfully",
      redirectUrl: targetUrl,
    };
  }

  // If confirmation email was dispatched
  return {
    success: true,
    needsEmailConfirmation: true,
    message: `A verification link has been sent to ${email}. Please check your inbox to complete activation.`,
    redirectUrl: undefined,
  };
}

export async function signInAction(formData: FormData) {
  const rawEmail = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || null;

  console.log("[signInAction] Attempting sign-in for:", rawEmail, "redirectTo:", redirectTo);

  const result = signInSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!result.success) {
    console.log("[signInAction] Zod validation failed:", result.error.issues);
    return { error: "Please enter a valid email and password" };
  }

  const { email, password } = result.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.log("[signInAction] Supabase signInWithPassword error:", error?.message);
    return { error: "Invalid email or password" };
  }

  console.log("[signInAction] Supabase auth succeeded for user:", data.user.id);

  // Determine user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role || (data.user.user_metadata?.role as string) || "customer";
  const defaultPath = role === "tailor" ? "/tailor" : "/app";
  const targetPath = redirectTo && redirectTo.startsWith("/") ? redirectTo : defaultPath;

  console.log("[signInAction] Determined role:", role, "Redirecting to:", targetPath);
  redirect(targetPath);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const rawEmail = formData.get("email") as string;
  const result = forgotPasswordSchema.safeParse({ email: rawEmail });

  if (!result.success) {
    return { error: "Please enter a valid email address" };
  }

  const { email } = result.data;
  const headerList = await headers();
  const origin = headerList.get("origin") || "http://localhost:3000";
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always return generic success to prevent email enumeration
  return {
    success: true,
    message:
      "If an account exists with this email, a password reset link has been sent to your inbox.",
  };
}

export async function resetPasswordAction(formData: FormData) {
  const rawPassword = formData.get("password") as string;
  const rawConfirm = formData.get("confirmPassword") as string;

  if (rawPassword !== rawConfirm) {
    return { error: "Passwords do not match" };
  }

  const result = resetPasswordSchema.safeParse({ password: rawPassword });
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid password" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?reset=success");
}

export async function updateProfileAction(formData: FormData) {
  const rawFullName = formData.get("fullName") as string;
  const rawPhone = (formData.get("phone") as string) || undefined;
  const rawCity = (formData.get("city") as string) || undefined;

  const result = profileUpdateSchema.safeParse({
    fullName: rawFullName,
    phone: rawPhone,
    city: rawCity,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid profile data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: result.data.fullName,
      phone: result.data.phone || null,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // Update customer city if provided
  if (result.data.city !== undefined) {
    await supabase
      .from("customers")
      .update({ city: result.data.city || null })
      .eq("user_id", user.id);
  }

  return { success: true, message: "Profile updated successfully" };
}

export async function updateShopAction(formData: FormData) {
  const rawShopName = formData.get("shopName") as string;
  const rawCity = (formData.get("city") as string) || undefined;
  const rawAddress = (formData.get("address") as string) || undefined;
  const rawPhone = (formData.get("phone") as string) || undefined;

  const result = shopUpdateSchema.safeParse({
    shopName: rawShopName,
    city: rawCity,
    address: rawAddress,
    phone: rawPhone,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid shop data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("tailor_shops")
    .update({
      shop_name: result.data.shopName,
      city: result.data.city || null,
      address: result.data.address || null,
      phone: result.data.phone || null,
    })
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Shop details updated successfully" };
}
