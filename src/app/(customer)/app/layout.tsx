import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  Home,
  Ruler,
  Users,
  ShoppingBag,
  User,
  ShieldCheck,
  QrCode,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/marketing/logo";
import { AccessBadge } from "@/components/customer/access-badge";
import { NotificationBell } from "@/components/customer/notification-bell";

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

  // Fetch unread notification count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  // Desktop navigation items
  const desktopNavItems = [
    { label: "Home", href: "/app", icon: Home },
    { label: "Passport", href: "/app/measurements", icon: Ruler },
    { label: "My QR", href: "/app/passport", icon: QrCode },
    { label: "Access & Security", href: "/app/access", icon: KeyRound, hasBadge: true },
    { label: "Family", href: "/app/family", icon: Users },
    { label: "Orders", href: "/app/orders", icon: ShoppingBag },
    { label: "Profile", href: "/app/profile", icon: User },
  ];

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col pb-20 md:flex-row md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="border-border/80 bg-card hidden w-64 shrink-0 flex-col justify-between border-r p-6 md:flex">
        <div className="space-y-6">
          <Logo />

          <div className="bg-background border-border/70 flex items-center justify-between gap-2.5 rounded-xl border p-3">
            <div className="flex min-w-0 items-center gap-2.5">
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
            <NotificationBell initialCount={unreadCount || 0} />
          </div>

          <nav className="flex flex-col space-y-1.5" aria-label="Customer Navigation">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary hover:bg-muted/70 flex items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.hasBadge && <AccessBadge />}
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
          <div className="flex items-center gap-2">
            <NotificationBell initialCount={unreadCount || 0} />
            <Link
              href="/app/passport"
              className="border-accent/40 bg-primary/10 text-primary flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
            >
              <QrCode className="text-accent size-3.5" />
              <span>Passport</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar (5 Items with Center Elevated QR) */}
      <nav
        className="border-border/80 bg-card/95 fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around border-t px-2 py-1.5 shadow-lg backdrop-blur-md md:hidden"
        aria-label="Mobile Bottom Navigation"
      >
        {/* 1. Home */}
        <Link
          href="/app"
          className="text-muted-foreground hover:text-primary flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-colors"
        >
          <Home className="size-5" />
          <span className="font-sans text-[10px] font-medium">Home</span>
        </Link>

        {/* 2. Measurements */}
        <Link
          href="/app/measurements"
          className="text-muted-foreground hover:text-primary flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-colors"
        >
          <Ruler className="size-5" />
          <span className="font-sans text-[10px] font-medium">Passport</span>
        </Link>

        {/* 3. My QR - Elevated Center Button */}
        <Link
          href="/app/passport"
          className="group relative -top-3 flex flex-col items-center justify-center"
        >
          <div className="bg-primary text-primary-foreground border-accent shadow-accent/20 flex size-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform group-hover:scale-105 active:scale-95">
            <QrCode className="text-accent size-6" />
          </div>
          <span className="text-primary mt-0.5 font-sans text-[10px] font-semibold">My QR</span>
        </Link>

        {/* 4. Access (with live badge) */}
        <Link
          href="/app/access"
          className="text-muted-foreground hover:text-primary relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="relative">
            <KeyRound className="size-5" />
            <div className="absolute -top-1.5 -right-3">
              <AccessBadge />
            </div>
          </div>
          <span className="font-sans text-[10px] font-medium">Access</span>
        </Link>

        {/* 5. Profile */}
        <Link
          href="/app/profile"
          className="text-muted-foreground hover:text-primary flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-colors"
        >
          <User className="size-5" />
          <span className="font-sans text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
