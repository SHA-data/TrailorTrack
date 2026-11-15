import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are not yet supplied, allow public routes or pass through
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Verify identity using getUser() - do not trust getSession() on server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isCustomerRoute = pathname.startsWith("/app");
  const isTailorRoute = pathname.startsWith("/tailor");

  // If unauthenticated user tries to access protected app routes
  if (!user && (isCustomerRoute || isTailorRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in
  if (user) {
    // Determine user role from profile or user metadata
    let role: string | null = (user.user_metadata?.role as string) || null;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      role = profile?.role || "customer";
    }

    const homePath = role === "tailor" ? "/tailor" : "/app";

    // Prevent logged-in users from visiting auth pages (/login, /signup)
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = homePath;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Role-based route enforcement
    if (role === "customer" && isTailorRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    if (role === "tailor" && isCustomerRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/tailor";
      return NextResponse.redirect(url);
    }
  }

  // Always return the response object that setAll last built
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
