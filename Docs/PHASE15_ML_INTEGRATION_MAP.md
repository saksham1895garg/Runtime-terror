# Phase 15: ML Integration Map

This document establishes the verified, strict data flow connecting the Next.js frontend to the FastAPI ML backend, honoring the `TEST_PREDICTOR` pipeline, asynchronous Celery workers, and the strict public release boundary.

## 1. Developer Prediction Trigger (Synchronous Test)

- **UI Component**: `GridDetailDrawer.tsx` / `dev-dashboard/grids`
- **Next.js Route/Function**: `POST /api/developer/predictions/trigger`
- **FastAPI/Supabase**: FastAPI (via `fetchML`)
- **Exact Endpoint**: `POST /predictions/test` (Port 18000)
- **Data Source**: 
  - FastAPI-derived: `model_name`, `model_version`, `risk_score`, `risk_category`, `confidence`, `input_snapshot`.
  - Supabase-derived: written to `prediction_runs`, `prediction_job_events`, `risk_predictions`.
  - Next.js-computed: Autonomously triggers backend assignment if HIGH risk.
- **Execution**: Synchronous request to FastAPI. `TEST_PREDICTOR` pipeline executes (bypassing Celery for quick tests).
- **Synthetic/Test**: Yes, data uses `TEST_PREDICTOR` logic.

## 2. Prediction Retrieval (Officer/Developer Map)

- **UI Component**: `MapView.tsx` (Officer/Developer), `GridDetailDrawer.tsx`
- **Next.js Route/Function**: `GET /api/risk/grid`
- **FastAPI/Supabase**: Supabase
- **Exact Table**: `analysis_grid_cells` (geometry), `risk_predictions` (scores).
- **Data Source**: 
  - Supabase-derived: `grid_code`, `district`, GeoJSON geometry (from `analysis_grid_cells`).
  - FastAPI-derived (via Supabase): `risk_score`, `risk_category`, `confidence`, `model_name`, `model_version`, `generated_at` (from `risk_predictions`).
  - Next.js-computed: Maps are joined on `grid_code`. Drawer dynamic mapping.
- **Synthetic/Test**: Reflected accurately in UI if `input_snapshot` contains `is_test_data: true`.

## 3. Asynchronous Large-Scale Predictions (Celery)

- **UI Component**: `/dev-dashboard/runs/page.tsx`
- **Next.js Route/Function**: `GET /runs/[id]` (Called directly from client or SSR)
- **FastAPI/Supabase**: FastAPI (via `fetchML`)
- **Exact Endpoint**: `POST /tasks/test-run`
- **Data Source**: 
  - FastAPI-derived: Task ID, Run UUID, queuing status.
  - Supabase-derived: `prediction_runs` tracks terminal status (QUEUED → RUNNING → COMPLETED).
- **Synthetic/Test**: Generates 2271 grid rows using `TEST_PREDICTOR`.

## 4. Officer Integration & Review

- **UI Component**: `(officer)/assignments/page.tsx`, `AssignmentsTable`
- **Next.js Route/Function**: `GET /api/officer/assignments`
- **FastAPI/Supabase**: Supabase
- **Exact Table**: `officer_assignments`
- **Data Source**: 
  - Supabase-derived: `officer_assignments` linked to `risk_predictions`. Extracts `risk_score`, `risk_category`, `confidence` natively for context.
  - Next.js-computed: The frontend does NOT decide assignments. The backend assigns based on the backend pipeline, the frontend purely renders the assignment.
- **Synthetic/Test**: Test predictions flow cleanly into the officer workflow to prove integration.

## 5. Strict Public Release Boundary

- **UI Component**: `app/(public)/page.tsx`, `MapView.tsx`
- **Next.js Route/Function**: `GET /api/public/risk`
- **FastAPI/Supabase**: Supabase
- **Exact Table**: `advisories` joined with `officer_actions` and `analysis_grid_cells`.
- **Data Source**: 
  - Supabase-derived: `advisories` with status `PUBLISHED` matched with `officer_actions` having action `PUBLISH`.
  - Next.js-computed: The public map calculates the max severity exclusively from published advisories.
  - FastAPI-derived: NONE. The public map never queries FastAPI or `risk_predictions`.
- **Enforcement**: Without an explicit record in `advisories`, the Public Map *never* sees the ML prediction, preserving community safety. Developer overrides (`/api/developer/grids/.../override`) bypass prediction but still require an advisory to reach the public.

## 6. Error Handling Strategy

- **Next.js Utility**: `fetchML` (in `utils/api/mlBackend.ts`).
- **Timeout**: Enforced at 4000ms. Yields HTTP 504.
- **Connection Refused**: Yields HTTP 503.
- **FastAPI 422/400**: Propagates structured JSON validation errors.
- **Next.js Handling**: Next.js wraps `fetchML` responses, converting backend failures into graceful HTTP 503/500 JSON responses.
- **UI Result**: UI components display localized error toasts or fallback states without crashing the entire page or hanging indefinitely. No stack traces exposed. No raw internal service IPs exposed.
