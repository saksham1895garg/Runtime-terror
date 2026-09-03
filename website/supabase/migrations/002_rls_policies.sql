-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rainfall_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- USERS & PROFILES
-- ==========================================

-- Public users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Officers can read all public profiles
CREATE POLICY "Officers can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- Profile extensions follow user table rules
CREATE POLICY "Users can read own officer profile" ON public.officer_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Officers can read officer profiles" ON public.officer_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

CREATE POLICY "Users can read own public profile" ON public.public_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Officers can read public profiles" ON public.public_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- ==========================================
-- REPORTS & MEDIA
-- ==========================================

-- Public can read their own reports
CREATE POLICY "Public users can read own reports" ON public.public_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Public can create reports
CREATE POLICY "Public users can create reports" ON public.public_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id OR anonymous = TRUE);

-- Officers can read all reports
CREATE POLICY "Officers can read all reports" ON public.public_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- Officers can update reports
CREATE POLICY "Officers can update reports" ON public.public_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- Media follows report policies
CREATE POLICY "Users can read own report media" ON public.report_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.public_reports pr WHERE pr.id = report_id AND pr.reporter_id = auth.uid())
  );

CREATE POLICY "Officers can read all report media" ON public.report_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- ==========================================
-- DECISION FLAGS & OFFICER ACTIONS
-- ==========================================

-- Public cannot read decision flags
CREATE POLICY "Officers can manage decision flags" ON public.decision_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- Officers can manage their actions
CREATE POLICY "Officers can read officer actions" ON public.officer_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

CREATE POLICY "Officers can create officer actions" ON public.officer_actions
  FOR INSERT WITH CHECK (
    auth.uid() = officer_id AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- ==========================================
-- ADVISORIES
-- ==========================================

-- Public can read PUBLISHED advisories
CREATE POLICY "Public can read published advisories" ON public.advisories
  FOR SELECT USING (status = 'PUBLISHED');

-- Officers can manage advisories
CREATE POLICY "Officers can read all advisories" ON public.advisories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

CREATE POLICY "Officers can create advisories" ON public.advisories
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

CREATE POLICY "Officers can update advisories" ON public.advisories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- ==========================================
-- AUDIT LOGS
-- ==========================================

-- Officers can read audit logs
CREATE POLICY "Officers can read audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('officer', 'developer'))
  );

-- System creates audit logs (bypasses RLS via service role)

-- ==========================================
-- ASSETS & DEMO DATA
-- ==========================================

-- Public can read assets (filtered by API to remove sensitive raw risk data)
CREATE POLICY "Public can read assets" ON public.grid_cells
  FOR SELECT USING (TRUE);
  
CREATE POLICY "Public can read villages" ON public.villages
  FOR SELECT USING (TRUE);
  
CREATE POLICY "Public can read road segments" ON public.road_segments
  FOR SELECT USING (TRUE);
  
CREATE POLICY "Public can read rainfall records" ON public.rainfall_records
  FOR SELECT USING (TRUE);
  
CREATE POLICY "Public can read historical events" ON public.historical_events
  FOR SELECT USING (TRUE);

-- Only Developers can write/modify asset/demo data
CREATE POLICY "Developers can manage demo data" ON public.grid_cells
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'developer')
  );

CREATE POLICY "Developers can manage villages" ON public.villages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'developer')
  );

CREATE POLICY "Developers can manage road segments" ON public.road_segments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'developer')
  );

CREATE POLICY "Developers can manage rainfall" ON public.rainfall_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'developer')
  );

CREATE POLICY "Developers can manage historical events" ON public.historical_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'developer')
  );
