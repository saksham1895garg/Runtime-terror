# AI Agent Handoff & Comprehensive Project Memory
**Project:** Dhara-Soochak (Disaster Risk & Ground Truth Monitoring System)
**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS (v4), Supabase (PostgreSQL + PostGIS), Resend, Lucide-React
**Last Updated:** September 2026

If you are a new AI agent joining this conversation, **READ THIS DOCUMENT THOROUGHLY**. It acts as your full persistent memory of the project's architecture, security boundaries, UI/UX aesthetics, and unresolved bugs. Do not deviate from these established patterns.

---

## 1. Project Structure & Routing Domains
The application is split into distinct functional zones using Next.js Route Groups:
- **Public Portal:** Public-facing map, risk reporting, and advisories.
- **Officer Dashboard (`/dashboard`):** Internal tools for officers to manage ground-truth reports and issue advisories.
- **Developer Console (`app/(developer)`)**: Highly restricted administration console.
  - Features a dark-themed sidebar layout (`layout.tsx`).
  - Contains `/dev-login`, `/dev-dashboard`, and `/dev-dashboard/god-mode`.
- **API Architecture (`app/api/`)**:
  - `/api/risk/grid`: Serves GeoJSON grid data from PostGIS.
  - `/api/tiles/[z]/[x]/[y]`: Vector tile server endpoints.
  - `/api/auth/step-up`: Handles God Mode OTP generation and verification.
  - `/api/developer/bootstrap`: One-time secure root assignment.

## 2. Frontend UI/UX Design System (MANDATORY AESTHETICS)
The user demands **premium, high-end aesthetics**. MVP-looking interfaces are unacceptable.
- **Global Theme:** Deep dark mode (`bg-slate-950`, `bg-black`, `bg-[#050505]`).
- **Typography:** Sleek, modern sans-serif. Use `font-mono` for technical data, logs, and system statuses.
- **Accents:** 
  - Emerald (`text-emerald-500`) for nominal/success states.
  - Crimson/Red (`text-red-500`, `bg-red-600/20`) exclusively for High-Risk, God Mode, or Destructive actions.
- **Micro-Animations:** Use Tailwind's `animate-in fade-in slide-in-from-bottom-4 duration-700` for page loads. Use `group-hover` utility classes to add glowing borders, pulsating icons (`animate-pulse`), and smooth scaling (`active:scale-[0.98]`).
- **Components:** We use `lucide-react` for iconography and structural UI components (like `Button`) imported from `@/src/components/ui/`.
- **God Mode Identity:** The God Mode sector specifically utilizes intense red glowing radial gradients (`blur-[50px]`), terminal-like monospace inputs, and stark black cards with dark gray borders.

## 3. Strict Security & Database Architecture (CRITICAL)
- **Deny-by-Default:** Zero permissions are assumed. If an RLS policy is not explicitly written, access is denied.
- **Never Touch `spatial_ref_sys`**: This is a PostGIS extension-managed table. Do not attempt to force RLS, modify grants, or migrate it.
- **Never Hardcode Secrets**: If you need an API key (e.g. Resend, ImageKit), **ask the user**. Pull them from `.env.local`.
- **Service Role for Sensitive Queries**: Tables like `god_mode_sessions`, `developer_identities`, `developer_grants`, `verification_codes`, and `feature_flags` have **ALL frontend privileges revoked** (even for `authenticated` users). To read/write these tables from a backend API or Server Component, you *must* instantiate a Supabase Admin Client using `SUPABASE_SERVICE_ROLE_KEY`.

## 4. Advanced RBAC & Secure Helpers (The `private` Schema)
Because standard users lack `SELECT` grants on identity tables, RLS policies that check user roles *must* use `SECURITY DEFINER` functions to bypass RLS internally.
- We created a `private` schema. `PUBLIC` access is revoked. `USAGE` is granted only to `authenticated`.
- `private.is_root()` and `private.has_my_permission('permission.name')` are used inside RLS policies (e.g. on `audit_logs`).
- *Security Rule:* These functions strictly use `SET search_path = ''` and evaluate `auth.uid()` internally rather than accepting an arbitrary user ID argument. This prevents users from querying others' permissions.

## 5. Security Events & Append-Only Logs
- `audit_logs` and `security_events` are **strictly append-only**.
- **Triggers**: A `private.prevent_modification()` trigger runs `BEFORE UPDATE OR DELETE` to throw a fatal exception. Even application code cannot mutate historical logs.
- `INSERT` is performed entirely via the trusted server-side Service Role.
- `SELECT` is protected via RLS using the secure helper functions mentioned above.

## 6. God Mode & Step-Up Auth Flow
God Mode is an ultra-secure session granted via email OTP, protecting the command center.
- **Generation (`/api/auth/step-up`)**: Verifies `is_root` eligibility via Admin Client, generates a 6-digit code, hashes it (SHA-256), stores it in `verification_codes`, and emails it via Resend.
- **Validation (`/api/auth/step-up/verify`)**: Hashes the user input, compares it, enforces a strict max of 3 attempts (invalidating the code on breach), and issues a 32-byte cryptographically random session token.
- **Cookie Management**: The session token is hashed into `god_mode_sessions` and issued to the browser as an `HttpOnly`, `SameSite=strict`, `Secure` cookie (`GodMode-Token`).
- **Middleware/Backend Validation**: Use `verifyGodMode()` in `utils/auth/godMode.ts` to protect high-risk backend Server Components.

## 7. Major Historical Bug Fixes (Do Not Reintroduce)
- **Infinite Recursion in RLS**: Early on, the map (`/api/risk/grid`) threw 500 errors because the RLS policy on the `users` table checked the `users` table itself. 
  - *Fix:* Replaced direct table lookups in RLS with a `SECURITY DEFINER` function `public.get_my_role()`.
- **Auth Callback 409 Conflict**: Google OAuth logins crashed on first-time profile creation due to cookie propagation delays.
  - *Fix:* `app/auth/callback/route.ts` now uses `upsert: true` and executes the profile creation using the Admin Client.
- **PostgREST Schema Cache (PGRST205)**: When writing SQL migrations directly in the Supabase Dashboard, the API layer failed to recognize new tables causing 500 errors.
  - *Fix:* Run `NOTIFY pgrst, 'reload schema';` in the Supabase SQL editor if schema changes aren't immediately reflected.
- **Windows PowerShell UTF-16 Corruption**: Using `echo X >> .env.local` in PowerShell introduces Null Bytes. Use file-write tools carefully to keep ASCII formatting.

## 8. Current Project State
We have successfully completed all core security phases:
- **Phase 2 (DB Security)**: RLS, Triggers, and Private Security Definers.
- **Phase 3 (Granular Developer Permissions)**: Server actions (`actions.ts`) and the Management UI located at `app/(developer)/dev-dashboard/developers/page.tsx`.
- **Phase 4 (God Mode)**: Cryptographic OTP Step-Up Auth (`app/api/auth/step-up`), highly secure HTTP-Only cookies, and the `GodModeDashboard` UI.
- **Phase 5 (Audit & Security Events)**: Server-side log appendage (`utils/auth/audit.ts`) and the live System Audit Stream UI (`app/(developer)/dev-audit/page.tsx`).
- **Phase 6 (Automated Security Testing)**: Boundary and immutability tests (`scripts/test_auth.ts`). All tests are passing.

### Immediate Next Steps for the AI
1. Read `task.md` to see if the user has added any new objectives. 
2. The internal RBAC, authentication, and God Mode foundation is **100% complete**. 
3. Any future work will likely revolve around the Public Portal, the Officer Dashboard (`/dashboard`), or expanding the core disaster risk features (map views, advisories, etc.). Ensure all new features respect the established RBAC engine (`utils/auth/permissions.ts`) and God Mode boundaries.
