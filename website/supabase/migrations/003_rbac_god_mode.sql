-- ==========================================
-- RBAC, GOD MODE, AND SECURITY EVENTS
-- ==========================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
-- Grant usage to authenticated ONLY so they can execute specific RLS helper functions
GRANT USAGE ON SCHEMA private TO authenticated;

-- 1. PERMISSIONS & PROFILES
CREATE TABLE public.permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE public.permission_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE public.profile_permissions (
  profile_id UUID NOT NULL REFERENCES public.permission_profiles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, permission_id)
);

CREATE TABLE public.developer_identities (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  is_root BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.developer_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.permission_profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  expires_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  reason TEXT NOT NULL
);

-- 2. GOD MODE & STEP-UP AUTHENTICATION
CREATE TABLE public.verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hashed_code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  used_at TIMESTAMPTZ
);

CREATE TABLE public.god_mode_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hashed_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  revoked_at TIMESTAMPTZ
);

-- 3. CONFIGURATION & LOGGING
CREATE TABLE public.feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.god_mode_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
-- Note: audit_logs RLS was enabled in 002_rls_policies.sql.

-- ==========================================
-- STRICT IMMUTABILITY TRIGGERS
-- ==========================================
-- These triggers protect against normal application/database-role mutation. 
-- Note: Database superusers can always bypass triggers if they deliberately drop them.
CREATE OR REPLACE FUNCTION private.prevent_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Updates and deletes are strictly prohibited on append-only audit tables.';
END;
$$;

CREATE TRIGGER enforce_audit_logs_append_only
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION private.prevent_modification();

CREATE TRIGGER enforce_security_events_append_only
BEFORE UPDATE OR DELETE ON public.security_events
FOR EACH ROW EXECUTE FUNCTION private.prevent_modification();

-- ==========================================
-- SECURE HELPER FUNCTIONS
-- ==========================================

-- 1. Helper for evaluating Root status securely without triggering permission denied
CREATE OR REPLACE FUNCTION private.is_root()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_identities di 
    WHERE di.user_id = (SELECT auth.uid()) 
      AND di.is_root = true
  );
$$;

REVOKE EXECUTE ON FUNCTION private.is_root FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_root TO authenticated;

-- 2. Helper for evaluating granular active permissions securely
CREATE OR REPLACE FUNCTION private.has_my_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.developer_grants dg
    JOIN public.profile_permissions pp ON dg.profile_id = pp.profile_id
    WHERE dg.user_id = (SELECT auth.uid())
      AND pp.permission_id = p_permission
      AND dg.revoked_at IS NULL
      AND (dg.expires_at IS NULL OR dg.expires_at > pg_catalog.now())
  );
$$;

REVOKE EXECUTE ON FUNCTION private.has_my_permission FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_my_permission TO authenticated;

-- ==========================================
-- STRICT IMMUTABILITY & ACCESS GRANTS
-- ==========================================

-- 1. Revoke ALL privileges from standard roles for sensitive logging tables
REVOKE ALL ON public.audit_logs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.security_events FROM PUBLIC, anon, authenticated;

-- 2. Allow ONLY SELECT for authenticated users (RLS filters this further)
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.security_events TO authenticated;

-- 3. For internal server-only tables, completely deny frontend client access
REVOKE ALL ON public.feature_flags FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.verification_codes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.god_mode_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.developer_identities FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.developer_grants FROM PUBLIC, anon, authenticated;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- permissions, profiles, profile_permissions: Authenticated Users can read, Root manages
CREATE POLICY "Authenticated users can read permissions" ON public.permissions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read permission profiles" ON public.permission_profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can read profile permissions" ON public.profile_permissions FOR SELECT TO authenticated USING (TRUE);

-- audit_logs & security_events
DROP POLICY IF EXISTS "Officers can read audit logs" ON public.audit_logs;

CREATE POLICY "Authorized devs can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    private.has_my_permission('audit.read') OR private.is_root()
  );

CREATE POLICY "Root can view security events" ON public.security_events
  FOR SELECT TO authenticated USING (
    private.is_root()
  );

-- ==========================================
-- DEFAULT SEED DATA
-- ==========================================
INSERT INTO public.permissions (id, name, description) VALUES
('reports.read', 'Read Public Reports', 'View public reports and ground truth submissions'),
('reports.update', 'Update Public Reports', 'Change the status or details of public reports'),
('reports.delete', 'Delete Public Reports', 'Remove public reports from the system'),
('advisories.read', 'Read Advisories', 'View all draft and published advisories'),
('advisories.publish', 'Publish Advisories', 'Publish emergency advisories to the public'),
('users.read', 'Read Users', 'View developer and officer profiles'),
('users.manage', 'Manage Users', 'Invite users and assign normal permission profiles'),
('feature_flags.read', 'Read Feature Flags', 'View current system configuration'),
('feature_flags.update', 'Update Feature Flags', 'Modify system configuration and toggles'),
('audit.read', 'Read Audit Logs', 'View the append-only audit history of the system');
