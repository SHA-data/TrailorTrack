import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (next && next.startsWith("/")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role || (data.user.user_metadata?.role as string) || "customer";
      const targetPath = role === "tailor" ? "/tailor" : "/app";

      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  // Return to login with error notice if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
