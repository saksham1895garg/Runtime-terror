# DHARA-SOOCHAK UI Data Source Map

This document maps all critical UI metrics and displayed values to their single authoritative backend sources to ensure traceability and data integrity.

## 1. Officer Dashboard Navigation & Metrics
**UI Component**: `TopBar.tsx`, `Sidebar.tsx`, `SituationOverview.tsx`
- **Active Assignments Count**
  - Next.js API: `GET /api/officer`
  - Supabase-derived: `officer_assignments` table `(count: exact) where officer_id = {user.id} AND assignment_status = 'PENDING'`
- **Public Reports Count**
  - Next.js API: `GET /api/officer`
  - Supabase-derived: `public_reports` table `(count: exact) where status != 'RESOLVED'`
- **Decision Flags Count**
  - Next.js API: `GET /api/officer`
  - Supabase-derived: `decision_flags` table `(count: exact) where status = 'NEW'`

## 2. Public Map View
**UI Component**: `MapView.tsx` (Public Route)
- **Grid Polygons & Base Risk Level**
  - Next.js API: `GET /api/public/risk`
  - Supabase-derived: `analysis_grid_cells` table `select(grid_code, geometry, district)`
  - Next.js-computed: The overall polygon severity is computed by iterating over associated `advisories` in Next.js and applying the max severity.

## 3. Officer/Developer Map View
**UI Component**: `MapView.tsx` (Officer Route)
- **Grid Cells & Real-time ML Risk**
  - Next.js API: `GET /api/risk/grid`
  - Supabase-derived: `analysis_grid_cells` table `select(grid_code, geometry, elevation, slope, aspect, susceptibility, land_cover)`
  - FastAPI-derived: ML Risk Scores and rainfall predictions merged from Supabase cache or `fastapi/predict` route.
- **Priority Assets (Roads/Villages)**
  - Next.js API: `GET /api/risk/grid`
  - Supabase-derived: `infrastructure_assets` table `select(*)`

## 4. Grid Detail Drawer
**UI Component**: `GridDetailDrawer.tsx`
- **Centroid Coordinates & Google Maps Link**
  - Next.js-computed: Derived dynamically on the client by calculating the mean of the GeoJSON polygon coordinate bounds provided by `cell.geometry`.
- **Risk Score & Factors (Elevation, Rainfall, Slope)**
  - Next.js API: `GET /api/risk/grid`
  - FastAPI/Supabase-derived: Directly maps to the `GridCell` typed object constructed in the Next.js API.

## 5. Security & System Health (Dev Dashboard)
**UI Component**: `dev-dashboard/page.tsx`
- **Security Events**
  - Next.js Server Component (Direct DB query)
  - Supabase-derived: `security_events` table `select(id, event_type, actor_id, timestamp)`
- **System Health Status**
  - Next.js Server Component
  - FastAPI-derived: Extracted from `fetchML("/health")` returning Celery, Redis, and DB health indicators.

## 6. Discrepancy & Priority Panels
**UI Component**: `DiscrepancyPanel.tsx`
- **Model Conflicts (Flags)**
  - Next.js Server Component: Pushed down from dashboard server route.
  - Supabase-derived: `decision_flags` table `where type = 'DISCREPANCY'`

**UI Component**: `PriorityPanel.tsx`
- **Top Priority Assets**
  - Next.js-computed: Sorts the merged output of `villages` and `roads` by `riskScore` on the client.
