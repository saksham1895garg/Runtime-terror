'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { can, isRoot } from '@/utils/auth/permissions';

// Use admin client for secure mutations on internal tables
function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function grantProfileToDeveloper(targetUserId: string, profileId: string, reason: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify caller has permission to manage users
  const hasAccess = await can(user.id, 'users.manage');
  if (!hasAccess) throw new Error("Forbidden: Missing users.manage permission");

  const adminClient = getAdminClient();

  // Enforce boundary: Normal devs cannot escalate to Root. (Root is handled via bootstrap/God Mode anyway)
  // Ensure the target is actually a developer
  const { data: targetUser } = await adminClient
    .from('users')
    .select('role')
    .eq('id', targetUserId)
    .single();

  if (!targetUser || targetUser.role !== 'developer') {
    throw new Error("Target is not a developer");
  }

  // Insert the grant
  const { error } = await adminClient
    .from('developer_grants')
    .insert({
      user_id: targetUserId,
      profile_id: profileId,
      granted_by: user.id,
      reason: reason
    });

  if (error) {
    console.error(error);
    throw new Error("Failed to grant profile");
  }

  // Log the action securely
  await adminClient.from('security_events').insert({
    actor_id: user.id,
    event_type: 'PROFILE_GRANTED',
    details: { target_user: targetUserId, profile_id: profileId, reason },
    ip_address: 'server-action'
  });

  revalidatePath('/dev-dashboard/developers');
  return { success: true };
}

export async function revokeProfile(grantId: string, reason: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const hasAccess = await can(user.id, 'users.manage');
  if (!hasAccess) throw new Error("Forbidden: Missing users.manage permission");

  const adminClient = getAdminClient();

  const { error } = await adminClient
    .from('developer_grants')
    .update({
      revoked_by: user.id,
      revoked_at: new Date().toISOString(),
      reason: reason
    })
    .eq('id', grantId)
    .is('revoked_at', null); // only active grants

  if (error) {
    console.error(error);
    throw new Error("Failed to revoke profile");
  }

  await adminClient.from('security_events').insert({
    actor_id: user.id,
    event_type: 'PROFILE_REVOKED',
    details: { grant_id: grantId, reason },
    ip_address: 'server-action'
  });

  revalidatePath('/dev-dashboard/developers');
  return { success: true };
}
