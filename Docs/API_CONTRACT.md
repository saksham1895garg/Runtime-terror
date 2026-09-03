# DHARA-SOOCHAK API Contract

This document defines the strict API contracts for the Next.js frontend, the FastAPI backend, and their interactions.

## 1. Data Flow Architecture

To ensure public safety, raw machine learning predictions are NEVER exposed directly to the public map. The authoritative data flow is:

1. **Prediction Generation:** The FastAPI ML Backend triggers a prediction run. Outputs are saved to `risk_predictions`.
2. **Officer Review:** The Officer Dashboard (`/api/officer`) queries `risk_predictions`, `decision_flags`, and `public_reports`.
3. **Decision/Release:** An Officer reviews discrepancies and high-risk predictions. They authorize release by creating an `advisories` record.
4. **Public Exposure:** The public map fetches `/api/risk/grid` which currently serves `grid_cells`. Moving forward, `grid_cells` represents the *public-safe* consensus view that is updated ONLY when an officer publishes an advisory or confirms a risk level.

## 2. Next.js Internal APIs (Website)

*Note: Phase 12 introduced a comprehensive new operational API surface for Officers, Developers, and Public Risk Boundaries. Please refer to `Docs/PHASE12_API_SURFACE.md` for the authoritative and detailed contract of these endpoints.*

**Core Next.js Endpoints Summary (See PHASE12_API_SURFACE.md for full specs):**
- **Officer**: `GET /api/officer/assignments`, `PATCH /api/officer/assignments/:id`, `POST /api/officer/advisories`, `GET /api/officer`
- **Developer/Admin**: `GET /api/developer/grids/:grid_code`, `POST /api/developer/grids/:grid_code/override`, `POST /api/developer/grids/:grid_code/flag`, `POST /api/developer/predictions/trigger`
- **Internal Hook**: `POST /api/internal/assignments/auto`
- **Public**: `GET /api/public/advisories`, `GET /api/public/risk`, `POST /api/reports`

### `POST /api/auth/step-up`
- **Purpose**: Request OTP for God Mode elevation.
- **Authentication**: Required.
- **Role**: `developer` with root eligibility.
- **Response**: `200 OK`
- **Errors**: `401`, `403`.

### `POST /api/auth/step-up/verify`
- **Purpose**: Verify OTP and issue God Mode token.
- **Authentication**: Required.
- **Role**: `developer` with root eligibility.
- **Request**: `{ "token": "123456" }`
- **Response**: `200 OK` sets secure cookie.

### `GET /api/risk/grid`
- **Purpose**: Public map access to established risk consensus.
- **Authentication**: None.
- **Response**: GeoJSON FeatureCollection from `grid_cells`.

### `POST /api/reports`
- **Purpose**: Citizens submit public disaster reports.
- **Authentication**: Optional.
- **Request**: Form data with `title`, `description`, `lat`, `lon`, `category`.
- **Database**: Inserts into `public_reports`.

## 3. FastAPI ML APIs (Backend)

The Next.js website communicates with these via `fetchML` utility (base URL `ML_API_URL`).

### `GET /health`
- **Purpose**: Liveness probe for developer dashboard.
- **Authentication**: None.
- **Response**: `{ "status": "ok", "database": "connected", "redis_queue": "connected" }`
- **Errors**: `500 Internal Server Error`, `503 Service Unavailable`.

### `POST /predictions/test`
- **Purpose**: Run a single-cell test prediction. TEST-only.
- **Authentication**: Internal network / API Gateway layer (No explicit auth header checked by FastAPI yet, relying on internal VPC or `ML_API_URL` secrecy).
- **Request**: `{ "grid_code": "GNG-000026" }`
- **Response**: `200 OK` JSON `PredictionResponse` (run_id, risk_score, category, confidence).
- **Errors**: `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`, `503 Service Unavailable` (e.g. Model missing or GEE features incomplete).
- **Database**: Writes to `prediction_runs`, `prediction_job_events`, and `risk_predictions`.

### `GET /runs?page=&limit=&status=`
- **Purpose**: Paginated list of ML prediction runs.
- **Authentication**: Internal.
- **Response**: `{ "total": int, "runs": [...] }`

### `GET /runs/{run_id}`
- **Purpose**: Details of a specific run.
- **Response**: `{ "run_id": "...", "status": "...", "progress_percent": float, ... }`

### `GET /runs/{run_id}/recovery`
- **Purpose**: Analysis of failed or unprocessed grids in a run.
- **Response**: `{ "failed_grids": [], "incomplete_grids": [], "unprocessed_grids": [] }`

### `GET /runs/{run_id}/events`
- **Purpose**: Execution events timeline.
- **Response**: `{ "events": [{ "event_type": "...", "message": "...", "created_at": "..." }] }`

## 4. Known Collisions & Mismatches

- **Risk Output**: Next.js public map queries `grid_cells`. ML Backend writes to `risk_predictions`. They currently do not sync automatically (this is intentional per the Safe Prediction Data Flow above, but requires an officer release mechanism to bridge them).
- **Explanation vs. Contributing Factors**: FastAPI schema uses `explanation`, Next.js `grid_cells` uses `explanation`. No collision.
- **Confidence**: Both use `confidence`.
