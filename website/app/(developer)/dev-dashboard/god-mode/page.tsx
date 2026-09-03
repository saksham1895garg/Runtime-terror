import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRoot } from '@/utils/auth/permissions';
import { getActiveGodModeSession } from '@/utils/auth/godMode';
import GodModeEntry from './GodModeEntry';
import GodModeDashboard from './GodModeDashboard';

function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function GodModePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dev-login');
  }

  // Strictly assert Root eligibility first
  const rootEligible = await isRoot(user.id);
  
  if (!rootEligible) {
    // If a normal developer tries to access this route, strictly deny them
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4 p-8 border border-red-500/20 bg-red-500/5 rounded-xl shadow-2xl shadow-red-500/10">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-red-500 tracking-tight">ACCESS DENIED</h1>
          <p className="text-gray-400 max-w-sm text-sm">
            Your identity does not hold the Root capability required to enter this sector. This incident has been logged.
          </p>
        </div>
      </div>
    );
  }

  // Check if they already have an active, secure God Mode session token
  const activeSession = await getActiveGodModeSession();

  if (!activeSession) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#050505] text-white">
        <GodModeEntry />
      </div>
    );
  }

  const adminClient = getAdminClient();
  const [
    featureFlagsResult,
    godSessionsResult,
    securityEventsResult,
    rootDevelopersResult,
  ] = await Promise.all([
    adminClient.from('feature_flags').select('*, users(email, name)').order('updated_at', { ascending: false }),
    adminClient.from('god_mode_sessions').select('id, user_id, created_at, expires_at, revoked_at').order('created_at', { ascending: false }).limit(25),
    adminClient.from('security_events').select('*').order('timestamp', { ascending: false }).limit(12),
    adminClient.from('developer_identities').select('user_id, is_root, users(email, name)').eq('is_root', true),
  ]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050505] text-white">
      <GodModeDashboard
        userEmail={user.email}
        activeSession={activeSession}
        featureFlags={featureFlagsResult.data || []}
        godSessions={godSessionsResult.data || []}
        securityEvents={securityEventsResult.data || []}
        rootDevelopers={rootDevelopersResult.data || []}
      />
    </div>
  );
}
