# Dhara-Soochak — DESIGN.md

## 1. Design Goal

Dhara-Soochak is a GIS-first disaster-management intelligence platform for the East Sikkim pilot.

**Design principle:**

> From regional warnings to localized action.

The UI should feel like a serious operational mapping product: fast, map-first, calm, information-dense, and easy to scan under pressure.

The visual direction is inspired by the interaction model of the referenced Dribbble shot, **“EV Stations Health Map” by Maciek Balasinski**: a dominant interactive map, compact floating controls, a focused side information panel, strong status cards, and clear spatial-to-operational relationships. The reference is used for **design inspiration only**; do not reproduce its branding, artwork, proprietary assets, or exact layout. 

Reference:
https://dribbble.com/shots/25145564-EV-Stations-Health-Map

---

## 2. Product Personality

### Desired qualities

- Operational
- Calm
- Trustworthy
- Geospatial
- Modern
- Government-ready
- Data-driven
- Accessible
- Responsive

### Avoid

- Generic SaaS dashboard look
- Excessive glassmorphism
- Neon cyberpunk styling
- Overly decorative gradients
- Fake “AI magic”
- Dense walls of text
- Excessive animation
- Consumer-map visual clutter

The application should communicate:

> “This is a system an emergency-management professional could use.”

---

## 3. Primary Users

### 3.1 District / Sub-Divisional Disaster-Management Official

Primary user.

Needs:

- Current regional warning context
- Localized risk map
- Priority villages
- Priority road segments
- Critical infrastructure exposure
- Explainable risk
- Data freshness
- Decision flags

### 3.2 Field Officer

Needs:

- Mobile-friendly map
- Priority locations
- Asset details
- Field verification status
- Low-bandwidth experience

### 3.3 Public User

Secondary user.

Needs:

- Simple localized risk map
- Official advisories
- Safety guidance
- Current status and update time
- Official emergency contacts

Public users should not see internal administrative controls.

---

## 4. Core UX Principle

The product is NOT primarily a dashboard of charts.

It is a:

> **Map + intelligence + prioritization system.**

The map should answer:

**Where?**

The side panel should answer:

**What?**

The risk explanation should answer:

**Why?**

The priority layer should answer:

**What should I look at first?**

---

## 5. Global Layout

Use a map-dominant layout inspired by modern geospatial products.

```text
┌───────────────────────────────────────────────────────────────┐
│ TOP NAV / STATUS BAR                                          │
├───────┬───────────────────────────────────────────┬───────────┤
│       │                                           │           │
│ SIDE  │                                           │  INTEL     │
│ NAV   │              MAIN GIS MAP                 │  PANEL     │
│       │                                           │           │
│       │                                           │           │
│       │                                           │           │
│       │                                           │           │
└───────┴───────────────────────────────────────────┴───────────┘
```

### Desktop

- Narrow left navigation
- Large central map
- Right-side intelligence panel
- Floating map controls

### Mobile

- Full-width map
- Bottom sheet for selected asset
- Collapsible top status
- Bottom navigation for essential views

---

## 6. Visual Hierarchy

Priority order:

1. Current warning / system status
2. Risk map
3. Priority assets
4. Selected asset details
5. Explanation
6. Supporting analytics
7. Secondary metadata

Never let a chart overpower the map.

---

## 7. Color System

Use a restrained emergency-management palette.

### Risk

- Very Low — green
- Low — light green
- Moderate — amber/yellow
- High — orange
- Very High — red

Do not rely on color alone.

Every risk state must also show:

- Label
- Icon
- Numeric score when appropriate

### UI neutrals

Use neutral grays/near-black/white for most interface chrome.

Avoid coloring every card.

Color should primarily signal:

- Risk
- Status
- Warning
- Action

---

## 8. Typography

Use a modern sans-serif.

Recommended:

- Inter
- Geist
- IBM Plex Sans

Hierarchy:

- Page title: 24–30px
- Section title: 16–20px
- Card value: 20–28px
- Body: 13–15px
- Metadata: 11–13px

Keep typography compact because this is an operational interface.

---

## 9. Radius / Depth

Use moderate corner radius:

- Cards: 12–16px
- Buttons: 8–10px
- Panels: 14–18px

Use subtle shadows.

Do not use heavy floating “pill” styling for everything.

---

## 10. Official Dashboard

Route:

`/dashboard`

### Header

Show:

- Dhara-Soochak logo/name
- Pilot: East Sikkim
- Current status
- Last data refresh
- User/role

Example:

```text
DHARA-SOOCHAK
East Sikkim • Decision Support

● SYSTEM STATUS: ACTIVE
Last updated 14:32 IST
```

---

## 11. Situation Overview

Use compact metric cards.

### Cards

**REGIONAL WARNING**
HIGH

**HIGH-RISK CELLS**
37

**PRIORITY VILLAGES**
5

**PRIORITY ROADS**
5

**RISK ESCALATIONS**
3

Do not hard-code real values in the prototype.

Use clearly marked demo data.

---

## 12. Main GIS Map

This is the most important component.

### Map layers

- Risk grid
- East Sikkim boundary
- Roads
- Villages
- Historical landslides
- Susceptibility
- Rainfall
- Critical infrastructure
- Selected asset

### Map controls

Top-left:

- Search
- Zoom
- Home / fit bounds

Top-right:

- Layers
- Fullscreen

Bottom:

- Risk legend
- Data timestamp

---

## 13. Risk Grid

Primary visual layer.

Each grid cell should support:

- Risk score
- Risk category
- Date/time
- Rainfall features
- Terrain summary
- Susceptibility
- Confidence/data quality

Interaction:

**Hover**
→ lightweight tooltip

**Click**
→ selected-cell detail panel

Do not animate every cell.

---

## 14. Search

Search:

- Village
- Road
- Area
- Coordinates

Search behavior:

```text
Search
  ↓
Results
  ↓
Map fly-to
  ↓
Select feature
  ↓
Open detail panel
```

Keep search visually prominent but compact.

---

## 15. Layer Control

Use a floating panel.

```text
MAP LAYERS

☑ Localized Risk
☑ Roads
☑ Villages
☐ Historical Landslides
☐ Susceptibility
☐ Rainfall
☐ Critical Infrastructure
```

Risk should remain the default layer.

---

## 16. Priority Panel

The right panel is the product’s “so what?” layer.

### Top Priority Assets

Tabs:

- Villages
- Roads
- Infrastructure

Example:

```text
TOP PRIORITIES

01  NH-10 • Segment A
    VERY HIGH
    91 / 100

02  Village B
    HIGH
    86 / 100

03  Road C
    HIGH
    79 / 100
```

Include:

- rank
- asset
- category
- score
- main factor
- attention flag

---

## 17. Decision Flags

Use clear action-oriented labels.

### Priority states

**PRIORITY INSPECTION**
Highest attention.

**MONITOR**
Enhanced monitoring.

**ADVISORY**
Awareness/advisory attention.

**ROUTINE**
No immediate priority.

Do not phrase these as autonomous government commands.

---

## 18. Asset Detail Drawer

Clicking an asset opens a right drawer or side panel.

### Structure

```text
NH-10 — Segment A

VERY HIGH RISK
91 / 100

LOCATION
East Sikkim

CURRENT CONTEXT
Regional warning: HIGH

WHY FLAGGED

↑ 72h rainfall
↑ Steep slope
↑ High susceptibility

EXPOSURE
High

DATA QUALITY
Moderate

RECOMMENDED ATTENTION
PRIORITY INSPECTION
```

The panel should be scannable in under 10 seconds.

---

## 19. Explainable AI Component

Title:

### Why was this location flagged?

Show 3–5 main model contributors.

Example:

```text
72h Rainfall         ██████████
Slope                ████████
Susceptibility       ███████
7d Rainfall          █████
```

Label:

**Model contribution**

Do not present these as causal percentages.

Future SHAP integration should populate this component.

---

## 20. Risk Score Language

Prefer:

**Estimated Risk Score: 86 / 100**

and:

**Risk Category: HIGH**

Avoid:

**86% chance of landslide**

unless the model is properly calibrated and the semantics are explicitly supported.

---

## 21. Confidence / Data Quality

Every model-driven result should have a compact indicator:

- High
- Moderate
- Low

Tooltip should explain:

- data completeness
- data freshness
- model coverage
- spatial extrapolation

Do not fabricate a sophisticated uncertainty metric in the frontend.

---

## 22. Rainfall Panel

Route:

`/rainfall`

Show:

- 24h
- 72h
- 7d
- optional 14d
- selected location
- trend chart
- source
- last updated

Clearly label:

**Source: GPM IMERG**
**Approx. spatial resolution: ~10–11 km**

Do not imply that rainfall has 500m spatial resolution.

---

## 23. Historical Events

Route:

`/events`

Map + list.

Filters:

- Date range
- Source
- Location
- Severity if available

Click event:

```text
LANDSLIDE EVENT

Date
Location
Coordinates
Source
Nearest village
Nearest road
```

Historical playback is a SHOULD-HAVE feature.

---

## 24. Public View

Route:

`/public`

Simpler than the official dashboard.

### Layout

Large map with:

- local risk zones
- official advisories
- safe-area/general guidance
- last updated
- official contacts

Avoid:

- internal asset rankings
- private infrastructure details
- administrative controls

### Safety copy

> “Model-estimated local risk. For emergency instructions, follow official district/state advisories.”

---

## 25. Alerts Page

Route:

`/alerts`

Show:

- risk escalation
- regional warning
- priority asset
- data issue

Example:

```text
RISK ESCALATION

Village B

Risk:
62 → 84

Drivers:
72h rainfall ↑
Susceptibility: HIGH

Attention:
FIELD VERIFICATION
```

For the SIH prototype, alerts are demo-only unless a real authorized notification path is implemented.

---

## 26. Data Freshness

Always display last update time.

Examples:

```text
Rainfall updated: 14:30 IST
Risk model run: 14:34 IST
Map generated: 14:35 IST
```

This creates trust and operational clarity.

---

## 27. Empty / Error States

Design intentionally.

### No data

> Risk data is currently unavailable.

### Stale data

> Risk information may be stale. Last successful update: 5h ago.

### API failure

> Unable to load rainfall data. Showing last successful dataset.

### No assets

> No priority assets found for current filters.

Never leave blank UI areas without explanation.

---

## 28. Interaction Patterns Inspired by the Reference

From the referenced map-health design, use these interaction principles:

### Map-first composition

The map should dominate screen real estate.

### Floating controls

Keep search, layers and map tools over the map rather than consuming permanent layout space.

### Contextual side panel

Show information only for the selected asset/location.

### Compact status cards

Use small operational cards rather than huge dashboard widgets.

### Spatial-to-data transition

Selecting a point on the map should immediately reveal its relevant metrics.

These principles are adapted from the reference rather than copied. The reference is a map-centric operational interface for monitoring a network at scale. citeturn743735search0

---

## 29. Responsive Behavior

### Desktop

Three-zone:

```text
Navigation | Map | Intelligence
```

### Tablet

Two-zone:

```text
Map | Intelligence drawer
```

### Mobile

Full-screen map:

```text
Map
 ↓
Bottom sheet
```

Bottom navigation:

- Map
- Priorities
- Alerts
- Profile

---

## 30. Accessibility

Must support:

- keyboard navigation
- visible focus
- readable text
- sufficient contrast
- labels in addition to color
- accessible dialogs/drawers
- reduced-motion preference

Risk cannot be communicated through color alone.

---

## 31. Animation

Use minimal motion.

Good:

- Map fly-to
- Drawer slide
- Small number transition
- Layer fade

Avoid:

- pulsing every risk cell
- constant map movement
- looping animations
- excessive hover transforms

The interface should feel calm during an emergency.

---

## 32. Microcopy

Use direct wording.

Prefer:

- “High risk”
- “Priority inspection”
- “Updated 14:32”
- “Why flagged?”
- “View details”
- “Show on map”

Avoid:

- “AI says danger is near!”
- “Mission control”
- “Predictive magic”
- “100% safe”

---

## 33. Dashboard Components

Recommended reusable components:

```text
AppShell
TopBar
Sidebar
MapView
MapLegend
LayerControl
SearchControl
RiskGrid
RiskCellPopup
PriorityList
PriorityCard
AssetDrawer
RiskScore
RiskBadge
DecisionFlag
XAIChart
RainfallPanel
WarningBanner
DataFreshness
ConfidenceBadge
EmptyState
ErrorState
```

---

## 34. Route Structure

```text
/
├── dashboard
├── map
├── assets
├── events
├── rainfall
├── alerts
├── public
└── settings
```

---

## 35. Frontend Data Contracts

The frontend should consume typed objects.

### RiskCell

```ts
type RiskCell = {
  id: string
  geometry: GeoJSON.Geometry
  riskScore: number
  riskCategory: "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH"
  rainfall24h: number
  rainfall72h: number
  rainfall7d: number
  slope: number
  elevation: number
  susceptibility: number
  confidence: "HIGH" | "MODERATE" | "LOW"
  explanation: RiskExplanation[]
}
```

### Asset

```ts
type Asset = {
  id: string
  name: string
  type: "ROAD" | "VILLAGE" | "INFRASTRUCTURE"
  riskScore: number
  priority: "PRIORITY_INSPECTION" | "MONITOR" | "ADVISORY" | "ROUTINE"
  exposure?: number
  geometry: GeoJSON.Geometry
}
```

---

## 36. Mock Data Rules

The UI prototype may use synthetic data.

Every synthetic/demo dataset must be labeled:

**DEMO DATA**

Never pretend mock values are live government information.

---

## 37. Performance

The main risk grid must not be rendered as thousands of independent DOM elements.

Prefer:

- GeoJSON layers for small demos
- Canvas/WebGL/vector tiles later
- marker clustering
- geometry simplification
- lazy-loaded layers

Future architecture:

```text
PostGIS
 ↓
Vector tiles
 ↓
Map renderer
```

---

## 38. Design Tokens

Use centralized design tokens for:

- colors
- spacing
- typography
- radii
- shadows
- z-index
- map control sizes

Avoid scattered hard-coded styles.

---

## 39. Dark vs Light Theme

Recommended:

### Official Dashboard
Dark charcoal interface around the map/panels with restrained neutral surfaces.

### Public View
Light interface may be preferable for readability and accessibility.

Do not make both themes visually unrelated.

They should clearly belong to the same product.

---

## 40. Branding

Product:

# DHARA-SOOCHAK

Subtitle:

**Last-Mile Landslide Intelligence & Decision Support**

Tagline:

> **From Regional Warnings to Local Action**

Logo direction:

- abstract terrain contour
- location pin
- subtle warning/risk motif
- no government seal imitation

---

## 41. MVP Design Priority

Build in this order:

### P0 — Critical

- Map
- Risk grid
- Search
- Risk legend
- Priority villages
- Priority roads
- Asset drawer
- Decision flags
- Basic XAI
- Official dashboard

### P1 — High impact

- Rainfall panel
- Historical events
- Historical playback
- Data freshness
- Public view

### P2 — Polish

- Export
- Advanced analytics
- Multilingual UI
- Offline field mode
- Advanced infrastructure layer

---

## 42. Final UX Test

A first-time official should be able to answer these questions within 30 seconds:

1. **What is the current warning status?**
2. **Where are the highest-risk areas?**
3. **Which village should I prioritize?**
4. **Which road should I inspect?**
5. **Why was it flagged?**
6. **How fresh/reliable is this information?**

If the interface cannot answer these quickly, simplify it.

---

## 43. Final Design Principle

The platform should never feel like:

> “Here is a beautiful map with AI.”

It should feel like:

> **“Here is the situation, here is where the risk is concentrated, here is what deserves attention first, and here is why.”**
