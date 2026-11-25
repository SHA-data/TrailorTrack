import { NextResponse } from "next/server";
import { connection } from "next/server";

export async function GET() {
  await connection();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: "config_error",
          message: "Missing Supabase environment variables",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Ping Supabase Auth service to keep instance warm and active
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: supabaseKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          status: "upstream_error",
          upstreamStatus: res.status,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(
      {
        status: "ok",
        app: "TailorTrack",
        service: "healthy",
        supabase: "connected",
        supabaseVersion: data?.version ?? "unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
