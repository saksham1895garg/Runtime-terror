import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { verifyGodMode } from "@/utils/auth/godMode";
import { can, isRoot } from "@/utils/auth/permissions";
import UserManagementClient from "./components/UserManagementClient";

export const metadata = {
  title: "User Management - DHARA-SOOCHAK Control Center",
};

// Use admin client for reading user data securely
function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function DevUsersPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Verify basic access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div>Unauthorized</div>;
  }

  const rootEligible = await isRoot(user.id);
  const canReadUsers = rootEligible || await can(user.id, 'users.read') || await can(user.id, 'users.manage');
  const canManageUsers = rootEligible || await can(user.id, 'users.manage');

  if (!canReadUsers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md border border-dev-critical/30 bg-dev-critical/10 p-6 text-center">
          <h1 className="text-xl font-bold text-white">Access denied</h1>
          <p className="mt-2 text-sm text-dev-critical/90">You need users.read or users.manage to open identity management.</p>
        </div>
      </div>
    );
  }

  // Check if they have God Mode active
  const hasGodMode = await verifyGodMode();

  const adminClient = getAdminClient();
  
  const [
    usersResult,
    officerProfilesResult,
    publicReportsResult,
    advisoriesResult,
    developerIdentitiesResult,
    grantsResult,
    profilesResult,
    profilePermissionsResult,
    permissionsResult,
    godSessionsResult,
    securityEventsResult,
    auditLogsResult,
  ] = await Promise.all([
    adminClient.from('users').select('id, email, name, role, email_verified, created_at, updated_at, is_demo').order('created_at', { ascending: false }),
    adminClient.from('officer_profiles').select('*'),
    adminClient.from('public_reports').select('id, reporter_id, status, created_at'),
    adminClient.from('advisories').select('id, created_by, published_by, status'),
    adminClient.from('developer_identities').select('*'),
    adminClient.from('developer_grants').select('*').order('granted_at', { ascending: false }),
    adminClient.from('permission_profiles').select('*').order('name', { ascending: true }),
    adminClient.from('profile_permissions').select('*'),
    adminClient.from('permissions').select('*').order('id', { ascending: true }),
    adminClient.from('god_mode_sessions').select('id, user_id, expires_at, created_at, revoked_at').order('created_at', { ascending: false }),
    adminClient.from('security_events').select('*').order('timestamp', { ascending: false }).limit(200),
    adminClient.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
  ]);

  if (usersResult.error) {
    console.error("Failed to fetch users:", usersResult.error);
    return <div>Error loading users.</div>;
  }

  let authUsers: Array<{ id: string; app_metadata?: any; user_metadata?: any; created_at?: string; last_sign_in_at?: string; confirmed_at?: string; email_confirmed_at?: string }> = [];
  try {
    const { data } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authUsers = data?.users || [];
  } catch (error) {
    console.error("Failed to fetch auth users:", error);
  }

  return (
    <UserManagementClient
      users={usersResult.data || []}
      authUsers={authUsers}
      officerProfiles={officerProfilesResult.data || []}
      publicReports={publicReportsResult.data || []}
      advisories={advisoriesResult.data || []}
      developerIdentities={developerIdentitiesResult.data || []}
      grants={grantsResult.data || []}
      profiles={profilesResult.data || []}
      profilePermissions={profilePermissionsResult.data || []}
      permissions={permissionsResult.data || []}
      godSessions={godSessionsResult.data || []}
      securityEvents={securityEventsResult.data || []}
      auditLogs={auditLogsResult.data || []}
      isGodMode={hasGodMode}
      canManageUsers={canManageUsers}
    />
  );
}
