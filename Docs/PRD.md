# DHARA-SOOCHAK
## Product Requirements Document (PRD)

**AI-Powered Last-Mile Landslide Intelligence & Decision Support Platform**  
**Smart India Hackathon Prototype**  
**Pilot:** East Sikkim, Sikkim

---

## 1. Product Overview

Dhara-Soochak is a GIS-first disaster-management intelligence platform designed to augment existing landslide-warning and geospatial systems.

The system combines regional warning/context with rainfall, terrain, susceptibility and other geospatial information to:

1. estimate localized landslide risk;
2. map that risk spatially;
3. identify exposed villages, roads and potentially critical infrastructure;
4. rank priority assets;
5. explain the major factors behind risk assessments; and
6. support faster, evidence-based decisions by disaster-management officials.

### Core value proposition

> **From Regional Warnings → Localized Action**

Dhara-Soochak does **not** replace GSI/NLFC, NDEM, NRSC/ISRO, NESAC, SDMAs, DDMAs or other authorized disaster-management systems.

---

## 2. Problem Statement

The North Eastern Region is vulnerable to landslides caused by heavy rainfall, steep and fragile terrain, seismic conditions and human modification of slopes.

Existing systems provide valuable monitoring, forecasting, hazard information and geospatial decision support. However, the practical last-mile question can remain:

> **Which specific locations should receive attention first?**

A district or regional warning does not necessarily identify the relative risk of individual villages, road segments or other exposed assets.

Dhara-Soochak aims to bridge this gap through localized, explainable and prioritized risk intelligence.

---

## 3. Product Goals

- Provide a localized risk view for the East Sikkim pilot.
- Fuse dynamic rainfall information with static geospatial features.
- Translate cell-level risk into village and road priorities.
- Explain why high-risk locations were flagged.
- Support field verification and response prioritization.
- Preserve human decision-making for official actions.
- Provide a scalable architecture that can later be adapted to other regions.

---

## 4. Non-Goals

Dhara-Soochak will **not**:

- replace GSI/NLFC or NDEM;
- build a new national landslide inventory;
- build a new national susceptibility map;
- duplicate citizen landslide-reporting infrastructure;
- depend on a district-wide physical sensor network;
- claim exact landslide timing or certainty;
- fabricate fine-resolution rainfall from coarse rainfall data;
- issue autonomous evacuation commands;
- depend on unverified direct access to restricted government APIs.

---

## 5. Target Users

### Primary: District / Sub-Divisional Disaster-Management Officials

Needs:
- current warning context;
- localized risk;
- priority villages;
- priority roads;
- exposed infrastructure;
- explanations;
- data freshness.

### Secondary: Field Officers / Response Teams

Needs:
- mobile-friendly map;
- priority locations;
- asset details;
- field verification information;
- low-bandwidth experience.

### Public Users

Needs:
- simple localized risk information;
- official advisories;
- safety guidance;
- emergency contacts;
- clear timestamps and source information.

### Administrators

Needs:
- configuration;
- dataset/model metadata;
- user/role management;
- system health.

---

## 6. Product Principles

1. **Augment, don't replace.**
2. **Separate official warnings from model estimates.**
3. **Keep human officials responsible for operational decisions.**
4. **Use evidence-backed data and clearly label demo/simulated inputs.**
5. **Prefer robust, interpretable models over unnecessary complexity.**
6. **Validate before making performance claims.**
7. **Build locally first; scale only after validation.**

---

## 7. End-to-End User Workflow

1. Official opens the East Sikkim dashboard.
2. Regional warning/context is displayed.
3. Latest available environmental/geospatial inputs are loaded.
4. The risk engine estimates localized risk over the configured analysis grid.
5. GIS overlays risk with villages, roads and optional infrastructure.
6. The prioritization engine ranks assets.
7. The user selects an asset to view risk, drivers, data quality and attention level.
8. Public users can access a simplified localized risk/advisory view.
9. Official emergency actions remain under authorized agencies.

---

## 8. High-Level System Architecture

```text
Existing Warnings / Data
        │
        ├── GSI/NLFC context
        ├── Rainfall
        ├── DEM / terrain
        ├── Susceptibility
        ├── Land cover
        ├── Historical landslides
        ├── Roads
        └── Villages / infrastructure
        │
        ▼
Data Ingestion
        ▼
Preprocessing
        ▼
Feature Engineering
        ▼
ML Risk Engine
        ▼
Localized Risk Surface
        ▼
Asset Exposure Analysis
        ▼
Priority Ranking
        ▼
Explainability / Data Quality
        ▼
API
        ├───────────────┐
        ▼               ▼
Official Dashboard   Public View
```

---

## 9. Core Data Requirements

| Dataset | Purpose | Initial Source | Priority | Notes |
|---|---|---|---|---|
| Historical landslide inventory | Ground-truth labels | NRSC/ISRO + GSI + validated academic sources | MUST | Location/date quality must be audited |
| Rainfall | Dynamic trigger | NASA GPM IMERG | MUST | Coarse regional rainfall |
| DEM | Terrain variables | Copernicus DEM GLO-30 or verified alternative | MUST | Derive elevation/slope/aspect |
| Landslide susceptibility | Static susceptibility | GSI | MUST | Exact access/format must be verified |
| Land cover | Environmental context | ESA WorldCover | SHOULD | Aggregate to analysis unit |
| Road network | Exposure/prioritization | OpenStreetMap | MUST | Primarily post-prediction analysis |
| Villages/settlements | Exposure/prioritization | OpenStreetMap or verified open source | MUST | Used mainly after risk estimation |
| Rivers/drainage | Optional terrain context | Open hydrographic/OSM | SHOULD | Use only if reliable |
| Sentinel-1/2 | Change detection/verification | Copernicus/GEE | NICE TO HAVE | Not required for first baseline |
| Satellite soil moisture | Experimental feature | SMAP/ASCAT | OPTIONAL | Use only if data quality supports it |

---

## 10. Data Modeling

The system will harmonize datasets around a common spatial unit and date.

### Candidate analysis grid

**Initial target:** 500 m × 500 m

This is **not permanently locked**. The implementation must permit comparison with other resolutions such as 1 km.

The final resolution must be justified using:
- rainfall resolution;
- susceptibility scale;
- DEM quality;
- landslide positional accuracy;
- spatial generalization;
- model performance.

---

## 11. ML Problem Definition

### Initial formulation

A supervised binary classification problem:

```text
(cell_id, date, features) → is_landslide
```

where:

- `is_landslide = 1` means a verified landslide event is associated with that cell/date;
- `is_landslide = 0` means a selected non-event sample under the defined sampling methodology.

### Example

```text
cell_id   = CELL_4521
date      = 2021-07-22
label     = 1
```

---

## 12. Positive Samples

Positive samples are generated from verified landslide events.

Required event fields, where available:

```text
landslide_id
latitude
longitude
event_date
source
inventory_type
```

The inventory must be audited for:
- duplicate events;
- inaccurate coordinates;
- missing dates;
- ambiguous event dates;
- inconsistent event definitions.

---

## 13. Negative Samples

A recorded absence is **not automatically a confirmed non-landslide**.

The final sampling strategy must investigate:

- spatial separation;
- susceptibility-aware sampling;
- event-date matching;
- rainfall-condition matching;
- class imbalance;
- multiple negative-sampling schemes;
- spatial autocorrelation.

The system must avoid creating an artificially easy classification problem.

---

## 14. Feature Engineering

### Static features

Initial candidates:

- elevation
- slope
- aspect
- susceptibility
- land cover
- distance to road
- distance to river

Potential later features, only if data quality and relevance justify them:

- curvature
- terrain ruggedness
- topographic wetness
- drainage density
- lithology
- lineament/fault distance
- seismic variables

### Dynamic features

Initial candidates:

- rainfall_24h
- rainfall_72h
- rainfall_7d

Potential:

- rainfall_14d
- rainfall intensity
- rainfall anomaly
- consecutive dry days
- other antecedent rainfall indices

### Experimental

- satellite soil moisture

---

## 15. Rainfall Resolution Constraint

GPM/IMERG rainfall is approximately 10–11 km spatially.

The model must **not** imply that this produces 500 m rainfall.

Instead:

```text
Coarse regional rainfall trigger
              +
Fine/local terrain and susceptibility
              ↓
Localized risk estimate
```

The UI should state:

> **Localized risk estimation**

rather than:

> **500 m rainfall prediction**

The team must validate whether this multi-resolution formulation produces useful local differentiation without false precision.

---

## 16. Soil Moisture Strategy

Satellite soil moisture products such as SMAP/ASCAT should **not** be a mandatory core dependency initially.

The preferred baseline uses antecedent rainfall as a ground-wetness proxy:

- 24 h rainfall
- 72 h rainfall
- 7-day rainfall
- optionally 14-day rainfall

If satellite soil moisture is later tested, it should be evaluated as an ablation feature:

```text
Model A = core features
Model B = core features + soil moisture
```

Keep it only if it provides meaningful and reliable improvement.

---

## 17. Model Strategy

### Baseline

**Random Forest**

Reasons:
- robust for tabular geospatial data;
- handles nonlinear relationships;
- practical with limited event data;
- relatively easy to interpret;
- suitable for an SIH-scale prototype.

### Comparison

**XGBoost**

Use as a comparison if time and data quality permit.

### Deep learning

Do not introduce LSTM/Transformer/CNN architectures unless the dataset and experiments justify them.

The use of Random Forest, XGBoost, SHAP or GIS is **not itself novel**.

---

## 18. Validation Strategy

### Temporal validation

Example:

```text
Earlier years → Training
Later years   → Validation/Test
```

For example:

```text
2010–2019 → train
2020–2022 → test
```

### Spatial validation

Where practical, hold out geographic areas to test spatial generalization.

### Event-level grouping

Avoid treating multiple observations from the same event as independent evidence.

### Leakage prevention

Avoid:
- future weather data;
- post-event imagery accidentally used as predictors;
- duplicate event leakage;
- spatially neighboring leakage;
- target-derived features.

---

## 19. Evaluation Metrics

Do not rely on accuracy alone.

Use:

- Precision
- Recall
- F1
- ROC-AUC
- PR-AUC
- False-negative rate
- False-alarm rate
- Calibration/Brier score where probability interpretation is used

### Important operational principle

A false negative (missed event) may be more serious than a false positive.

Threshold selection should reflect this asymmetry.

---

## 20. Baseline Comparison

Where reproducible, compare:

### Baseline 1
Static susceptibility only.

### Baseline 2
Rainfall + susceptibility rule/threshold.

### Model
ML model using the engineered features.

The purpose is not simply to maximize a metric.

We need to demonstrate:

> **Does the ML layer provide useful additional spatial discrimination over simpler approaches?**

---

## 21. Risk Score Design

Separate:

### Model output

A model score/probability.

### Operational category

For example:

- Very Low
- Low
- Moderate
- High
- Very High

Do not show:

> “86% chance of landslide”

unless calibration and interpretation justify that statement.

Preferred wording:

> **Estimated Risk Score: 86/100**

> **Risk Category: HIGH**

---

## 22. Uncertainty / Data Quality

Each important model-driven result should expose a simple quality/confidence indicator:

- High
- Moderate
- Low

Potential contributing considerations:
- data freshness;
- input completeness;
- spatial extrapolation;
- model coverage;
- uncertainty in historical labels.

Do not fabricate advanced uncertainty metrics before a valid method is implemented.

---

## 23. Asset Prioritization

Risk cells are translated into asset-level priorities.

### Roads

Evaluate:
- risk distribution;
- percentage of segment exposed to high-risk cells;
- maximum/percentile/mean risk;
- road class/importance.

### Villages

Evaluate:
- nearby risk;
- exposure/population where available;
- proximity to risky terrain.

### Critical infrastructure

Evaluate:
- risk;
- exposure;
- criticality.

A candidate conceptual formula is:

```text
Priority = Risk × Exposure × Criticality
```

but the final formula must be validated and explained.

---

## 24. Decision Flags

Use:

### PRIORITY INSPECTION
Highest attention.

### MONITOR
Enhanced monitoring.

### ADVISORY
Awareness/advisory attention.

### ROUTINE
No immediate priority.

These are **decision-support labels**, not autonomous government commands.

---

## 25. Explainable AI

Preferred approach:

**SHAP**, subject to final model compatibility.

### Example

```text
Why was this location flagged?

72h Rainfall       ██████████
Slope              ████████
Susceptibility     ███████
7d Rainfall        █████
```

Call these:

> **Model contributions**

Do not describe SHAP values as causal percentages.

---

## 26. Official Dashboard Requirements

### Must Have

- Situation overview
- Regional warning/context
- Localized risk map
- Risk legend
- Search
- Village priorities
- Road priorities
- Asset detail panel
- Basic explanations
- Data freshness

### Should Have

- Rainfall analytics
- Historical event playback
- SHAP explanations
- Configurable demo alerts
- Infrastructure layer

### Nice to Have

- CSV/PDF export
- multilingual interface
- offline field support
- advanced change detection
- advanced uncertainty visualization

---

## 27. Public View Requirements

Route:

```text
/public
```

The public experience should provide:

- localized risk information;
- official advisories;
- safety guidance;
- official contacts;
- data timestamp;
- source attribution.

It must not present experimental model output as an evacuation order.

Recommended wording:

> “Model-estimated local risk.”

> “For emergency instructions, follow official district/state advisories.”

---

## 28. Main GIS Requirements

Layers:

- localized risk grid;
- roads;
- villages;
- historical landslides;
- susceptibility;
- rainfall;
- critical infrastructure.

Controls:

- search;
- zoom;
- home;
- fullscreen;
- layer switcher;
- legend;
- asset selection.

### Map behavior

**Hover →** tooltip

**Click →** selected asset/cell panel

---

## 29. Dashboard KPI Cards

Show:

- Current warning
- High-risk cells
- Priority villages
- Priority roads
- Risk escalations
- Last model run
- Last data update

All demo values must be clearly identified as synthetic where applicable.

---

## 30. Data Freshness

Display timestamps such as:

```text
Rainfall updated: 14:30 IST
Risk model run:   14:34 IST
Map generated:    14:35 IST
```

---

## 31. Alerts

Alerts are secondary.

Possible alert types:

- risk escalation;
- regional warning;
- priority asset;
- data-quality issue.

For the SIH prototype, notifications should be demo-only unless a real authorized notification pathway is available.

Do not hard-code 0.75 as a scientifically validated threshold.

---

## 32. Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React
- shadcn/ui where useful

### Mapping

- Leaflet / react-leaflet
- or MapLibre where appropriate

### Backend/API

- Next.js Route Handlers initially
- Python ML service later

### ML

- Python
- pandas
- geopandas
- scikit-learn
- XGBoost if used

### XAI

- SHAP

### Geospatial

- GeoPandas
- Rasterio
- GDAL
- PostGIS later

### Earth observation

- Google Earth Engine where appropriate

---

## 33. API Contracts

Initial mock/future endpoints:

```text
GET /api/risk/grid
GET /api/risk/villages
GET /api/risk/roads
GET /api/risk/infrastructure
GET /api/rainfall
GET /api/events
GET /api/warnings
GET /api/alerts
```

### Core entities

```text
RiskCell
VillageRisk
RoadRisk
InfrastructureRisk
RainfallObservation
LandslideEvent
Warning
Alert
RiskExplanation
DataQuality
```

---

## 34. Frontend Data Model Example

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

```ts
type Asset = {
  id: string
  name: string
  type: "ROAD" | "VILLAGE" | "INFRASTRUCTURE"
  riskScore: number
  priority:
    | "PRIORITY_INSPECTION"
    | "MONITOR"
    | "ADVISORY"
    | "ROUTINE"
  exposure?: number
  geometry: GeoJSON.Geometry
}
```

---

## 35. Security & Privacy

- Separate official and public views.
- Protect internal/administrative information.
- Use role-based access.
- Store only necessary personal information.
- Keep API keys and secrets in environment variables.
- Track model/data versions for reproducibility.
- Do not expose private operational data on the public view.

---

## 36. Performance

- Avoid rendering huge numbers of DOM nodes.
- Prefer GeoJSON for small demos.
- Use simplified geometry.
- Cluster markers.
- Lazy-load optional layers.
- Design for future vector tiles/PostGIS.

---

## 37. Responsive Design

### Desktop

Navigation + Map + Intelligence panel.

### Tablet

Map + collapsible intelligence panel.

### Mobile

Full-screen map + bottom-sheet details.

The public view should be mobile-first.

---

## 38. Accessibility

- keyboard navigation;
- visible focus;
- sufficient contrast;
- text labels in addition to colors;
- semantic structure;
- accessible dialogs/drawers;
- reduced-motion preference.

Risk must never be communicated through color alone.

---

## 39. Prototype / Demo Data

Synthetic data may be used for UI development.

Rules:

- show a “DEMO DATA” indicator;
- never imply simulated values are live government values;
- never fabricate live API connections;
- clearly identify simulated warning inputs.

---

## 40. MVP Scope

### P0 — Must Have

- East Sikkim map;
- risk grid;
- historical landslides;
- roads;
- villages;
- village ranking;
- road ranking;
- asset detail;
- decision flags;
- basic XAI;
- official dashboard;
- public view;
- mock/API contracts.

### P1 — Should Have

- rainfall analytics;
- historical playback;
- SHAP integration;
- data-quality indicator;
- demo alerts.

### P2 — Nice to Have

- export;
- advanced infrastructure;
- multilingual;
- offline field mode;
- satellite change detection;
- advanced model comparison.

---

## 41. Failure Modes & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Insufficient dated/geolocated events | High | Audit inventory first |
| Rainfall/grid mismatch | High | Treat rainfall as regional trigger; validate grid |
| Inaccurate negative labels | High | Careful sampling and sensitivity analysis |
| Spatial leakage | High | Spatial/grouped validation |
| Temporal leakage | High | Strict temporal splits |
| Government data/API restrictions | High | Mock/import-based integration |
| False positives/negatives | High | Calibration and threshold analysis |
| Overclaiming model capability | High | Evidence-based language |
| Scope creep | Medium | Protect MVP |
| Poor UX despite a good model | Medium | Design around user decisions |

---

## 42. Success Criteria

The prototype succeeds when:

1. A reproducible East Sikkim dataset can be assembled.
2. The model can be evaluated on held-out data without major leakage.
3. The system generates a localized risk layer.
4. Villages and roads can be automatically prioritized.
5. Users can understand why an asset was flagged.
6. The dashboard clearly separates official warning from model estimate.
7. The system demonstrates a useful difference between regional risk information and localized decision support.
8. The architecture can support future expansion to other districts.

---

## 43. Demo Scenario

The ideal SIH demo should take under three minutes:

1. Open the official dashboard.
2. Show the current warning/context.
3. Display the localized risk grid.
4. Select a high-risk region.
5. Show the contributing factors.
6. Open priority villages.
7. Open priority roads.
8. Explain the recommended attention level.
9. Switch to the public view.
10. Show how localized risk/advisory information is presented.

---

## 44. Future Expansion

After successful pilot validation:

- add other NER districts;
- improve rainfall/environmental inputs;
- test satellite change detection;
- integrate field verification;
- integrate authorized government data services where possible;
- support mobile/low-bandwidth field workflows;
- test more advanced spatiotemporal models with larger datasets.

---

## 45. Final Product Statement

> **Dhara-Soochak is an AI-powered last-mile landslide intelligence platform that augments existing warning infrastructure by converting regional risk information and geospatial data into localized, explainable and prioritized intelligence for disaster-management decisions.**

---

## 46. Implementation Order

1. Verify and acquire the historical landslide inventory.
2. Verify the pilot boundary.
3. Verify GSI susceptibility data access/format.
4. Acquire core open geospatial datasets.
5. Create the candidate analysis grid.
6. Build static terrain features.
7. Build rainfall/antecedent-rainfall extraction.
8. Construct and audit positive/negative samples.
9. Train baseline model.
10. Evaluate temporal/spatial validation.
11. Generate localized risk.
12. Build village/road prioritization.
13. Build dashboard.
14. Add XAI/data-quality features.
15. Add optional public/alert layers.
16. Run final SIH demo.

---

## 47. Pre-Development Verification Checklist

Before making the ML model a core dependency, verify:

- exact number of usable landslide events;
- event dates and coordinates;
- completeness/quality of labels;
- exact GSI susceptibility data access;
- exact pilot boundary;
- rainfall data coverage;
- appropriate spatial resolution;
- licensing/access terms;
- whether 500 m remains justified;
- whether the selected features are available for all model dates;
- whether the validation design prevents spatial and temporal leakage.

---

## 48. Design Philosophy

Dhara-Soochak should never feel like:

> “Here is a beautiful map with AI.”

It should feel like:

> **“Here is the situation, here is where the risk is concentrated, here is what deserves attention first, and here is why.”**
