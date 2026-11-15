import React from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Shield, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { ProfileEditorForm } from "./profile-editor-form";

export default async function CustomerProfilePage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-primary font-serif text-3xl font-bold tracking-tight">
          Customer Profile & Settings
        </h1>
        <p className="text-muted-foreground font-sans text-sm">
          Manage your personal passport identity and contact preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 border-accent/40 text-primary flex size-12 items-center justify-center rounded-full border font-serif text-xl font-bold">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <CardTitle className="text-foreground font-serif text-xl">
                {profile?.full_name}
              </CardTitle>
              <CardDescription className="font-mono text-xs">{user.email}</CardDescription>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground font-sans capitalize">
            {profile?.role || "Customer"}
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border-border/60 text-muted-foreground flex items-center justify-between border-t pt-3 font-sans text-xs">
            <span className="flex items-center gap-1.5">
              <Shield className="text-accent size-3.5" />
              <span>Role is permanent & immutable</span>
            </span>
            <span>
              {profile?.created_at
                ? `Member since ${profile.created_at.slice(0, 10)}`
                : "Active Passport"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form Component */}
      <ProfileEditorForm
        initialFullName={profile?.full_name || ""}
        initialPhone={profile?.phone || ""}
        initialCity={customer?.city || ""}
        initialFitCategory={customer?.fit_category || "men"}
        initialPreferredUnit={customer?.preferred_unit || "in"}
      />

      {/* Sign Out Section */}
      <Card className="border-destructive/30 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-destructive font-serif text-lg">Account Session</CardTitle>
          <CardDescription className="font-sans text-xs">
            Sign out of your active session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOutAction}>
            <Button type="submit" variant="destructive" size="sm" className="gap-2 font-sans">
              <LogOut className="size-4" />
              <span>Sign Out of TailorTrack</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
