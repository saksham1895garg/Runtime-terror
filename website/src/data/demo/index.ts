import { GridCell, Asset, Warning, Alert, PublicReport, OfficerFlag, HistoricalSnapshot, LandslideEvent, RainfallObservation, DataQuality } from "@/src/types";

// Base coordinates around East Sikkim (Gangtok area)
const BASE_LAT = 27.3314;
const BASE_LON = 88.6138;

// Function to generate a realistic looking hex or square grid over a region
export function generateRiskGrid(count: number): any {
  const features = [];
  
  // Seed random predictably for demo consistency
  let seed = 12345;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const categories = ["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH"];
  const susceptibilities = ["LOW", "MODERATE", "HIGH", "VERY_HIGH"];
  
  for (let i = 0; i < count; i++) {
    const lat = BASE_LAT + (rand() - 0.5) * 0.2;
    const lon = BASE_LON + (rand() - 0.5) * 0.2;
    const size = 0.005; // approx 500m
    
    // Generate Polygon
    const coords = [[
      [lon - size/2, lat - size/2],
      [lon + size/2, lat - size/2],
      [lon + size/2, lat + size/2],
      [lon - size/2, lat + size/2],
      [lon - size/2, lat - size/2]
    ]];

    const riskVal = rand();
    let catIndex = 0;
    if (riskVal > 0.4) catIndex = 1;
    if (riskVal > 0.7) catIndex = 2;
    if (riskVal > 0.85) catIndex = 3;
    if (riskVal > 0.95) catIndex = 4;
    
    const riskScore = Math.floor(riskVal * 100);

    features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: coords },
      properties: {
        id: `ES-${(i + 1000).toString().substring(0, 4)}`,
        riskScore: riskScore,
        riskCategory: categories[catIndex],
        modelEstimate: Number((riskVal).toFixed(2)),
        rainfall24h: Math.floor(rand() * 150),
        rainfall72h: Math.floor(rand() * 300),
        rainfall7d: Math.floor(rand() * 500),
        slope: Math.floor(10 + rand() * 40), // 10 to 50 degrees
        elevation: Math.floor(1000 + rand() * 2000), // 1000 to 3000m
        aspect: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(rand() * 8)],
        susceptibility: susceptibilities[Math.floor(rand() * 4)],
        landCover: ["Forest", "Built-up", "Agriculture", "Barren"][Math.floor(rand() * 4)],
        confidence: rand() > 0.2 ? "HIGH" : "MODERATE",
        explanation: [
          { feature: "72h Rainfall", contribution: Math.floor(20 + rand() * 30), direction: "UP", importance: "HIGH" },
          { feature: "Slope", contribution: Math.floor(10 + rand() * 20), direction: "UP", importance: "HIGH" },
          { feature: "Susceptibility", contribution: Math.floor(10 + rand() * 20), direction: "UP", importance: "HIGH" }
        ],
        generatedAt: new Date().toISOString(),
        nearbyVillages: rand() > 0.5 ? [["Gangtok", "Singtam", "Rangpo", "Pakyong"][Math.floor(rand() * 4)]] : [],
        nearbyRoads: rand() > 0.5 ? [["NH-10", "JN Road", "North Sikkim Hwy"][Math.floor(rand()*3)]] : []
      } as GridCell
    });
  }

  // Force first cell to be LOW risk to test discrepancy later
  features[0].properties.riskScore = 25;
  features[0].properties.riskCategory = "LOW";
  features[0].properties.modelEstimate = 0.25;

  return {
    type: "FeatureCollection",
    features
  };
}

export const mockRiskGrid = generateRiskGrid(150);

// Generate other mock data...
const SIKKIM_VILLAGES = [
  "Gangtok", "Singtam", "Rangpo", "Pakyong", "Rhenock", 
  "Rongli", "Dikchu", "Mangan", "Namchi", "Gyalshing",
  "Chungthang", "Lachen", "Lachung", "Ravangla", "Jorethang",
  "Nayabazar", "Melli", "Sombaria", "Dentam", "Soreng"
];

export const mockVillages: Asset[] = SIKKIM_VILLAGES.map((name, i) => ({
  id: `V-${i+1}`,
  name: name,
  type: "VILLAGE",
  riskScore: Math.floor(30 + Math.random() * 70),
  priority: Math.random() > 0.8 ? "PRIORITY_INSPECTION" : (Math.random() > 0.5 ? "MONITOR" : "ROUTINE"),
  exposure: Math.floor(100 + Math.random() * 2000),
  geometry: { 
    type: "Point", 
    coordinates: [BASE_LON + (Math.random() - 0.5) * 0.2, BASE_LAT + (Math.random() - 0.5) * 0.2] 
  }
}));

const SIKKIM_ROADS = [
  "NH-10 (Siliguri-Gangtok)", "JN Road (Gangtok-Nathu La)", 
  "North Sikkim Highway", "Pakyong Airport Road", "Rongli-Chujachen Road",
  "Singtam-Dikchu Road", "Namchi-Jorethang Road", "Ravangla-Makha Road",
  "Gyalshing-Legship Road", "Melli-Nayabazar Road"
];

export const mockRoads: Asset[] = SIKKIM_ROADS.map((name, i) => ({
  id: `R-${i+1}`,
  name: name,
  type: "ROAD",
  riskScore: Math.floor(40 + Math.random() * 60),
  priority: Math.random() > 0.8 ? "PRIORITY_INSPECTION" : (Math.random() > 0.5 ? "MONITOR" : "ROUTINE"),
  geometry: { 
    type: "LineString", 
    coordinates: [
      [BASE_LON + (Math.random() - 0.5) * 0.2, BASE_LAT + (Math.random() - 0.5) * 0.2],
      [BASE_LON + (Math.random() - 0.5) * 0.2, BASE_LAT + (Math.random() - 0.5) * 0.2]
    ] 
  }
}));

export const initialPublicReports: PublicReport[] = [
  {
    id: "PR-001",
    gridId: mockRiskGrid.features[0].properties.id, // linked to LOW risk cell
    location: [BASE_LON + 0.01, BASE_LAT + 0.01],
    category: "GROUND_CRACK",
    description: "Large crack observed near roadside after heavy rainfall.",
    severity: "HIGH",
    reporterType: "CITIZEN",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "NEW",
    discrepancy: true
  }
];

export const initialOfficerFlags: OfficerFlag[] = [
  {
    id: "FL-001",
    type: "DISCREPANCY",
    relatedReportId: "PR-001",
    gridId: mockRiskGrid.features[0].properties.id,
    title: "FIELD-MODEL DISCREPANCY",
    description: "Local field evidence contradicts current model estimate (LOW RISK).",
    status: "NEW",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    recommendedAction: "HUMAN VERIFICATION REQUIRED"
  }
];

export const mockWarnings: Warning[] = [
  {
    id: "W-01",
    level: "HIGH",
    title: "Heavy Rainfall Warning",
    description: "IMD predicts heavy to very heavy rainfall across East Sikkim over the next 48 hours.",
    issuedAt: "2026-08-30T08:00:00Z",
    source: "State Disaster Management Authority"
  }
];

export const mockAlerts: Alert[] = [
  {
    id: "A-01",
    type: "RISK_ESCALATION",
    assetId: "V-01",
    assetName: "Singtam",
    title: "Risk Escalation: Singtam",
    description: "Risk score increased from 62 to 88 in the last 12 hours due to accumulated rainfall.",
    action: "PRIORITY_INSPECTION",
    timestamp: "2026-08-30T10:00:00Z"
  }
];

export const mockEvents: LandslideEvent[] = [
  {
    id: "E-01",
    date: "2025-06-15",
    location: "Near Singtam",
    coordinates: [88.50, 27.24],
    source: "GSI",
    nearestVillage: "Singtam"
  }
];

export const mockRainfall: RainfallObservation[] = [
  {
    locationId: "LOC-1",
    timestamp: "2026-08-30T09:00:00Z",
    rainfall24h: 120,
    rainfall72h: 240,
    rainfall7d: 400,
    trend: "UP",
    source: "GPM IMERG"
  }
];

export const mockDataQuality: DataQuality = {
  freshness: "HIGH",
  lastRainfallUpdate: "2026-08-30T09:30:00Z",
  lastModelRun: "2026-08-30T09:45:00Z",
  lastMapGeneration: "2026-08-30T09:50:00Z",
  issues: []
};
