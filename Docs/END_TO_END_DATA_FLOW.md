# End-to-End Data Flow: Tracing a Grid (GNG-000026)

This document traces the complete lifecycle of a single grid cell, **GNG-000026**, through the DHARA-SOOCHAK system. It explicitly identifies the boundary between Next.js, FastAPI, and Supabase, and clarifies exactly where data is synthesized vs derived from persistent storage.

---

## 1. Grid Geometry Source (Supabase)
- **Table**: `analysis_grid_cells`
- **Fields**: `grid_code` ("GNG-000026"), `district`, `geometry` (PostGIS polygon), `cell_size_m`.
- **Data Type**: Supabase-derived (Static GIS Data).
- **Flow**: Supabase holds the foundational geometries. No predictions exist yet.

## 2. Next.js Grid/Map Request (Developer UI)
- **File**: `website/app/(developer)/dev-dashboard/grids/page.tsx`
- **Action**: Developer enters "GNG-000026" and clicks "Inspect", then clicks "Trigger Run".
- **Data Type**: Client-side interaction.
- **Flow**: Browser → Next.js.

## 3. Next.js API Route (Trigger)
- **File**: `website/app/api/developer/predictions/trigger/route.ts`
- **Endpoint**: `POST /api/developer/predictions/trigger`
- **Logic**: Authenticates developer via Supabase session. Relays the request securely to the internal FastAPI backend using the `fetchML` utility (bypassing Celery for a synchronous developer test).
- **Flow**: Next.js Server → FastAPI Server.

## 4. FastAPI Prediction Endpoint
- **File**: `ml/app/api/predictions.py`
- **Endpoint**: `POST /predictions/test` (Internal Port 18000)
- **Logic**: Receives `grid_code="GNG-000026"`. Validates the grid exists in `analysis_grid_cells`. Generates a UUID for `run_id`.
- **Flow**: FastAPI → execution context.

## 5. TEST_PREDICTOR (ML Pipeline)
- **File**: `ml/app/model/test_predictor.py`
- **Data Type**: Synthetic/Test Data.
- **Logic**: The `TEST_PREDICTOR` pipeline runs. Because this is the test backend, it probabilistically generates synthetic environmental inputs (`rainfall_24h`, `slope`, etc.) and a random `risk_score` (0-100) and `risk_category` (e.g., "HIGH"). It tags the output with `model_name="TEST_PREDICTOR"` and `is_test_data=true`.
- **Flow**: Execution context → In-memory results.

## 6. prediction_runs (Supabase)
- **Table**: `prediction_runs` and `prediction_job_events`
- **Data Type**: FastAPI-derived, written to Supabase.
- **Flow**: FastAPI uses Supabase Client to insert a tracking record: `run_id`, `status="COMPLETED"`, `model_name="TEST_PREDICTOR"`.

## 7. risk_predictions (Supabase)
- **Table**: `risk_predictions`
- **Data Type**: FastAPI-derived, written to Supabase.
- **Flow**: FastAPI inserts the exact prediction outcome for GNG-000026: `run_id`, `risk_score`, `risk_category`, `confidence`, and the `input_snapshot` JSON. 
- *Return*: FastAPI returns the JSON response back to `route.ts`.

## 8. Automatic Officer Assignment (Next.js/Supabase)
- **File**: `website/app/api/internal/assignments/auto/route.ts`
- **Endpoint**: `POST /api/internal/assignments/auto`
- **Logic**: If the Next.js trigger route detects `risk_category === "HIGH"`, it autonomously fires a background request to this internal assignment endpoint.
- **Action**: Finds an eligible officer and inserts a record into `officer_assignments` containing `run_id`, `grid_code`, and `assignment_status="PENDING"`. It strictly checks if GNG-000026 already has an active assignment to maintain idempotency.
- **Data Type**: Next.js-computed (Business Logic) writing to Supabase-derived state.

## 9. Officer API (Next.js)
- **File**: `website/app/api/officer/assignments/route.ts`
- **Endpoint**: `GET /api/officer/assignments`
- **Flow**: Officer logs in. The Next.js API queries Supabase `officer_assignments` joined with `risk_predictions`.
- **Data Type**: Supabase-derived (joining assignments + FastAPI-derived risk scores).

## 10. Officer UI
- **File**: `website/app/(officer)/assignments/page.tsx`
- **Flow**: The Officer sees "GNG-000026" in their queue with the associated `risk_score` and `confidence` extracted natively from the joined prediction payload.
- **Data Type**: Client-side rendering of Supabase-derived data.

## 11. Officer Decision/Action
- **File**: `website/app/api/officer/assignments/[id]/route.ts` and `website/app/api/officer/advisories/route.ts`
- **Flow**: Officer clicks "Acknowledge" (PATCH assignment to `ACKNOWLEDGED`). The Officer reviews the Grid Detail Drawer (which fetches `GET /api/risk/grid`), agrees with the HIGH risk, and issues a formal Advisory for GNG-000026 via `POST /api/officer/advisories`.

## 12. Advisory / Public-Release State (Supabase)
- **Tables**: `advisories` and `officer_actions`
- **Flow**: Next.js writes the advisory (Severity: "HIGH", Area: "GNG-000026", Status: "PUBLISHED") to `advisories` and writes an audit log to `officer_actions` with `action="PUBLISH"`.
- **Data Type**: Next.js-computed user input, written to Supabase.

## 13. /api/public/risk (Next.js)
- **File**: `website/app/api/public/risk/route.ts`
- **Endpoint**: `GET /api/public/risk`
- **Logic**: The public visits the dashboard. This API fetches `analysis_grid_cells` (geometry) and intersects it ONLY with `PUBLISHED` records in `advisories` mapped to `officer_actions`.
- **Data Type**: Supabase-derived (Geometries + Advisories). 
- **CRITICAL**: *`risk_predictions` is entirely bypassed. FastAPI is entirely bypassed.*

## 14. Public Map
- **File**: `website/src/components/map/MapView.tsx` (on `app/(public)/page.tsx`)
- **Flow**: The public map strictly colors GNG-000026 as "HIGH" risk based *only* on the Officer's explicitly published Advisory. The underlying `TEST_PREDICTOR` score is completely hidden from the public client.

---

## Complete ASCII Architecture Flow

```ascii
[DEVELOPER UI] --(Trigger Prediction)--> [NEXT.JS: /api/developer/predictions/trigger]
                                                       |
                                                    (fetchML)
                                                       |
                                                       v
                                          [FASTAPI: POST /predictions/test]
                                                       |
                                                (TEST_PREDICTOR)
                                                       |
                                     +-----------------+-----------------+
                                     |                                   |
                                     v                                   v
                         [SUPABASE: prediction_runs]      [SUPABASE: risk_predictions]
                                                                         |
                                                                         | (If HIGH risk)
                                                                         |
                                          [NEXT.JS: /api/internal/assignments/auto]
                                                                         |
                                                                         v
                                          [SUPABASE: officer_assignments]
                                                                         |
                                                                         v
[OFFICER UI] <--(GET /api/officer/assignments)-- [NEXT.JS API] <---------+
     |
(Reviews GNG-000026, Decides to Publish)
     |
     v
[NEXT.JS: /api/officer/advisories]
     |
     v
[SUPABASE: advisories] & [SUPABASE: officer_actions]
     |
     v
[NEXT.JS: /api/public/risk] <--(Reads Adisories + analysis_grid_cells ONLY. Ignores risk_predictions)
     |
     v
[PUBLIC UI / MAP] (GNG-000026 is visible to the public)
```
