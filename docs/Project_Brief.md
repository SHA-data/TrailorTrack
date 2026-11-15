# TailorTrack: Project Brief

## What it is

A customer-owned "digital tailoring passport" for Pakistan. Customers keep their body
measurements, style preferences, saved designs and order history in one account, shown
as a QR code. Any participating tailor scans it (with the customer's consent), views
measurements, creates orders and updates order status. Customers can also preview
garments in a Design Studio, in 2D (fabric and style mockups) and in real-time 3D
(live camera try-on).

## Product direction

- B2C first: the CUSTOMER owns the data. Tailors get consent-based access.
- Tailors need a light, fast scan-and-order experience, not a heavy dashboard.

## Users and roles

- customer: owns profile, measurements, family profiles, orders, saved looks
- tailor: belongs to a shop, scans QR, requests/uses consent, creates orders,
  updates status
- (admin is out of scope for v1)

## Core data model (high level)

profiles (user, role), customers, family_members, measurements (versioned history),
tailor_shops, consents (customer <-> shop, with scope + expiry + revoked flag),
orders, order_status_history, saved_looks, fabrics, notifications.

## Tech stack (free and open source only)

Next.js App Router + TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth,
Storage, RLS), Three.js via React Three Fiber, MediaPipe Pose Landmarker (runs in the
browser), qrcode, Resend (email).

## Design direction

Premium boutique feel. Palette: deep forest green, cream, gold accents. Serif display
font for headings (e.g. Cormorant Garamond or Playfair Display), clean sans for UI
(e.g. Inter or DM Sans). Mobile-first, since tailors and customers will mostly use
phones. Generous spacing, soft shadows, subtle motion. Accessible contrast.

## Rules for the agent

1. Mobile-first and responsive everywhere.
2. TypeScript strict mode. No `any` without a comment explaining why.
3. Never put secrets in code. Use .env.local and keep .env.example updated.
4. Every database table gets Row Level Security. Customers can only read their own
   data. Tailors can only read a customer's data with an active, unexpired consent.
5. Keep dependencies lean (the developer's laptop is old). No heavy libraries unless
   necessary.
6. Write small, reusable components. Keep files under ~250 lines.
7. After each phase, update docs/PROGRESS.md with what was built, what is pending,
   and how to test it.
8. Prefer free tiers. Never add a paid service without asking.
9. English UI for now, but keep all user-facing text in a central file so Urdu can be
   added later.
