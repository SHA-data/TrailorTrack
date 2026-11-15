# TailorTrack Progress Log

## Phase 0: Project Foundation (Completed)

### 1. What Was Built

- **Framework & Runtime**:
  - Next.js 16 (App Router) initialized with TypeScript in strict mode, Tailwind CSS v4, and ESLint.
  - Directory structure utilizing the `src/` layout.
- **Design Tokens & Palette**:
  - Full Forest Green scale (50–950) with primary brand color at `#1F4D3A`.
  - Cream background scale (50–500) with primary canvas at `#F7F1E3`.
  - Antique Gold accent scale (50–950) with primary accent at `#C9A24B`.
  - Neutral warm ink scale for text (`#1A1F1D`) and subtle boutique borders.
  - All tokens mapped to shadcn/ui semantic CSS variables (`--primary`, `--secondary`, `--accent`, `--card`, `--border`, etc.) with dark-mode scaffolding preserved for future phases.
- **Typography**:
  - Headings & Display: `Cormorant Garamond` serif loaded via `next/font/google` (`--font-cormorant`, `.font-serif`).
  - UI & Controls: `DM Sans` loaded via `next/font/google` (`--font-dm-sans`, `.font-sans`).
- **UI Component Library (shadcn/ui)**:
  - Installed and styled exactly 10 required primitives:
    1. `button`
    2. `card`
    3. `input`
    4. `label`
    5. `dialog`
    6. `sheet`
    7. `tabs`
    8. `badge`
    9. `skeleton`
    10. `sonner` (rich toasts)
- **Folder Architecture**:
  - `src/app/(marketing)/` — Public landing site
  - `src/app/(auth)/` — Customer and tailor authentication flows
  - `src/app/(customer)/` — Customer digital passport and measurement portal
  - `src/app/(tailor)/` — Tailor scan-and-order portal
  - `src/components/ui/` — Atomic shadcn components
  - `src/components/shared/` — Shared UI headers, drawers, and layouts
  - `src/lib/` — General utility helpers (`cn`)
  - `src/lib/supabase/` — Supabase browser client (`client.ts`) and server client (`server.ts`) via `@supabase/ssr`
  - `src/lib/content/` — Centralized dictionary (`content`) for Urdu localization readiness
  - `src/types/` — Shared domain models and TypeScript interfaces
  - `docs/` — Project specifications and progress tracking
- **Environment & Secrets**:
  - Created `.env.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Verified `.env.local` and all `.env*.local` variants are gitignored.
- **Developer Tooling**:
  - Prettier configuration with `prettier-plugin-tailwindcss`.
  - Scripts: `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`.
- **Temporary Verification Page**:
  - Interactive test bench at `/` exhibiting both fonts, all 4 color scales, and live interactive examples of all 10 shadcn components (including dialog modals, mobile sheets, tabs, and sonner toasts).

---

### 2. How to Run & Verify

```bash
# 1. Install dependencies
npm install

# 2. Run developer tooling verification
npm run format:check
npm run lint
npm run typecheck
npm run build

# 3. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the temporary verification page.

---

### 3. Checklist for Phase 1 (Authentication & Core Navigation)

- [ ] Connect live Supabase project and set credentials in `.env.local`
- [ ] Create initial Supabase migrations: `profiles` table (role: `customer` | `tailor`), RLS policies
- [ ] Implement Supabase Auth email/magic link and OTP verification in `src/app/(auth)`
- [ ] Create Next.js authentication middleware for role-based route protection
- [ ] Build shared mobile-first navigation shell for Customer and Tailor views
- [ ] Replace temporary homepage with Phase 1 marketing landing page in `src/app/(marketing)`
