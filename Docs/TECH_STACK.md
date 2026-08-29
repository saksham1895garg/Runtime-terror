# Dhara-Soochak — Technical Stack

## 1. Technical Objective

Dhara-Soochak is a GIS-first, AI-assisted last-mile landslide intelligence and decision-support platform.

The architecture must support:

- localized landslide risk estimation;
- GIS visualization;
- village and road prioritization;
- explainable AI;
- rainfall/terrain/geospatial data processing;
- official and public interfaces;
- future Python ML integration;
- future scaling from East Sikkim to additional districts.

The technical design intentionally separates the **ML/data pipeline** from the **web platform**, allowing both teams to work independently.

---

# 2. High-Level Architecture

```text
                  DATA SOURCES
                       │
      ┌────────────────┼─────────────────┐
      ↓                ↓                 ↓
 Landslide         Rainfall          Geospatial
 Inventory         GPM/IMERG          Layers
      │                │                 │
      └────────────────┼─────────────────┘
                       ↓
               DATA PROCESSING
                       ↓
              FEATURE ENGINEERING
                       ↓
               ML RISK ENGINE
                       ↓
               RISK PREDICTIONS
                       ↓
            GIS / ASSET PROCESSING
                       ↓
             PRIORITIZATION + XAI
                       ↓
                  API LAYER
                 ┌─────┴─────┐
                 ↓           ↓
          Official UI     Public UI
```

---

# 3. Recommended Stack

| Layer | Technology | Role | Priority |
|---|---|---|---|
| Frontend | Next.js + React + TypeScript | Main web application | MUST |
| Styling | Tailwind CSS | UI styling | MUST |
| UI Components | shadcn/ui | Consistent interface components | SHOULD |
| GIS Map | Leaflet + React-Leaflet | Interactive map | MUST |
| Charts | Recharts | Rainfall/analytics charts | SHOULD |
| Backend API | Next.js Route Handlers initially | Prototype API | MUST |
| ML Service | Python | Training/inference | MUST |
| ML Framework | scikit-learn | Baseline models | MUST |
| Gradient Boosting | XGBoost | Model comparison | SHOULD |
| XAI | SHAP | Explainability | SHOULD |
| DataFrames | pandas | Tabular processing | MUST |
| Vector GIS | GeoPandas | Vector processing | MUST |
| Raster GIS | Rasterio + GDAL | Raster processing | MUST |
| Geospatial DB | PostgreSQL + PostGIS | Scalable spatial storage | SHOULD / FUTURE |
| EO Processing | Google Earth Engine | Large satellite datasets | SHOULD |
| Validation | scikit-learn metrics | Model evaluation | MUST |
| API Validation | Zod / Pydantic | Typed contracts | MUST |
| Deployment | Vercel + Python hosting | Prototype deployment | SHOULD |
| Version Control | Git + GitHub | Source control | MUST |

---

# 4. Frontend

## Next.js

Use the latest stable Next.js with the App Router.

Reasons:

- fast development;
- file-based routing;
- server/client component separation;
- easy API routes;
- strong TypeScript support;
- straightforward deployment.

The frontend is responsible for:

- dashboards;
- maps;
- asset ranking;
- risk visualization;
- XAI panels;
- public view;
- official view;
- loading/error states.

It should NOT perform model training or heavy raster processing.

---

# 5. Language

## TypeScript

Use strict TypeScript throughout the frontend.

Requirements:

- no unnecessary `any`;
- typed API responses;
- shared types;
- reusable interfaces;
- runtime validation for external data where appropriate.

---

# 6. UI / Styling

## Tailwind CSS

Use Tailwind for:

- layout;
- responsive behavior;
- spacing;
- typography;
- color tokens;
- state styling.

Avoid scattered inline styling where reusable classes/components are possible.

## shadcn/ui

Use selectively for:

- cards;
- buttons;
- dropdowns;
- dialogs;
- sheets/drawers;
- tabs;
- command/search;
- tables;
- tooltips.

Do not let the component library make the app look like a generic SaaS template.

---

# 7. Mapping

## Leaflet / React-Leaflet

Primary GIS rendering solution for the SIH prototype.

Use it for:

- East Sikkim boundary;
- risk grid;
- roads;
- villages;
- landslide points;
- susceptibility;
- rainfall layers;
- asset selection;
- popups;
- map controls.

### Future scalability

For a larger deployment, consider:

- MapLibre;
- vector tiles;
- PostGIS;
- PMTiles;
- server-side tile generation.

Do not prematurely build a vector-tile pipeline for the prototype.

---

# 8. Geospatial Data Formats

Use:

### GeoJSON

For:

- small/medium map datasets;
- API responses;
- demo data.

### GeoTIFF

For:

- DEM;
- raster susceptibility;
- raster rainfall;
- satellite products.

### CSV / Parquet

For:

- training tables;
- historical events;
- processed features.

### Future

PostGIS for authoritative spatial storage.

---

# 9. Backend

## Initial prototype

Use Next.js Route Handlers.

Example:

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

Reasons:

- simple;
- low deployment overhead;
- shares TypeScript types with frontend;
- easy to demo.

## Future ML integration

A separate Python service can expose inference endpoints:

```text
POST /predict/grid
POST /predict/asset
GET  /model/metadata
GET  /model/health
```

The frontend should not know whether the backend is mock, Next.js, or Python.

---

# 10. Python ML Stack

Use:

```text
Python
pandas
numpy
scikit-learn
xgboost
shap
geopandas
rasterio
GDAL
```

### Responsibilities

Python handles:

- data cleaning;
- geospatial feature extraction;
- feature engineering;
- training;
- validation;
- inference;
- risk generation;
- SHAP calculations.

---

# 11. ML Model Strategy

## Baseline

Random Forest.

Use it for:

- robust baseline;
- small/moderate data;
- nonlinear tabular relationships;
- interpretable feature importance.

## Comparison

XGBoost.

Only add it after the Random Forest baseline is stable.

## Avoid initially

- LSTM;
- Transformer;
- large CNN;
- complex multimodal deep learning.

Only consider these if data volume and experiments justify them.

---

# 12. Model Input

Candidate features:

### Static

```text
elevation
slope
aspect
susceptibility
land_cover
distance_to_road
distance_to_river
```

### Dynamic

```text
rainfall_24h
rainfall_72h
rainfall_7d
```

Potential later additions:

```text
rainfall_14d
rainfall_intensity
rainfall_anomaly
curvature
terrain_ruggedness
```

### Experimental

```text
satellite_soil_moisture
```

Treat soil moisture as optional/experimental.

---

# 13. ML Target

Initial formulation:

```text
(cell_id, date, features) → is_landslide
```

Where:

```text
1 = landslide event
0 = selected non-event sample
```

The model output should be stored as:

```text
risk_score
risk_category
confidence
model_version
prediction_time
```

Do not automatically call an uncalibrated score a probability.

---

# 14. Data Pipeline

```text
Raw Datasets
    ↓
Download / API / GEE
    ↓
Validate
    ↓
Clip to East Sikkim
    ↓
Reproject
    ↓
Create analysis grid
    ↓
Extract static features
    ↓
Extract dynamic rainfall features
    ↓
Attach historical labels
    ↓
Create training table
    ↓
Train / Validate
    ↓
Generate predictions
    ↓
Export risk GeoJSON/Parquet
```

---

# 15. Dataset Sources

## Historical Landslides

Primary candidates:

- NRSC/ISRO Landslide Atlas;
- GSI inventory/Bhukosh;
- validated academic inventories.

Purpose:

- ground-truth labels;
- historical event verification.

## Rainfall

### NASA GPM IMERG

Purpose:

- rainfall trigger;
- antecedent rainfall.

Do not imply that its spatial resolution is 500m.

## DEM

### Copernicus DEM GLO-30 or verified alternative

Purpose:

- elevation;
- slope;
- aspect.

## Susceptibility

### GSI

Purpose:

- static susceptibility feature.

## Land Cover

### ESA WorldCover

Purpose:

- land-cover feature.

## Roads/Villages

### OpenStreetMap

Purpose:

- asset exposure;
- prioritization.

## Sentinel

Optional:

- change detection;
- post-event verification.

---

# 16. Spatial Resolution

Initial UI/model target:

```text
500m × 500m
```

But treat this as a configurable candidate resolution.

Implementation should allow:

```text
250m
500m
1km
```

without rewriting the system.

The final selected resolution must be supported by validation and data quality.

---

# 17. Rainfall Handling

Rainfall is approximately ~10–11 km for GPM IMERG.

Do NOT downscale rainfall merely to make it appear 500m.

Instead:

```text
Coarse regional rainfall trigger
+
Fine-resolution terrain/susceptibility
        ↓
Localized risk estimate
```

UI wording:

> "Localized risk estimation"

not:

> "500m rainfall prediction."

---

# 18. Data Storage

## Prototype

Use local files:

```text
/data
  /raw
  /processed
  /training
  /demo
```

Preferred formats:

- CSV;
- GeoJSON;
- GeoParquet;
- GeoTIFF.

## Scalable deployment

Move to:

```text
PostgreSQL + PostGIS
```

Recommended tables:

```text
districts
grid_cells
landslides
rainfall
susceptibility
villages
roads
infrastructure
risk_predictions
warnings
alerts
```

---

# 19. API Data Model

## RiskCell

```ts
type RiskCell = {
  id: string
  geometry: GeoJSON.Geometry
  riskScore: number
  riskCategory: RiskCategory
  rainfall24h: number
  rainfall72h: number
  rainfall7d: number
  slope: number
  elevation: number
  susceptibility: number
  confidence: ConfidenceLevel
  explanation: RiskExplanation[]
  modelVersion?: string
  generatedAt?: string
}
```

## Asset

```ts
type Asset = {
  id: string
  name: string
  type: "ROAD" | "VILLAGE" | "INFRASTRUCTURE"
  riskScore: number
  priority: PriorityLevel
  exposure?: number
  geometry: GeoJSON.Geometry
}
```

---

# 20. XAI Architecture

The model service calculates explanations.

The frontend only visualizes them.

Flow:

```text
Model Prediction
      ↓
SHAP
      ↓
Top Contributing Features
      ↓
Normalized API object
      ↓
Frontend XAI component
```

Example:

```text
72h rainfall       HIGH CONTRIBUTION
Slope              HIGH CONTRIBUTION
Susceptibility     HIGH CONTRIBUTION
7d rainfall        MODERATE CONTRIBUTION
```

Never represent SHAP values as causal percentages unless scientifically justified.

---

# 21. Risk Engine

Responsibilities:

1. load model;
2. load feature matrix;
3. validate feature schema;
4. run prediction;
5. attach model version;
6. assign category;
7. generate explanation;
8. write prediction output.

Model artifacts:

```text
/models/
  random_forest.joblib
  feature_schema.json
  model_metadata.json
  calibration.json
```

---

# 22. Asset Prioritization Engine

Input:

```text
Risk Grid
Road Network
Village Network
Infrastructure
```

Output:

```text
Road Priority
Village Priority
Infrastructure Priority
```

Candidate road metrics:

- maximum risk;
- mean risk;
- high-risk cell percentage;
- percentile risk;
- road class/importance.

Candidate village metrics:

- surrounding risk;
- proximity to risk cells;
- population/exposure where available.

Do not assume a single maximum-risk cell should automatically determine the risk of an entire long road.

---

# 23. Decision Flags

Use:

```text
PRIORITY_INSPECTION
MONITOR
ADVISORY
ROUTINE
```

These are recommendations/decision-support categories.

They are not autonomous emergency commands.

---

# 24. Public/Official Separation

## Official

Can see:

- priority rankings;
- administrative controls;
- internal decision flags;
- more detailed infrastructure information;
- analytics.

## Public

Can see:

- localized risk;
- official advisories;
- safety guidance;
- public map;
- last-update timestamp.

The public interface must not expose sensitive administrative information.

---

# 25. Alerting

For the prototype:

- in-app alerts;
- demo notifications;
- mock email event.

Future:

- authorized SMS;
- email;
- official notification integrations.

Do not send real public emergency warnings based solely on an experimental student ML model.

---

# 26. Authentication

Prototype:

- mocked role selection or simple auth.

Roles:

```text
PUBLIC
FIELD_OFFICER
DISTRICT_OFFICIAL
ADMIN
```

Future:

- secure OAuth/SSO;
- government identity integration if authorized;
- role-based access controls.

---

# 27. Deployment

## Frontend / Next.js

Recommended:

- Vercel for prototype;
- or any standard Node.js hosting.

## Python ML service

Possible:

- Render;
- Railway;
- AWS;
- Azure;
- GCP;
- other Python-capable host.

For SIH, avoid expensive infrastructure.

## Database

Prototype:

- local/static data.

Future:

- managed PostgreSQL + PostGIS.

---

# 28. Environment Variables

Example:

```env
NEXT_PUBLIC_MAP_TILE_URL=
NEXT_PUBLIC_API_BASE_URL=
DATABASE_URL=
ML_API_URL=
ML_API_KEY=
```

Never hard-code secrets.

---

# 29. Development Workflow

## Frontend team

Works on:

```text
Next.js
GIS
Dashboard
UX
API consumers
```

## ML/data team

Works on:

```text
Python
data acquisition
feature engineering
training
validation
risk output
SHAP
```

Both connect through the API contract.

---

# 30. Git Structure

Recommended repository:

```text
dhara-soochak/
├── web/
│   └── Next.js app
│
├── ml/
│   ├── data/
│   ├── notebooks/
│   ├── src/
│   ├── models/
│   └── tests/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── demo/
│
├── docs/
│   ├── PRD.md
│   ├── DESIGN.md
│   └── TECH_STACK.md
│
└── README.md
```

---

# 31. Testing

## Frontend

- route tests;
- component tests;
- API contract tests;
- responsive testing.

## ML

- schema validation;
- feature consistency;
- train/inference parity;
- leakage checks;
- unit tests for geospatial transformations;
- model evaluation scripts.

## GIS

Check:

- CRS consistency;
- geometry validity;
- clipping;
- intersections;
- asset-to-grid mapping.

---

# 32. Observability

Record:

```text
model_version
dataset_version
data_timestamp
prediction_timestamp
feature_schema_version
```

This is important for reproducibility.

---

# 33. Performance Targets

Prototype goals:

- dashboard usable on normal laptop hardware;
- map loads quickly with demo data;
- asset ranking updates without full page reload;
- optional layers lazy-loaded;
- no huge DOM-based grid rendering.

For larger production systems:

- PostGIS;
- vector tiles;
- caching;
- precomputed raster/vector layers.

---

# 34. Security Principles

- validate all API inputs;
- sanitize user-controlled values;
- protect API secrets;
- separate public and official data;
- apply least-privilege access;
- do not expose internal model metadata unnecessarily;
- log meaningful administrative events;
- avoid storing unnecessary personal information.

---

# 35. MVP Priorities

## P0

- Next.js app;
- East Sikkim GIS map;
- risk grid;
- roads;
- villages;
- historical landslides;
- priority ranking;
- asset detail;
- basic XAI;
- official dashboard;
- public view;
- mock API.

## P1

- rainfall charts;
- historical playback;
- real SHAP;
- data-quality indicator;
- demo alerts.

## P2

- infrastructure expansion;
- offline field workflows;
- multilingual support;
- satellite change detection;
- advanced model comparison.

---

# 36. Things NOT to Overbuild

Do not add without a strong requirement:

- blockchain;
- Kubernetes;
- unnecessary microservices;
- real-time streaming platforms;
- complex 3D GIS;
- AI chatbot;
- drone integration;
- physical IoT control;
- autonomous evacuation;
- national-scale production infrastructure.

---

# 37. Recommended Build Order

### Phase 1

```text
Next.js
Routing
Theme
Layout
```

### Phase 2

```text
Mock API
Types
Demo data
```

### Phase 3

```text
GIS map
Risk grid
Roads
Villages
Events
```

### Phase 4

```text
Prioritization
Asset drawer
Decision flags
XAI
```

### Phase 5

```text
Rainfall
Historical playback
Public view
```

### Phase 6

```text
Python ML integration
Real risk outputs
```

### Phase 7

```text
Polish
Testing
Performance
Demo preparation
```

---

# 38. Final Technical Principle

The product architecture should preserve this separation:

```text
                DATA / ML
                   │
          "Where is risk?"
                   ↓
             RISK ENGINE
                   │
                   ↓
                GIS LAYER
                   │
          "Who/what is exposed?"
                   ↓
           PRIORITIZATION
                   │
             "What first?"
                   ↓
            EXPLAINABILITY
                   │
               "Why?"
                   ↓
             USER INTERFACE
                   │
      ┌────────────┴────────────┐
      ↓                         ↓
   OFFICIAL                  PUBLIC
 Decision Support          Risk / Advisory
```

The frontend must remain useful even while the ML model is still being trained by consuming a stable mock/API contract.

---

# 39. Final Technical Decision

**Core stack:**

> **Next.js + TypeScript + Tailwind + Leaflet + Python + scikit-learn + Random Forest + SHAP + GeoPandas/Rasterio + GPM/DEM/GSI/NRSC/OSM datasets.**

**Database:**

> **Static files for SIH prototype → PostGIS for scalable deployment.**

**ML:**

> **Random Forest baseline → XGBoost comparison if justified.**

**Architecture:**

> **Frontend/API and ML service separated by typed contracts.**

**Deployment philosophy:**

> **Prototype locally, validate scientifically, deploy minimally, scale only after evidence.**
