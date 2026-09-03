import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

type LogEvent = {
  actor_id?: string;
  actor_role?: string;
  action?: string;
  event_type?: string; // For security_events
  resource?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
};

function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * High-Security Append-Only Audit Log insertion.
 * Bypasses RLS strictly to insert. Updates/Deletes are blocked by DB triggers.
 */
export async function logAudit(event: LogEvent) {
  const adminClient = getAdminClient();
  const { error } = await adminClient.from('audit_logs').insert({
    actor_user_id: event.actor_id,
    actor_role: event.actor_role || 'developer',
    action: event.action,
    entity_type: event.resource || 'SYSTEM',
    entity_id: event.resource_id || 'unknown',
    old_value: event.before_state,
    new_value: event.after_state,
    reason: event.details?.reason || event.details?.message || null
  });

  if (error) {
    console.error("FATAL: Failed to append to audit_logs", error);
    // Depending on strictness, we might throw here to crash the operation if logging fails.
  }
}

/**
 * High-Security Append-Only Security Event insertion.
 * Used for authentication failures, God Mode escalation, and RBAC changes.
 */
export async function logSecurityEvent(event: LogEvent) {
  const adminClient = getAdminClient();
  const { error } = await adminClient.from('security_events').insert({
    actor_id: event.actor_id,
    event_type: event.event_type,
    details: event.details || {},
    ip_address: event.ip_address || 'server-internal'
  });

  if (error) {
    console.error("FATAL: Failed to append to security_events", error);
  }
}
