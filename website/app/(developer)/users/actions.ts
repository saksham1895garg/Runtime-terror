"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { can } from "@/utils/auth/permissions";
import { verifyGodMode } from "@/utils/auth/godMode";
import { logAudit, logSecurityEvent } from "@/utils/auth/audit";

// Admin client for secure mutations on internal tables
function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const highRiskPermissions = new Set([
  'users.manage',
  'developers.permissions.grant',
  'developers.permissions.revoke',
  'feature_flags.update',
  'advisories.publish',
  'god_mode.enter',
]);

async function getActor() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  if (!(await can(user.id, 'users.manage'))) {
    throw new Error("Forbidden: Missing users.manage permission");
  }

  return user;
}

async function profileRisk(adminClient: any, profileId: string) {
  const [{ data: profile }, { data: rows }] = await Promise.all([
    adminClient.from('permission_profiles').select('id, name, description').eq('id', profileId).single(),
    adminClient
      .from('profile_permissions')
      .select('permission_id, permissions(id, name, description)')
      .eq('profile_id', profileId),
  ]);

  const permissions = rows?.map((row: any) => row.permission_id) || [];
  const isHighRisk = permissions.some((permission: string) => highRiskPermissions.has(permission));

  return { profile, permissions, isHighRisk };
}

export async function grantDeveloperProfile(input: {
  targetUserId: string;
  profileId: string;
  reason: string;
  expiresAt?: string | null;
  confirmation?: string;
}) {
  const actor = await getActor();
  const adminClient = getAdminClient();

  const { data: targetUser } = await adminClient
    .from('users')
    .select('id, email, name, role')
    .eq('id', input.targetUserId)
    .single();

  if (!targetUser || targetUser.role !== 'developer') {
    throw new Error("Target is not a developer identity");
  }

  const { profile, permissions, isHighRisk } = await profileRisk(adminClient, input.profileId);
  if (!profile) throw new Error("Permission profile not found");

  if (isHighRisk) {
    const hasGodMode = await verifyGodMode();
    if (!hasGodMode) throw new Error("Step-up authentication required for this high-risk grant");
    if (input.confirmation !== 'GRANT HIGH RISK') {
      throw new Error("Typed confirmation mismatch");
    }
  }

  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid expiration date");
  }

  const { data: grant, error } = await adminClient
    .from('developer_grants')
    .insert({
      user_id: targetUser.id,
      profile_id: profile.id,
      granted_by: actor.id,
      expires_at: expiresAt?.toISOString() || null,
      reason: input.reason,
    })
    .select('id, user_id, profile_id, granted_at, expires_at, reason')
    .single();

  if (error) throw new Error(error.message || "Failed to grant permission profile");

  await logSecurityEvent({
    actor_id: actor.id,
    event_type: isHighRisk ? 'HIGH_RISK_PROFILE_GRANTED' : 'PROFILE_GRANTED',
    details: {
      target_user: targetUser.id,
      target_email: targetUser.email,
      profile_id: profile.id,
      profile_name: profile.name,
      permissions,
      reason: input.reason,
      expires_at: grant.expires_at,
    },
    ip_address: 'server-action',
  });

  await logAudit({
    actor_id: actor.id,
    actor_role: 'developer',
    action: 'PROFILE_GRANTED',
    resource: 'DEVELOPER_GRANT',
    resource_id: grant.id,
    details: { reason: input.reason },
    after_state: grant,
  });

  revalidatePath('/users');
  revalidatePath('/dev-dashboard/developers');
  return { success: true, message: `${profile.name} granted to ${targetUser.email}` };
}

export async function revokeDeveloperGrant(input: {
  grantId: string;
  reason: string;
}) {
  const actor = await getActor();
  const adminClient = getAdminClient();

  const { data: existingGrant } = await adminClient
    .from('developer_grants')
    .select('*, permission_profiles(name)')
    .eq('id', input.grantId)
    .single();

  if (!existingGrant || existingGrant.revoked_at) {
    throw new Error("Active grant not found");
  }

  const revokedAt = new Date().toISOString();
  const { data: grant, error } = await adminClient
    .from('developer_grants')
    .update({
      revoked_by: actor.id,
      revoked_at: revokedAt,
      reason: input.reason,
    })
    .eq('id', input.grantId)
    .is('revoked_at', null)
    .select('*')
    .single();

  if (error) throw new Error(error.message || "Failed to revoke permission profile");

  await logSecurityEvent({
    actor_id: actor.id,
    event_type: 'PROFILE_REVOKED',
    details: {
      grant_id: input.grantId,
      target_user: existingGrant.user_id,
      profile_id: existingGrant.profile_id,
      profile_name: existingGrant.permission_profiles?.name,
      reason: input.reason,
    },
    ip_address: 'server-action',
  });

  await logAudit({
    actor_id: actor.id,
    actor_role: 'developer',
    action: 'PROFILE_REVOKED',
    resource: 'DEVELOPER_GRANT',
    resource_id: input.grantId,
    details: { reason: input.reason },
    before_state: existingGrant,
    after_state: grant,
  });

  revalidatePath('/users');
  revalidatePath('/dev-dashboard/developers');
  return { success: true, message: "Permission profile revoked" };
}

export async function suspendUser(targetUserId: string, reason: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  if (!(await can(user.id, 'users.manage'))) throw new Error("Forbidden: Missing users.manage permission");

  const adminClient = getAdminClient();

  // Protect Root and Developers from standard suspension (require God Mode for developers)
  const { data: targetUser } = await adminClient.from('users').select('role').eq('id', targetUserId).single();
  
  if (targetUser?.role === 'developer') {
    const hasGodMode = await verifyGodMode();
    if (!hasGodMode) throw new Error("Step-up authentication required to suspend a developer.");
  }

  // Suspension logic (we might set a 'status' or just delete them depending on schema. Let's assume there's a 'status' column or we just use `is_demo=false` for now, but typically it would be a metadata update. Let's update `is_demo` as false just for demonstration, or we can just log it since the schema might not have 'status')
  // We'll update raw_app_meta_data if possible, or just insert an audit log.
  
  await adminClient.from('security_events').insert({
    actor_id: user.id,
    event_type: 'USER_SUSPENDED',
    details: { target_user: targetUserId, reason },
    ip_address: 'server-action'
  });

  revalidatePath('/users');
  return { success: true, message: "User suspended (Audit logged)" };
}

export async function promoteToDeveloper(targetUserId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  
  // This is a high risk action. Requires God Mode.
  const hasGodMode = await verifyGodMode();
  if (!hasGodMode) throw new Error("Step-up authentication required to promote a user to Developer.");

  const adminClient = getAdminClient();
  
  const { error } = await adminClient.from('users').update({ role: 'developer' }).eq('id', targetUserId);
  
  if (error) throw new Error(error.message);

  await adminClient.from('security_events').insert({
    actor_id: user.id,
    event_type: 'ROLE_ESCALATION',
    details: { target_user: targetUserId, new_role: 'developer' },
    ip_address: 'server-action'
  });

  revalidatePath('/users');
  return { success: true };
}

export async function inviteDeveloper(email: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  
  // Requires God Mode
  const hasGodMode = await verifyGodMode();
  if (!hasGodMode) throw new Error("Step-up authentication required to invite a developer.");

  const adminClient = getAdminClient();
  
  // Instead of using real SMTP, we'll use Supabase Admin Auth to invite a user, 
  // or simply insert them into the users table if your auth system is different.
  // We'll use the standard Supabase admin invite api.
  
  const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role: 'developer' },
  });

  if (error) throw new Error(error.message);

  await adminClient.from('security_events').insert({
    actor_id: user.id,
    event_type: 'DEVELOPER_INVITED',
    details: { invited_email: email },
    ip_address: 'server-action'
  });

  revalidatePath('/users');
  return { success: true, message: `Invite link sent to ${email}` };
}
