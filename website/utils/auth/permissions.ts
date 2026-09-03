import { createClient } from '@supabase/supabase-js';

// Initialize a singleton admin client for secure backend checks
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Validates if a given user is explicitly bootstrapped as Root.
 */
export async function isRoot(userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await adminClient
    .from('developer_identities')
    .select('is_root')
    .eq('user_id', userId)
    .single();

  if (error || !data) return false;
  return data.is_root === true;
}

/**
 * Checks if a user has a specific granular permission natively.
 * Does NOT automatically grant access if the user is Root (enforcing explicit grants where required),
 * but you can wrap this to check Root implicitly if desired.
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  if (!userId || !permissionName) return false;

  // 1. Fetch active grants for the user
  const { data: grants, error: grantsError } = await adminClient
    .from('developer_grants')
    .select('profile_id')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (grantsError || !grants || grants.length === 0) return false;

  const profileIds = grants.map(g => g.profile_id);

  // 2. Check if any of those profiles have the requested permission
  const { data: profilePermissions, error: permError } = await adminClient
    .from('profile_permissions')
    .select('permission_id')
    .in('profile_id', profileIds)
    .eq('permission_id', permissionName)
    .limit(1);

  if (permError || !profilePermissions || profilePermissions.length === 0) {
    return false;
  }

  return true;
}

/**
 * A composite helper that grants access if the user is Root OR has the granular permission.
 * Use this for typical access control guards.
 */
export async function can(userId: string, permissionName: string): Promise<boolean> {
  if (!userId) return false;
  
  const rootStatus = await isRoot(userId);
  if (rootStatus) return true;

  return await hasPermission(userId, permissionName);
}
