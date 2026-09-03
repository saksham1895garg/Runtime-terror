# Phase 13 UI Integration Plan

## Objective
To complete the end-to-end Hackathon Demo Flow seamlessly without backend changes, relying strictly on the API surface finalized in Phase 12.

### The Required Demo Flow
1. Developer triggers prediction
2. Prediction completes
3. Officer assignment
4. Officer review & decision
5. Advisory release
6. Public-safe warning visibility
7. Developer overrides/flags grid

## Current State Analysis

### 1. What already works
- **Backend Flow**: All internal integrations between FastAPI, Next.js, and Auto-Assignment hooks are tested and complete.
- **Developer Grid Control UI**: `app/(developer)/dev-dashboard/grids/page.tsx` correctly implements Grid Inspection, Flagging, and Append-only Overrides with visual provenance.
- **Officer Assignment UI**: `app/(officer)/assignments/page.tsx` correctly lists assigned grids and provides "Acknowledge" and "Complete" workflows.

### 2. What is disconnected / visually incomplete
- **Developer Prediction Trigger**: The `Runs` page (`app/(developer)/dev-dashboard/runs/page.tsx`) has a list of runs, but no button to trigger a *new* test prediction. This breaks step 1 of the demo flow.
- **Officer Advisory Release**: The `Advisories` page (`app/(officer)/advisories/page.tsx`) has a mock "Create Advisory" button that does nothing. The officer has no way to actually publish an advisory (step 5).
- **Public Map Boundary**: The Public Map (`app/(public)/public-map/page.tsx`) is still fetching from the legacy `/api/risk/grid` which could expose unreleased data. It needs to fetch from the newly secured `/api/public/risk` boundary (step 6).

## Minimum Changes Required for Polished Demo

### 1. Developer Portal: Trigger Prediction
- **File**: `app/(developer)/dev-dashboard/runs/page.tsx`
- **Action**: Add a "Run Test Prediction" button that opens a simple prompt or directly POSTs to `/api/developer/predictions/trigger` with a sample `grid_code` (e.g., `GNG-000026`).

### 2. Officer Portal: Publish Advisory
- **File**: `app/(officer)/advisories/page.tsx`
- **Action**: Implement a "Create Advisory" modal/dialog when clicking the "Create Advisory" button.
- **Integration**: POST form data to `/api/officer/advisories` containing `{ type, title, description, severity, area }`. This creates the advisory and sets `status = PUBLISHED`, bridging the gap to the public portal.

### 3. Public Portal: Safe Data Consumption
- **File**: `app/(public)/public-map/page.tsx`
- **Action**: Change the fetch endpoint from `/api/risk/grid` to `/api/public/risk` to guarantee that the map only displays grids that have an associated released advisory.

## Execution
This plan adheres strictly to the "FAIL FAST" rule. Only the absolute minimum required wiring for the demo flow will be implemented. God Mode, Playwright E2E, and unrelated backend refactoring remain explicitly deferred.

Once this plan is approved, I will implement these three targeted changes and conclude Phase 13.
