export type RiskCategory = "UNASSESSED" | "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
export type PriorityLevel = "PRIORITY_INSPECTION" | "MONITOR" | "ADVISORY" | "ROUTINE";
export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW";
export type ReportSeverity = "HIGH" | "MODERATE" | "LOW";
export type FlagStatus = "NEW" | "UNDER_REVIEW" | "ASSIGNED" | "FIELD_VERIFICATION" | "RESOLVED" | "DISMISSED";
export type AdvisoryType = "INFORMATIONAL" | "MONITOR" | "TRAVEL_CAUTION" | "ROAD_RESTRICTION" | "PREPAREDNESS" | "EVACUATION";
export type AdvisoryStatus = "DRAFT" | "PUBLISHED" | "WITHDRAWN";

export interface RiskExplanation {
  feature: string;
  contribution: number;
  direction: "UP" | "DOWN";
  importance: "HIGH" | "MODERATE" | "LOW";
}

export interface GridCell {
  id: string;
  gridCode?: string;
  district?: string | null;
  cellSizeM?: number;
  latitude?: number;
  longitude?: number;
  geometry: any; // GeoJSON.Geometry
  riskScore: number | null;
  riskCategory: RiskCategory;
  modelEstimate: number | null;
  rainfall24h: number;
  rainfall72h: number;
  rainfall7d: number;
  slope: number;
  elevation: number;
  aspect: string;
  susceptibility: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  landCover: string;
  confidence: ConfidenceLevel;
  explanation: RiskExplanation[];
  modelVersion?: string;
  generatedAt?: string | null;
  nearbyVillages?: string[];
  nearbyRoads?: string[];
}

export interface Asset {
  id: string;
  name: string;
  type: "ROAD" | "VILLAGE" | "INFRASTRUCTURE";
  riskScore: number;
  priority: PriorityLevel;
  exposure?: number;
  geometry: any; // GeoJSON.Geometry
  lat?: number | null;
  lng?: number | null;
  population?: number;
  district?: string | null;
  isDemo?: boolean;
}

export interface Warning {
  id: string;
  level: RiskCategory;
  title: string;
  description: string;
  issuedAt: string;
  source: string;
}

export interface Alert {
  id: string;
  type: "RISK_ESCALATION" | "REGIONAL_WARNING" | "PRIORITY_ASSET" | "DATA_QUALITY";
  assetId?: string;
  assetName?: string;
  title: string;
  description: string;
  action: PriorityLevel;
  timestamp: string;
}

export interface PublicReport {
  id: string;
  gridId?: string;
  location: [number, number]; // [lon, lat]
  category: "GROUND_CRACK" | "SLOPE_MOVEMENT" | "FALLEN_DEBRIS" | "BLOCKED_ROAD" | "ROCKFALL" | "WATER_SEEPAGE" | "LANDSLIDE" | "DAMAGED_INFRA";
  description: string;
  severity: ReportSeverity;
  photoUrl?: string;
  videoUrl?: string;
  reporterType: "CITIZEN" | "FIELD_OFFICER" | "ANONYMOUS";
  timestamp: string;
  status: FlagStatus;
  discrepancy?: boolean;
}

export interface OfficerFlag {
  id: string;
  type: "DISCREPANCY" | "HIGH_RISK_ASSET";
  relatedReportId?: string;
  relatedAssetId?: string;
  gridId?: string;
  title: string;
  description: string;
  status: FlagStatus;
  timestamp: string;
  recommendedAction: string;
}

export interface HistoricalSnapshot {
  date: string;
  gridData: any; // FeatureCollection
  events: LandslideEvent[];
}

export interface LandslideEvent {
  id: string;
  date: string;
  location: string;
  coordinates: [number, number];
  source: string;
  nearestVillage?: string;
  nearestRoad?: string;
}

export interface RainfallObservation {
  locationId: string;
  timestamp: string;
  rainfall24h: number;
  rainfall72h: number;
  rainfall7d: number;
  rainfall14d?: number;
  trend: "UP" | "DOWN" | "STABLE";
  source: string;
}

export interface DataQuality {
  freshness: "HIGH" | "MODERATE" | "LOW";
  lastRainfallUpdate: string;
  lastModelRun: string;
  lastMapGeneration: string;
  issues: string[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'developer' | 'officer' | 'public';
  emailVerified: boolean;
  isDemo: boolean;
}

export interface OfficerProfile {
  userId: string;
  designation: string | null;
  jurisdiction: string | null;
  department: string | null;
  badgeId: string | null;
}

export interface Advisory {
  id: string;
  type: AdvisoryType;
  title: string;
  description: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  area: string;
  status: AdvisoryStatus;
  publishedBy: string | null;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any | null;
  newValue: any | null;
  reason: string | null;
  timestamp: string;
}

export interface ReportMedia {
  id: string;
  reportId: string;
  url: string;
  thumbnailUrl: string | null;
  type: 'photo' | 'video';
  imagekitFileId: string | null;
  sizeBytes: number | null;
  createdAt: string;
}
