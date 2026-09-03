# DHARA-SOOCHAK API Surface - Phase 12

This document maps the actual required API surface for Phase 12 based on the existing Supabase schema, Next.js architecture, and FastAPI integrations.

## 1. Officer Workflow APIs

### `GET /api/officer/assignments`
- **Method**: GET
- **Path**: `/api/officer/assignments`
- **Purpose**: Retrieve the list of active assignments for the currently authenticated officer.
- **Roles**: `officer`, `developer`
- **Request Body/Query**: Optional query params `?status=PENDING|ACKNOWLEDGED|COMPLETED`
- **Response Shape**: `200 OK` JSON array of assignment objects with joined `risk_predictions` context.
- **Database Tables**: `officer_assignments`, `risk_predictions`, `public.users`
- **External Dependencies**: None
- **Timeout Expectations**: 5s
- **Important Error Cases**: `401 Unauthorized`, `403 Forbidden`
- **Audience**: Officer
- **Data Change**: No

### `PATCH /api/officer/assignments/:id`
- **Method**: PATCH
- **Path**: `/api/officer/assignments/:id`
- **Purpose**: Acknowledge, complete, or decline an assignment.
- **Roles**: `officer`
- **Request Body**: `{ "action": "ACKNOWLEDGE" | "COMPLETE" | "DECLINE", "notes": "..." }`
- **Response Shape**: `200 OK` JSON with updated assignment status.
- **Database Tables**: Updates `officer_assignments` (`assignment_status`, `acknowledged_at`, `completed_at`). Inserts `officer_actions` for audit.
- **External Dependencies**: None
- **Timeout Expectations**: 5s
- **Important Error Cases**: `400 Bad Request` (invalid transition), `403 Forbidden` (not assigned to this officer), `404 Not Found`
- **Audience**: Officer
- **Data Change**: Yes

### `POST /api/officer/advisories`
- **Method**: POST
- **Path**: `/api/officer/advisories`
- **Purpose**: Issue a public advisory, separated from raw review/assignment logic.
- **Roles**: `officer`
- **Request Body**: `{ "type": "...", "title": "...", "description": "...", "severity": "...", "area": "..." }`
- **Response Shape**: `201 Created`
- **Database Tables**: Inserts `advisories`, inserts `officer_actions`.
- **External Dependencies**: None
- **Timeout Expectations**: 5s
- **Important Error Cases**: `400 Bad Request`, `403 Forbidden`, `422 Unprocessable Entity`
- **Audience**: Officer
- **Data Change**: Yes

## 2. Automatic Officer Assignment API

### `POST /api/internal/assignments/auto`
- **Method**: POST
- **Path**: `/api/internal/assignments/auto`
- **Purpose**: Automatically and idempotently assign an officer to a newly generated prediction. Must handle concurrent/duplicate requests safely.
- **Roles**: `developer` (or system internal service role)
- **Request Body**: `{ "run_id": "...", "grid_code": "..." }`
- **Response Shape**: `201 Created` with assigned `officer_id`, or `200 OK` if already assigned.
- **Database Tables**: Reads `public.users` (role='officer'), `officer_assignments` (load balancing/existence check). Inserts `officer_assignments`.
- **External Dependencies**: None
- **Timeout Expectations**: 5s
- **Important Error Cases**: `404 Not Found` (no officers available), `400 Bad Request` (invalid request), `500 Internal Server Error`
- **Audience**: System/Internal
- **Data Change**: Yes

## 3. Developer Operational Control APIs

### `GET /api/developer/grids/:grid_code`
- **Method**: GET
- **Path**: `/api/developer/grids/:grid_code`
- **Purpose**: Inspect a specific grid cell, its latest predictions, overrides, assignments, and flags.
- **Roles**: `developer`
- **Request Body**: None
- **Response Shape**: `200 OK` JSON aggregating data.
- **Database Tables**: `analysis_grid_cells`, `risk_predictions`, `officer_assignments`, `decision_flags`
- **External Dependencies**: None
- **Timeout Expectations**: 10s
- **Important Error Cases**: `403 Forbidden`, `404 Not Found`
- **Audience**: Developer
- **Data Change**: No

### `POST /api/developer/grids/:grid_code/override`
- **Method**: POST
- **Path**: `/api/developer/grids/:grid_code/override`
- **Purpose**: Create a developer override for a risk prediction, appending a new record with explicit provenance metadata. Does NOT overwrite original prediction.
- **Roles**: `developer`
- **Request Body**: `{ "run_id": "...", "risk_score": 50, "risk_category": "MODERATE", "reason": "..." }`
- **Response Shape**: `201 Created` JSON
- **Database Tables**: Inserts `risk_predictions` with `input_snapshot` containing `{ developer_override: true, actor: "...", reason: "...", original_prediction_id: "..." }`. Inserts `audit_logs` (if access allows).
- **External Dependencies**: None
- **Timeout Expectations**: 5s
- **Important Error Cases**: `400 Bad Request`, `403 Forbidden`, `404 Not Found`
- **Audience**: Developer
- **Data Change**: Yes

### `POST /api/developer/grids/:grid_code/flag`
- **Method**: POST
- **Path**: `/api/developer/grids/:grid_code/flag`
- **Purpose**: Idempotently flag or unflag a grid cell for operational review.
- **Roles**: `developer`
- **Request Body**: `{ "action": "FLAG" | "UNFLAG", "title": "...", "description": "..." }`
- **Response Shape**: `201 Created` or `200 OK`
- **Database Tables**: Inserts/Updates `decision_flags`.
- **External Dependencies**: None
- **Timeout Expectations**: 5s
- **Important Error Cases**: `400 Bad Request`
- **Audience**: Developer
- **Data Change**: Yes

## 4. Prediction Integration APIs

### `POST /api/developer/predictions/trigger`
- **Method**: POST
- **Path**: `/api/developer/predictions/trigger`
- **Purpose**: Trigger a prediction run via Next.js backend to FastAPI. Converts upstream typed errors to standardized JSON.
- **Roles**: `developer`
- **Request Body**: `{ "grid_code": "..." }`
- **Response Shape**: `200 OK` wrapping FastAPI response.
- **Database Tables**: None directly (FastAPI writes to DB).
- **External Dependencies**: FastAPI `POST /predictions/test`
- **Timeout Expectations**: 15s
- **Important Error Cases**: `503 Service Unavailable`, `500 Internal Server Error`, `504 Gateway Timeout`, `422 Unprocessable Entity`
- **Audience**: Developer
- **Data Change**: Yes (via FastAPI)

## 5. Public Safety APIs

### `GET /api/public/advisories`
- **Method**: GET
- **Path**: `/api/public/advisories`
- **Purpose**: Expose explicitly released safety advisories to the public map/portal.
- **Roles**: Public (None required)
- **Request Body**: None
- **Response Shape**: `200 OK` JSON array of `advisories` where `status = 'PUBLISHED'`.
- **Database Tables**: Reads `advisories`.
- **External Dependencies**: None
- **Timeout Expectations**: 5s
- **Important Error Cases**: `500 Internal Server Error`
- **Audience**: Public
- **Data Change**: No

### `GET /api/public/risk`
- **Method**: GET
- **Path**: `/api/public/risk`
- **Purpose**: Expose public-safe status. Derives data strictly from `analysis_grid_cells` joined with explicitly released `advisories` or `decision_flags`. **Never exposes raw `risk_predictions`**.
- **Roles**: Public (None required)
- **Request Body**: None
- **Response Shape**: `200 OK` GeoJSON FeatureCollection.
- **Database Tables**: Reads `analysis_grid_cells`, `advisories`.
- **External Dependencies**: None
- **Timeout Expectations**: 10s
- **Important Error Cases**: `500 Internal Server Error`
- **Audience**: Public
- **Data Change**: No

