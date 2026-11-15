# TailorTrack Progress Log

## Phase 0: Project Foundation (Completed)

### 1. What Was Built

- **Framework & Runtime**: Next.js 16 (App Router) initialized with TypeScript strict mode, Tailwind CSS v4, ESLint.
- **Design Tokens**: Forest green scale (50–950, primary `#1F4D3A`), Cream scale (50–500, background `#F7F1E3`), Gold scale (50–950, accent `#C9A24B`), Neutral warm ink (`#1A1F1D`).
- **Typography**: `Cormorant Garamond` (display serif) and `DM Sans` (UI sans) loaded via `next/font/google`.
- **UI Primitives (10)**: `button`, `card`, `input`, `label`, `dialog`, `sheet`, `tabs`, `badge`, `skeleton`, `sonner`.
- **Folder Architecture**: `src/app/(marketing)`, `src/app/(auth)`, `src/app/(customer)`, `src/app/(tailor)`, `src/components/ui`, `src/components/shared`, `src/lib/supabase`, `src/lib/content`, `src/types`, `docs`.
- **Supabase SSR Helpers**: Browser & server client helpers with `.env.example`.
- **Tooling**: Prettier + Tailwind plugin, scripts for `format`, `lint`, `typecheck`, `build`.

---

## Phase 1: Public Landing Site (Completed)

### 1. What Was Built

- **Marketing Shell & Layout (`src/app/(marketing)/layout.tsx`)**:
  - Sticky boutique navigation bar (`Navbar`) with SVG needle-and-thread logo mark, navigation anchors, CTA buttons, and mobile menu trigger.
  - Mobile drawer navigation (`MobileNav`) powered by shadcn `Sheet` with accessible sheet triggers and navigation links.
  - Boutique Footer (`Footer`) featuring brand wordmark, product links, professional links, legal links, and "Made in Pakistan" cultural badge.
- **11 Ordered Landing Page Sections (`src/app/(marketing)/page.tsx`)**:
  1. _Sticky Navbar_: Logo, links (How it works, Features, Design Studio, For tailors, FAQ), "Create Passport" CTA button, mobile drawer.
  2. _Hero Section_: Display headline (_"Your measurements. Your style. Your tailor. Always with you."_), value proposition, primary and secondary CTAs, and a pure CSS/SVG floating smartphone mockup displaying the customer's Kameez Shalwar digital passport card and biometric QR code.
  3. _Problem Strip_: 4 icon cards highlighting Pakistani tailoring friction (lost measurement diaries, re-measuring fatigue, unpredictable delivery dates, and style/fit disputes).
  4. _How It Works_: 3-step connected timeline (_Create your passport_, _Show your QR at any tailor_, _Preview & track your order_) with luxury gold step indicators.
  5. _Features Grid_: 6 value cards (_Measurements that travel with you_, _Live milestone order tracking_, _Family profiles_, _Saved looks & fabric archive_, _Consent & privacy control_, _Complete stitching history_).
  6. _Try-on Showcase_: Interactive Design Studio teasing 2D and 3D capabilities via shadcn `Tabs`. Includes interactive 2D Kurta SVG vector with 5 swappable luxury fabric swatches (Emerald, Ruby, Indigo, Ivory, Gold) updating the garment in real time; plus a futuristic 3D wireframe preview labeled "Coming Soon".
  7. _Privacy & Consent Control_: 3 customer sovereignty pillars (_You approve each tailor_, _You choose what they see_, _You can revoke anytime_).
  8. _For Tailors Teaser_: High-contrast boutique band inviting Pakistani master tailors and shops to eliminate disputes, with CTA linking to `/for-tailors`.
  9. _FAQ Section_: 7 common questions answered with accessible native HTML `<details>` and `<summary>` accordions styled with smooth chevron rotation and zero additional dependencies.
  10. _Final CTA Band_: Forest green and antique gold banner prompting customer registration.
  11. _Footer_: Comprehensive navigation, legal links, copyright, and "Designed and crafted with pride in Pakistan" badge.
- **Dedicated Marketing Pages**:
  - `src/app/(marketing)/for-tailors/page.tsx`: Dedicated tailor partner proposition page highlighting 4 core business benefits and partner network registration CTA.
  - `src/app/(marketing)/privacy/page.tsx`: Structured Privacy Policy placeholder.
  - `src/app/(marketing)/terms/page.tsx`: Terms of Service placeholder.
- **Custom 404 Page (`src/app/not-found.tsx`)**:
  - Boutique 404 page ("Lost the Thread?") in Forest Green and Cream with needle-and-thread emblem and "Return to Safe Tailoring" CTA.
- **SEO & Metadata Infrastructure**:
  - `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/icon.tsx`.

---

## Phase 2: Authentication, User Roles & Secure Database Foundation (Completed)

### 1. What Was Built

- **Cleanup from Phase 1**:
  - Removed all developer-facing "Phase X" strings from public UI copy, replaced with clean "Coming soon".
  - Refined tagline to neutral positioning: _"A digital tailoring passport made for Pakistan."_
  - Replaced "biometric" throughout the UI with _"secure QR passport"_ / _"camera pose estimation"_.
  - Added "Sample" label near the demo customer in the hero phone mockup.
- **Environment & Proxy Architecture**:
  - Renamed client environment variable to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.example`, `client.ts`, and `server.ts`.
  - Zero reference to any service-role key anywhere in client or server code.
  - Created `src/proxy.ts` (Next.js 16 file convention, exporting `proxy(request)`) with official `@supabase/ssr` `updateSession` cookie synchronization (`getAll` / `setAll`).
  - Strict route protection in proxy:
    - Unauthenticated requests to `/app/*` or `/tailor/*` are redirected to `/login` preserving target path in `redirectTo`.
    - Authenticated users visiting `/login` or `/signup` are redirected to their designated shell (`/app` for customers, `/tailor` for tailors).
- **Database Schema & Migrations (`supabase/migrations/0001_core.sql`)**:
  - `profiles`: `id references auth.users`, `role text check ('customer', 'tailor')`, `full_name`, `phone`, `avatar_url`, timestamps. Role and ID column immutability enforced by trigger.
  - `customers`: `id uuid`, `user_id references profiles`, `city`, `qr_token text not null unique` (generated with 128-bit cryptographically secure randomness via `encode(gen_random_bytes(16), 'hex')`), `qr_token_rotated_at`.
  - `tailor_shops`: `id uuid`, `owner_id references profiles`, `shop_name`, `city`, `address`, `phone`, timestamps.
  - `consents`: `id uuid`, `customer_id references customers`, `shop_id references tailor_shops`, `status check ('pending','approved','revoked','expired')`, `granted_at`, `expires_at`, `revoked_at`.
  - Security definer functions: `rotate_my_qr_token()`, `is_customer_owner()`, `is_shop_owner()`, `has_active_consent()`.
  - Row Level Security (RLS) enabled on all 4 tables with granular policies. Anon role explicitly revoked from all data modification.
- **RLS Verification Test Suite (`supabase/tests/rls_checks.sql`)**:
  - 6 comprehensive security assertions checking customer isolation, tailor isolation, immutability of roles, consent creation constraints, `has_active_consent` evaluation across states, and anonymous lockout.
- **Authentication Flows & Server Actions (`src/lib/auth/actions.ts`)**:
  - `signUpAction`: Validates role, name, email, password, and optional shop name with Zod; signs up with Supabase; provides informative confirmation toast.
  - `signInAction`: Signs in with email/password; anti-enumeration error messages; automatically redirects to role-appropriate home (`/app` vs `/tailor`).
  - `signOutAction`: Signs out and redirects to `/login`.
  - `forgotPasswordAction` & `resetPasswordAction`: Complete password recovery loop.
  - `updateProfileAction`: Customer profile updating (name, phone, city).
  - `updateShopAction`: Tailor shop updating (shop name, city, address, phone).
  - `src/app/auth/callback/route.ts`: PKCE code exchange handler.
- **Auth UI Pages (`src/app/(auth)/`)**:
  - `signup/page.tsx`: Role toggle (Customer vs Master Tailor), tailored fields, show/hide password, live strength requirements, loading states.
  - `login/page.tsx`: Wrapped in `<Suspense>`, anti-enumeration error handling, password reveal toggle.
  - `forgot-password/page.tsx`: Email recovery form.
  - `reset-password/page.tsx`: New password confirmation form.
- **App Shells & Navigation**:
  - **Customer Shell (`src/app/(customer)/app/`)**:
    - `layout.tsx`: Desktop sidebar + mobile bottom navigation, identity card, security badge.
    - `page.tsx`: Overview with personalized greeting, digital passport teaser, QR preview, quick stats.
    - `profile/page.tsx` & `profile-editor-form.tsx`: Account status, editable profile information, sign out button.
    - `measurements/page.tsx`, `orders/page.tsx`, `studio/page.tsx`: Feature placeholders with boutique styling.
    - `loading.tsx` & `error.tsx`: Skeleton loading states and client error boundaries.
  - **Tailor Shell (`src/app/(tailor)/tailor/`)**:
    - `layout.tsx`: Desktop sidebar + mobile bottom navigation, shop name badge, consent security badge.
    - `page.tsx`: Master intake dashboard, quick QR scanner launcher, active orders, pending fittings, client metrics.
    - `shop/page.tsx` & `shop-editor-form.tsx`: Account credentials, editable shop details, sign out button.
    - `scan/page.tsx`, `orders/page.tsx`, `customers/page.tsx`: Tailor intake placeholders.
    - `loading.tsx` & `error.tsx`: Skeleton loader and error boundaries.

---

## Phase 3: Customer Profile Completion, Family Profiles & Versioned Measurement Passport (Completed)

### 1. What Was Built

- **Cleanup from Phase 2**:
  - Removed all developer-facing "Phase X" strings from `privacy/page.tsx`, `terms/page.tsx`, and dashboards.
  - Eliminated hardcoded placeholder numbers and metrics (`0/0/0`).
  - Partner tailor dashboard now features a clean "Getting Started as a Partner Tailor" checklist with live shop profile completeness detection.
  - Customer overview dashboard now displays real counts (total measurements, family members, active orders) and a dynamic profile completion progress bar (0–100%).
- **Database Architecture (`supabase/migrations/0002_measurements.sql`)**:
  - `customers`: Added `fit_category text check (fit_category in ('men','women','boys','girls'))` and `preferred_unit text not null default 'in' check (preferred_unit in ('in','cm'))`.
  - `family_members`: `id`, `customer_id references customers(id)`, `full_name`, `relation check in ('spouse','son','daughter','father','mother','brother','sister','other')`, `fit_category`, `created_at`, `updated_at`, with `unique(id, customer_id)`.
  - `trg_family_members_cap`: Trigger strictly capping each customer at a maximum of 10 family members.
  - `measurement_sets` (Append-Only Versioned History):
    - `id`, `customer_id references customers(id)`, `family_member_id uuid null`.
    - Composite foreign key `foreign key (family_member_id, customer_id) references public.family_members(id, customer_id) on delete cascade`, making it impossible at the database level for Customer A to link measurements to Customer B's family member.
    - `garment_type check in ('kameez','shirt','shalwar','trouser','waistcoat','sherwani','coat')`.
    - `values jsonb not null`: Validated as a non-empty JSON object under 4 KB.
    - `fit_preference check in ('slim','regular','loose')`, `notes text (max 500 chars)`, `source check in ('self','tailor')`, `shop_id references tailor_shops(id)`.
    - `taken_on date not null default current_date`, `created_at timestamptz default now()`.
    - Composite index `idx_measurement_sets_query` on `(customer_id, family_member_id, garment_type, created_at desc)`.
  - `trg_measurement_sets_immutability`: Trigger blocking updates to any column other than `notes`, ensuring measurement history is strictly append-only.
  - Explicit RLS policies enforcing customer ownership and consent-based tailor read access (`has_active_consent(shop, customer_id, 'measurements')`). Anon privileges revoked.
- **RLS Verification Test Suite (`supabase/tests/rls_checks_phase3.sql`)**:
  - 7 comprehensive security assertions verifying:
    1. Customer A cannot read, insert, or delete Customer B's family members or measurement sets.
    2. Customer cannot insert a measurement set with `source='tailor'` or a `shop_id`.
    3. Customer cannot attach a set to another customer's family member (composite FK guard).
    4. 11th family member insertion is rejected by database trigger.
    5. Measurement `values` cannot be modified, while `notes` remain editable.
    6. Tailor consent matrix: tailors with active consent on 'measurements' read sets and family members; tailors without consent, or with pending/revoked/expired/orders-only consents read nothing.
    7. Anonymous role reads nothing.
- **Unit & Fraction Parsing Engine (`src/lib/measurements/units.ts`)**:
  - Canonical database storage in inches.
  - Transparent conversion between inches and centimeters (`in` vs `cm`), rounding to nearest 0.25".
  - Flexible fraction parsing: handles decimal strings (`"15.5"`), standard fractions (`"15 1/2"`, `"15-1/2"`, `"1/2"`), and Unicode vulgar fractions (`"15½"`, `"40¼"`, `"15¾"`).
  - Fraction formatter: formats `15.5` as `15 1/2"`.
  - Delta formatter: displays measurement deltas with intuitive +/- badges and color-coding.
  - Self-checking unit test script (`scripts/verify-units.mjs`) verified with 100% test coverage.
- **Measurement Templates & Pakistani Garment Specs (`src/lib/measurements/templates.ts`)**:
  - Full Pakistani tailoring taxonomy with authentic terms: Length (`Lambai`), Shoulder (`Teera`), Chest (`Chhati`), Waist (`Kamar`), Hip (`Gheera`), Hem Width (`Daman`), Sleeve (`Astin`), Cuff (`Kaf`), Neck/Collar (`Gala / Coller`), Armhole (`Mondha`), Bottom Opening (`Pancha`).
  - Covers Men, Women, Boys, and Girls across 7 garment types with anatomical measuring tips, min/max bounds, and 0.25" steps.
  - Dynamic Zod schema generator (`createMeasurementValuesSchema`) keeping client forms and server validation tightly synchronized.
- **Features & Screens**:
  - **First-Login Onboarding Wizard (`src/components/customer/onboarding-wizard.tsx`)**:
    - 3-step modal dialog displayed until `fit_category` is set: Step 1 (Fit category & unit), Step 2 (Phone & city), Step 3 (First measurement prompt).
  - **Family Management Hub (`/app/family`)**:
    - Manage up to 10 family members with colorful initial avatars, relation tags, fit categories, Add/Edit dialogs, and Delete confirmation modals.
  - **Measurements Passport Hub (`/app/measurements`)**:
    - Horizontal person switcher chips ("Me" + family members).
    - Grid of garment cards per fit category displaying the latest measurement date, fit preference tag, key measurements preview, or "+ Add" empty states.
  - **New Measurement Entry Form (`/app/measurements/new`)**:
    - Template-driven form with Urdu tailoring terms, expandable "How to measure" tips, decimal/fraction inputs, in/cm toggle, fit preference selector, notes, and measurement date.
  - **Measurement Set Detail & History View (`/app/measurements/[setId]`)**:
    - Full measurement breakdown with comparison deltas against previous sets (`+0.5"`, `-0.25"`).
    - Inline SVG trend sparkline showing measurement progression over time.
    - Editable notes drawer / modal.
    - One-tap WhatsApp sharing link (`wa.me/?text=...`) formatted with boutique greeting and full measurements list.
    - "Copy as Plain Text" clipboard action and Delete confirmation dialog.
  - **Profile Settings (`/app/profile`)**:
    - Added Passport Preferences card for updating default fit category and preferred units.
  - **Navigation**:
    - Updated customer sidebar and bottom navigation with "Passport" (`/app/measurements`) and "Family" (`/app/family`).
- **Verification**:
  - `node scripts/verify-units.mjs`: PASSED
  - `npm run typecheck`: PASSED (0 errors)
  - `npm run lint`: PASSED (0 errors, 0 warnings)
  - `npm run format`: PASSED
  - `npm run build`: PASSED (28 routes compiled clean with partial prerendering)

---

### 2. How to Run & Verify

```bash
# 1. Developer tooling checks
npm run format
npm run lint
npm run typecheck
npm run build

# 2. Database migration (Manual paste in Supabase Dashboard):
# Paste supabase/migrations/0001_core.sql into Supabase SQL Editor and run.
# Paste supabase/tests/rls_checks.sql into Supabase SQL Editor and run (verify "ALL RLS CHECKS PASSED").

# 3. Environment keys:
# Ensure .env.local contains:
# NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

---

## Phase 4: Customer QR Passport, Tailor Scanner & Consent Handshake (Completed)

### 1. What Was Built

- **Security & Privacy Architecture**:
  - Zero-direct discovery queries by tailors on `customers`, `profiles`, or `consents`.
  - All tailor lookups, consent dispatches, and client fetching run through 10 `SECURITY DEFINER` RPCs with `search_path = ''`.
  - Scans expose only masked names (`"Ahmed K."`) and relationship status; never expose customer ID, phone, city, or measurements.
  - Rate limiting: 15 failed lookups per hour triggers automatic throttle lockout in `lookup_passport`.
  - 3-day privacy cooldown enforced after a customer declines a shop.
  - Transparent access audit log: every profile/measurement view by a tailor writes to `access_log` (with a 30-minute anti-spam de-duplication window).
- **Database Architecture (`supabase/migrations/0003_access_flow.sql`)**:
  - `consents`: Added `requested_scopes text[]` and `responded_at timestamptz`.
  - Trigger `trg_consents_state_machine`: Strictly enforces `pending -> active | declined`, `active -> revoked`, terminal states, scope subset validation, and 365-day max expiry. Direct client updates locked down.
  - `access_log`: Immutable table with RLS enabled; customers can view their own rows; direct insert/update/delete blocked.
  - `qr_lookup_attempts`: Internal throttling table for rate limiting.
  - 10 SECURITY DEFINER RPCs: `lookup_passport`, `request_access`, `respond_to_consent`, `revoke_consent`, `my_consent_status`, `list_my_consented_customers`, `get_consented_customer`, `log_measurement_view`, `list_pending_requests`, `list_my_access`.
- **RLS Verification Test Suite (`supabase/tests/rls_checks_phase4.sql`)**:
  - 11 comprehensive automated assertions verifying masking, throttling, cooldowns, state machine boundaries, isolation, audit logging, scope enforcement, token rotation independence, and anon lockout.
- **Dependencies**:
  - `qrcode` (+ `@types/qrcode`) for server-side vector SVG generation.
  - `qr-scanner` (Nimiq, MIT) for in-browser camera scanning with back-camera priority, flashlight toggle, and clean unmounting.
  - `html-to-image` for 3x resolution PNG passport card download.
- **Customer Screens**:
  - 5-item mobile bottom navigation with elevated center "My QR" passport button.
  - `/app/passport`: Forest green + gold passport card, SVG QR, Save as PNG, Print (credit card size 85.6 x 54 mm via print CSS), WhatsApp share (`wa.me/?text=...`), Copy link, and Reset QR modal dialog.
  - `/app/access`: Requests, Active, and Activity audit log tabs with 20s auto-refresh + tab focus.
- **Tailor Screens & Public Gateway**:
  - `/tailor/scan`: Camera scanner with target overlay, flashlight toggle, and manual link/token fallback.
  - `/t/[token]`: Public gateway handling Logged-out, Customer, and Tailor states (request access, live 4s polling while waiting for customer approval, auto-redirect on approval).
  - `/tailor/customers`: Active (with search bar and $\le 3$-day expiry warning) and Pending approval tabs.
  - `/tailor/customers/[customerId]`: Consented client view with read-only measurements and family tabs, invoking `log_measurement_view`.
  - Updated tailor dashboard with live RPC client counts and checklist scan connection.

---

### 2. Checklist for Phase 5: Order Creation & Order Lifecycle Management

- [ ] Database migration for orders:
  - `orders` table (customer_id, shop_id, garment_type, measurement_snapshot jsonb, fabric_notes, delivery_date, status, total_price, advance_paid)
  - `order_status_history` table (order_id, from_status, to_status, notes, changed_by, created_at)
  - Milestones: `received` -> `cutting` -> `stitching` -> `trial_fitting` -> `ready` -> `delivered`
- [ ] Tailor order creation form with measurement snapshot selection
- [ ] Live milestone order tracking screen for customers and tailors
- [ ] WhatsApp status update notifications

