# Supabase Database Setup & Verification Guide

Follow these clear, step-by-step instructions to set up your Supabase database schema and verify Row Level Security (RLS) enforcement. No local Docker installation or CLI is required.

---

## Step 1: Open Supabase SQL Editor

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your **TailorTrack** project.
3. In the left navigation sidebar, click on **SQL Editor** (icon: `>_`).
4. Click **New query** (or `+`).

---

## Step 2: Run Core Migration (`0001_core.sql`)

1. Open the file [`supabase/migrations/0001_core.sql`](file:///c:/Users/n%20tech/Downloads/TailorTrack/supabase/migrations/0001_core.sql).
2. Copy the entire contents and paste into the SQL Editor.
3. Click the green **Run** button (or press `Cmd/Ctrl + Enter`).
4. You should see `Success. No rows returned`.

### What this migration creates:

- **`public.profiles`**: User profile referencing `auth.users(id)` with roles (`customer` or `tailor`).
- **`public.customers`**: Customer record with 128-bit cryptographically secure random `qr_token`.
- **`public.tailor_shops`**: Tailor shop details owned by tailor users.
- **`public.consents`**: Explicit customer-tailor permission records with scope checking and single active consent index.
- **Automatic Provisioning Trigger**: `handle_new_user()` on `auth.users` insert automatically generates matching profile and customer/shop records based on registration metadata.
- **Immutability Enforcement**: Prevents direct unauthorized updates to roles, user IDs, or QR tokens.
- **Strict Row Level Security (RLS)**: Enforces customer ownership, tailor shop ownership, and zero access for anonymous users.

---

## Step 3: Run RLS Verification Test (`rls_checks.sql`)

1. Click **New query** in the SQL Editor.
2. Open [`supabase/tests/rls_checks.sql`](file:///c:/Users/n%20tech/Downloads/TailorTrack/supabase/tests/rls_checks.sql).
3. Copy the entire contents, paste into the SQL Editor, and click **Run**.
4. In the **Messages / Output** tab below the query editor, you will see real-time notices:
   ```text
   CHECK 1.1: PASS - Customer A cannot select Customer B profile
   CHECK 1.2: PASS - Customer A cannot select Customer B customer row
   CHECK 2.1: PASS - Tailor has zero direct select on customers table
   CHECK 2.2: PASS - Tailor cannot select Customer A profile with no consent
   CHECK 3.1: PASS - Direct UPDATE of profiles.role is blocked by trigger
   CHECK 3.2: PASS - Direct UPDATE of customers.qr_token is blocked
   CHECK 3.3: PASS - Dedicated rotate_my_qr_token() generates valid token
   CHECK 4.1: PASS - Tailor can create pending consent for their own shop
   CHECK 4.2: PASS - Tailor cannot insert consent for another shop
   CHECK 5.1: PASS - has_active_consent() is false for pending consent
   CHECK 5.2: PASS - has_active_consent() is true for valid active consent
   CHECK 5.3: PASS - has_active_consent() is false for ungranted scope
   CHECK 5.4: PASS - has_active_consent() is false for revoked consent
   CHECK 5.5: PASS - has_active_consent() is false for expired consent
   CHECK 6.1: PASS - anon cannot select from profiles
   CHECK 6.2: PASS - anon cannot select from customers
   CHECK 6.3: PASS - anon cannot select from tailor_shops
   CHECK 6.4: PASS - anon cannot select from consents
   ==============================================================
   ALL 6 RLS CHECKS PASSED SUCCESSFULLY (100% VERIFIED)
   ==============================================================
   ```
5. All test users and temporary consent records are automatically wiped clean upon completion.

---

## Step 4: Add Environment Keys to `.env.local`

In your local workspace:

1. Copy your Project URL and Publishable (anon) API key from **Project Settings → API**.
2. Paste them into `.env.local` (which is strictly gitignored):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sbp_...
   ```
