import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LogOut, ShieldCheck, Mail, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { signOutAction } from "@/lib/auth/actions";
import { ShopEditorForm } from "./shop-editor-form";

export const instant = false;

export default async function TailorShopPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role, created_at")
    .eq("id", user.id)
    .single();

  const { data: shop } = await supabase
    .from("tailor_shops")
    .select("id, shop_name, city, address, phone, created_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <span className="text-accent text-xs font-semibold tracking-wider uppercase">
          Settings & Identity
        </span>
        <h1 className="text-foreground mt-1 font-serif text-3xl font-normal tracking-tight">
          Shop & Master Profile
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your business information and tailoring credentials.
        </p>
      </div>

      {/* Account Overview Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="text-muted-foreground size-4 shrink-0" />
            <span className="text-foreground">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <UserCheck className="text-primary size-4 shrink-0" />
            <span className="text-foreground font-medium">{profile?.full_name || "Tailor"}</span>
            <span className="bg-accent/20 text-accent-700 dark:text-accent-400 rounded px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase">
              Tailor Account
            </span>
          </div>
          <div className="text-muted-foreground border-border/60 flex items-center gap-3 border-t pt-1 text-xs">
            <ShieldCheck className="text-accent size-4 shrink-0" />
            <span>Row-level security active: Shop data is isolated to your account.</span>
          </div>
        </CardContent>
      </Card>

      {/* Editable Shop Form */}
      <ShopEditorForm
        initialShopName={shop?.shop_name || ""}
        initialCity={shop?.city || ""}
        initialAddress={shop?.address || ""}
        initialPhone={shop?.phone || profile?.phone || ""}
      />

      {/* Sign Out Card */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-foreground text-sm font-semibold">End Session</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Securely sign out of your master tailor dashboard.
            </p>
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
