import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Home, Ruler, ShoppingBag, Palette, User, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/marketing/logo";

export const instant = false;

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app");
  }

  // Ensure role is customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "tailor") {
    redirect("/tailor");
  }

  const navItems = [
    { label: "Home", href: "/app", icon: Home },
    { label: "Measurements", href: "/app/measurements", icon: Ruler },
    { label: "Orders", href: "/app/orders", icon: ShoppingBag },
    { label: "Studio", href: "/app/studio", icon: Palette },
    { label: "Profile", href: "/app/profile", icon: User },
  ];

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col pb-20 md:flex-row md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="border-border/80 bg-card hidden w-64 shrink-0 flex-col justify-between border-r p-6 md:flex">
        <div className="space-y-8">
          <Logo />

          <div className="bg-background border-border/70 flex items-center gap-2.5 rounded-xl border p-3">
            <div className="bg-primary/10 border-accent/30 text-primary flex size-8 items-center justify-center rounded-full border font-serif text-sm font-bold">
              {profile?.full_name?.charAt(0) || "C"}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground truncate text-xs font-semibold">
                {profile?.full_name || "Customer"}
              </span>
              <span className="text-accent text-[10px] font-medium tracking-wider uppercase">
                Digital Passport
              </span>
            </div>
          </div>

          <nav className="flex flex-col space-y-1.5" aria-label="Customer Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary hover:bg-muted/70 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-border/60 text-muted-foreground space-y-2 border-t pt-6 font-sans text-xs">
          <div className="text-primary flex items-center gap-1.5 font-medium">
            <ShieldCheck className="text-accent size-4" />
            <span>Encrypted Data</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-tight">
            You own your measurements. Consent-controlled access only.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header Bar */}
        <header className="border-border/80 bg-background/90 sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md md:hidden">
          <Logo />
          <Link
            href="/app/profile"
            className="bg-primary/10 border-accent/40 text-primary flex size-8 items-center justify-center rounded-full border text-xs font-bold"
          >
            {profile?.full_name?.charAt(0) || "C"}
          </Link>
        </header>

        {/* Content Body */}
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="border-border/80 bg-card/95 fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around border-t px-1 py-2 shadow-lg backdrop-blur-md md:hidden"
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-primary flex flex-col items-center justify-center gap-1 rounded-lg px-2.5 py-1 transition-colors"
            >
              <Icon className="size-5" />
              <span className="font-sans text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
