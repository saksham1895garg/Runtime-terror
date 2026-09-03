# PHASE 14 — DHARA-SOOCHAK UI REDESIGN PLAN

## 1. Global Design System
- **Theme**: Traditional enterprise AI/ML + government operations portal. Professional, dense, and serious. No neon, excessive animations, giant rounded panels, or glassmorphism. NO EMOJIS.
- **Typography**: Professional sans-serif (Inter/Roboto), strong information hierarchy using varied font weights and uppercase tracking for labels.
- **Colors**: Refined palette emphasizing function.
  - Backgrounds: Solid slate/grays (e.g., `slate-50`, `slate-900` for dark sections).
  - Status/Badges: Distinct colors (Green/Success, Amber/Warning, Red/Critical, Blue/Info) applied to borders, text, and muted backgrounds.
- **Spacing**: Consistent, tight but readable padding (e.g., 4px, 8px, 16px, 24px increments) to increase information density.

## 2. Layout Structure
- **AppShell**: Standardized global layout comprising a Top Header (TopBar) and a Collapsible Sidebar.
- **TopBar**: Clear system status, environment indicators (e.g., "DEMO" or "SYNTHETIC"), active region, and user profile.
- **Sidebar**: Categorized navigation (Core, Workflows, Analytics).
- **Page Container**: Fixed header, scrollable content area. Pages with maps will use a split-pane or full-screen layout with overlays.

## 3. Reusable Components
- **Loading & Error States**: Establish a standard state model (`Loading -> Loaded -> Empty -> Error + Retry`).
  - `SectionLoading`: Skeleton loaders for tables, metric cards, and charts.
  - `SectionError`: Standard error card with an actionable "Retry" button.
  - `EmptyState`: Simple informative block explaining the lack of data.
- **Data Display**:
  - `DataTable`: Responsive, dense tables with sorting and clear row actions.
  - `MetricCard`: Restrained borders, no giant shadows, focusing on the number and its trend/context.
  - `StatusBadge`: Compact, text-based indicators (e.g., "HIGH", "PENDING", "TEST DATA").
- **Navigation**:
  - `Tabs`: Underline or segmented controls for switching related datasets without page reloads.

## 4. Developer Portal Redesign
- **Aesthetic**: AI/ML Operations Control Dashboard (dark or technical light theme).
- **Features**: 
  - Overview of system health, active runs, user counts.
  - System Health: Clear metrics on DB, ML backend, Redis, Resend.
  - Explicitly label synthetic or overridden data (e.g., "DEVELOPER OVERRIDE", "TEST DATA").
- **Changes**: Remove giant animated cards. Replace with dense grids and tables for logs and active runs.

## 5. Officer Portal Redesign
- **Aesthetic**: Emergency Management Operational Dashboard.
- **Features**:
  - "What requires my attention right now?" prioritization.
  - Map integration remains prominent.
  - Discrepancy, priority, and asset panels redesigned to use tabs and dense lists rather than large floating panels.
- **Changes**: Ensure API calls (`/api/risk/grid`, `/api/officer`, etc.) are preserved and their loading/error states are handled independently.

## 6. Public Portal Redesign
- **Aesthetic**: Accessible, simple, clear safety and information dashboard.
- **Features**:
  - Clear public safety status.
  - Prominent map and released warnings.
  - Report incident CTA.
- **Changes**: Remove abstract blurs and overly futuristic hero sections. Use a traditional, authoritative government service appearance.

## 7. Responsive Strategy
- **Breakpoints**: Mobile (375px), Tablet (768px), Desktop (1366px), Large Desktop (1920px).
- **Rules**:
  - No horizontal page overflow.
  - Sidebars collapse to hamburger menus on mobile/tablet.
  - Tables enable horizontal scrolling on small screens.
  - Maps resize within flex containers.

## 8. Loading & Error Strategy
- Component resilience is critical. A failure in one section (e.g., `System Health`) will not block others (e.g., `Assignments`).
- Standardize on React `Suspense` or local state loading flags, rendering `SectionLoading` or `SectionError` components locally.

## 9. Map Integration Strategy
- **CRITICAL**: The existing `react-leaflet` implementation, `MapView` component, and API endpoints are strictly preserved.
- **Styling**: Container borders and overlays will be styled to match the new UI, but underlying geometry (500m grid) and map behavior will remain untouched.

## 10. Migration Order
1. Global layout, navigation, and design system (CSS/Tailwind configs).
2. Reusable state, loading, and error components.
3. Developer portal redesign.
4. Officer portal redesign.
5. Public portal redesign.
6. Responsive cleanup and final visual consistency pass.
