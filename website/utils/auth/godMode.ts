import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

/**
 * Validates if the current request has an active, highly secure God Mode session.
 * Uses the Service Role to bypass RLS and query the secure god_mode_sessions table.
 */
export async function verifyGodMode(): Promise<boolean> {
  const activeSession = await getActiveGodModeSession();
  return Boolean(activeSession);
}

export async function getActiveGodModeSession(): Promise<{ id: string; expires_at: string; created_at: string } | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('GodMode-Token')?.value;

  if (!sessionToken) return null;

  // 1. Verify standard authentication session first
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 2. Hash the provided token (we only store the hash)
  const hashedToken = crypto.createHash('sha256').update(sessionToken).digest('hex');

  // 3. Query securely using Admin Client
  const adminClient = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: activeSessions } = await adminClient
    .from('god_mode_sessions')
    .select('id, expires_at, created_at')
    .eq('user_id', user.id)
    .eq('hashed_token', hashedToken)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1);

  return activeSessions?.[0] || null;
}
