# Phase 10: Full Next.js Website & Backend Audit

## 1. Executive Summary
The website architecture consists of a Next.js App Router application integrated with Supabase and a FastAPI ML backend. The foundation for role-based access control (RBAC), authentication, and mapping exists, but several **critical vulnerabilities and disconnects** were identified. The most urgent issues include the complete lack of route protection for the Officer Portal, a missing route causing Developer login to fail, broken TypeScript builds due to syntax errors, and a complete data mismatch where the frontend dashboard queries a different table (`grid_cells`) than the one the ML backend populates (`risk_predictions`).

## 2. Architecture Map
- **Framework:** Next.js 16.3.3 (App Router)
- **Auth:** Supabase Auth (Cookie-based via `@supabase/ssr`)
- **Backend Services:** Supabase (Database, Auth), FastAPI (ML Predictions, on port 18000)
- **Mapping:** Leaflet & React-Leaflet with CARTO basemaps proxied securely.

## 3. Build, Type, and Lint Results
- **Package Installation (`npm ci`):** Succeeded but raised warnings for deprecated packages (`uuid`, `imagekit`, `eslint`). 2 moderate vulnerabilities exist.
- **Linting (`npm run lint`):** **FAILED**. The `eslint` binary is not recognized, meaning linting is completely broken in the local environment.
- **TypeScript (`npx tsc --noEmit`):** **FAILED (CRITICAL)**. The file `app/(developer)/dev-dashboard/runs/page.tsx` contains numerous malformed JSX syntax errors (e.g., missing closing tags, unmatched braces) that prevent the application from building.
- **Tests:** No testing framework (Jest/Vitest/Playwright) is currently configured in `package.json`.

## 4. Authentication Findings
- **Missing Global Middleware:** The Next.js global `middleware.ts` is absent. Route protection relies entirely on layout-level checks, which are currently incomplete.
- **Public Routes:** `app/(auth)/login` handles routing users based on their role after successful authentication.
- **Officer Portal:** **CRITICAL VULNERABILITY**. The `app/(officer)/layout.tsx` file provides NO authentication checks. It only wraps the children in an `<AppShell>`. An unauthenticated user can directly navigate to `/dashboard` and view the portal.

## 5. Developer Login Root Cause
- **Issue:** Developers are trapped in a redirect loop / 404 error when trying to access the developer portal.
- **Root Cause:** The `app/(developer)/layout.tsx` file explicitly checks for a user session and executes `redirect('/dev-login')` if the user is unauthenticated. However, the route `app/dev-login` **does not exist** in the codebase.
- **Fix:** Update the redirect in `app/(developer)/layout.tsx` to point to `/login`, or create a dedicated `/dev-login` page.

## 6. RBAC Findings
- **Developer & God Mode:** Strongly protected. Root status and granular permissions are checked server-side via `isRoot` and `can` utility functions, which securely query the database using the Service Role key.
- **Officer Role:** Currently unenforced on both frontend layouts and backend APIs. 

## 7. Complete API Inventory
| Method | Path | Auth Required? | Role Required? | Current Status | Notes |
|---|---|---|---|---|---|
| POST | `/api/auth/step-up` | Yes | Developer (Root) | WORKING | Secure OTP generation via Resend. |
| POST | `/api/auth/step-up/verify` | Yes | Developer (Root) | WORKING | Verifies OTP, sets secure GodMode-Token. |
| POST | `/api/developer/bootstrap` | Yes | Valid Token | WORKING | Bootstraps first Root user securely. |
| ANY | `/api/officer` | Unknown | Unknown | **BROKEN** | File is completely empty (0 bytes). |
| POST/GET | `/api/reports` | No | None | WORKING | Allows citizen report creation. Rate-limited. |
| GET | `/api/risk/grid` | No | None | WORKING | Fetches `grid_cells`. |
| GET | `/api/risk/roads` | No | None | WORKING | Fetches `road_segments`. |
| GET | `/api/risk/villages` | No | None | WORKING | Fetches `villages`. |
| GET | `/api/tiles/[z]/[x]/[y]` | No | None | WORKING | Secure CARTO tile proxy. |
| GET | `/api/warnings` | No | None | WORKING | Returns mock data. |

## 8. API Collision / Next.js ↔ ML Mismatch
- **CRITICAL DATA DISCONNECT:** 
  - The **FastAPI ML Backend** correctly executes predictions and writes the results to the `risk_predictions` and `prediction_runs` tables.
  - The **Next.js Frontend** (`/api/risk/grid` and the Dashboard Map) fetches data exclusively from the `grid_cells` table.
  - **Result:** The dashboard map will never display the output of the ML models until the frontend API is updated to query `risk_predictions` or a pipeline synchronizes the two tables.

## 9. Supabase Access Matrix
- **Service Role (`service_role`):** Used appropriately and securely in auth/permission utilities (`bootstrap`, `permissions.ts`, `godMode.ts`, `step-up`). No leakage found.
- **Server Client (Authenticated):** Used in Next.js APIs (e.g., `/api/reports`). 
- **Browser Client (Direct mutation):** The `app/(officer)/dashboard/page.tsx` file makes direct client-side queries to `public_reports` and `decision_flags`. If RLS policies are not perfectly configured, this exposes the database to unauthorized reads/writes.

## 10. Portal Audits
- **Officer Portal:** Contains comprehensive UI components (Situation Overview, Asset Drawers, Priority Panel). However, it relies heavily on client-side fetching without route protection.
- **Developer Portal:** Contains God Mode, User Management, and Run Monitoring. Run monitoring (`runs/page.tsx` and `runs/[run_id]/page.tsx`) contains severe syntax errors preventing compilation.
- **Public Portal:** Basic public report creation exists (`/api/reports`). `reporter_type` is correctly forced to `CITIZEN`. 

## 11. Environment / Secret Audit
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly exposed.
- `SUPABASE_SERVICE_ROLE_KEY` and `CARTO_API_KEY` are properly hidden from the browser.
- **Potential Issue:** `IMAGEKIT_PUBLIC_KEY` lacks the `NEXT_PUBLIC_` prefix, meaning it cannot be read natively by client-side browser components unless explicitly passed via server components.

## 12. Automated Testing Recommendation
- **Current State:** No testing framework is installed.
- **Recommendation:**
  - Install **Playwright** for E2E testing (crucial for verifying the map interactions and complex UI panels).
  - Install **Vitest** + **React Testing Library** for component and utility unit testing.
  - Create integration tests for the FastAPI ↔ Next.js boundary.

## 13. Error Hunt & Bug Inventory
- **CRITICAL:** `app/(officer)/layout.tsx` lacks authentication checks.
- **CRITICAL:** Next.js frontend fetches `grid_cells` instead of the ML-populated `risk_predictions`.
- **CRITICAL:** Missing `/dev-login` route traps developers.
- **HIGH:** `app/(developer)/dev-dashboard/runs/page.tsx` has breaking syntax and JSX errors preventing `next build`.
- **HIGH:** `app/(developer)/dev-dashboard/runs/[run_id]/page.tsx` and related files contain **hardcoded FastAPI URLs** (`http://127.0.0.1:18000`). This will fail completely in any staging or production environment. Environment variables (e.g., `NEXT_PUBLIC_ML_API_URL`) must be used.
- **INFO:** `api/officer/route.ts` is empty.

## 14. Performance & Resilience Risks
- **Direct Client Fetching:** The officer dashboard fetches `public_reports` and `decision_flags` directly from the client on mount. Without pagination or limits, this will cause extreme performance degradation as the database grows.
- **Hardcoded Localhost:** The developer dashboard relies on synchronous client/server fetches to `127.0.0.1:18000` with no retry or fallback mechanisms. If the ML backend is down, the pages crash or display raw error text.
