-- Enable PostGIS for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USERS & PROFILES
-- ==========================================

-- Extends the Supabase auth.users table implicitly in our application logic,
-- but we keep a public users table for application relationships.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('developer', 'officer', 'public')),
  password_hash TEXT, -- Stored securely if using custom credential provider
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Officer specific metadata
CREATE TABLE public.officer_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  designation TEXT,
  jurisdiction TEXT,
  department TEXT,
  badge_id TEXT
);

-- Public user specific metadata
CREATE TABLE public.public_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  phone TEXT,
  anonymous_allowed BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==========================================
-- PUBLIC REPORTS & MEDIA
-- ==========================================

CREATE TABLE public.public_reports (
  id TEXT PRIMARY KEY, -- e.g., PR-123456
  title TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('GROUND_CRACK', 'SLOPE_MOVEMENT', 'FALLEN_DEBRIS', 'BLOCKED_ROAD', 'ROCKFALL', 'WATER_SEEPAGE', 'LANDSLIDE', 'DAMAGED_INFRA')),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH')),
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'ASSIGNED', 'FIELD_VERIFICATION', 'RESOLVED', 'DISMISSED')),
  nearest_grid_cell TEXT,
  nearest_village TEXT,
  nearest_road TEXT,
  anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.report_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id TEXT NOT NULL REFERENCES public.public_reports(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  imagekit_file_id TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- WORKFLOW & ADVISORIES
-- ==========================================

CREATE TABLE public.decision_flags (
  id TEXT PRIMARY KEY, -- e.g., FL-123456
  type TEXT NOT NULL CHECK (type IN ('DISCREPANCY', 'HIGH_RISK_ASSET')),
  related_report_id TEXT REFERENCES public.public_reports(id) ON DELETE CASCADE,
  related_asset_id TEXT,
  grid_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'ASSIGNED', 'FIELD_VERIFICATION', 'RESOLVED', 'DISMISSED')),
  recommended_action TEXT,
  model_estimate DOUBLE PRECISION,
  field_severity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.officer_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  officer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('REPORT', 'FLAG', 'ADVISORY')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('REVIEW', 'ASSIGN', 'ESCALATE', 'CONFIRM', 'DISMISS', 'RESOLVE', 'DRAFT', 'PUBLISH', 'WITHDRAW')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.advisories (
  id TEXT PRIMARY KEY, -- e.g., ADV-123456
  type TEXT NOT NULL CHECK (type IN ('INFORMATIONAL', 'MONITOR', 'TRAVEL_CAUTION', 'ROAD_RESTRICTION', 'PREPAREDNESS', 'EVACUATION')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'WITHDRAWN')),
  published_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- AUDIT & SYSTEM
-- ==========================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ASSETS & DEMO DATA
-- ==========================================

-- Grid Cells
CREATE TABLE public.grid_cells (
  id TEXT PRIMARY KEY,
  geometry JSONB NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_category TEXT NOT NULL CHECK (risk_category IN ('VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH')),
  model_estimate DOUBLE PRECISION NOT NULL,
  rainfall_24h INTEGER NOT NULL,
  rainfall_72h INTEGER NOT NULL,
  rainfall_7d INTEGER NOT NULL,
  slope INTEGER NOT NULL,
  elevation INTEGER NOT NULL,
  aspect TEXT NOT NULL,
  susceptibility TEXT NOT NULL CHECK (susceptibility IN ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH')),
  land_cover TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('LOW', 'MODERATE', 'HIGH')),
  explanation JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

-- Villages
CREATE TABLE public.villages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  risk_score INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('ROUTINE', 'MONITOR', 'ADVISORY', 'PRIORITY_INSPECTION')),
  exposure INTEGER,
  district TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

-- Road Segments
CREATE TABLE public.road_segments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  geometry JSONB NOT NULL,
  risk_score INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('ROUTINE', 'MONITOR', 'ADVISORY', 'PRIORITY_INSPECTION')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

-- Rainfall Records
CREATE TABLE public.rainfall_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  rainfall_24h INTEGER NOT NULL,
  rainfall_72h INTEGER NOT NULL,
  rainfall_7d INTEGER NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('UP', 'DOWN', 'STABLE')),
  source TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

-- Historical Events
CREATE TABLE public.historical_events (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL,
  nearest_village TEXT,
  nearest_road TEXT,
  description TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);
