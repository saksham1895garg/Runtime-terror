import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { can, isRoot } from '@/utils/auth/permissions';
import { ShieldAlert, ScrollText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Audit & Security Logs - DHARA-SOOCHAK',
};

export default async function AuditPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dev-login');
  }

  const isAuthorized = (await isRoot(user.id)) || (await can(user.id, 'audit.read'));

  if (!isAuthorized) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 p-8 border border-dev-critical/20 bg-dev-critical/10 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.1)]">
          <ShieldAlert className="h-10 w-10 text-dev-critical mx-auto" />
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-dev-critical/80 text-sm">You do not have the 'audit.read' permission.</p>
        </div>
      </div>
    );
  }

  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch security events - schema uses 'timestamp' not 'created_at'
  const { data: securityEvents, error: secError } = await adminClient
    .from('security_events')
    .select('id, actor_id, event_type, details, ip_address, timestamp, users:actor_id(name, email)')
    .order('timestamp', { ascending: false })
    .limit(100);

  // Fetch audit logs - schema uses 'timestamp' not 'created_at'
  const { data: auditLogs, error: auditError } = await adminClient
    .from('audit_logs')
    .select('id, actor_user_id, actor_role, action, entity_type, entity_id, old_value, new_value, reason, timestamp, users:actor_user_id(name, email)')
    .order('timestamp', { ascending: false })
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-up">
      <div className="border-b border-dev-border pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-dev-primary">DHARA-SOOCHAK / Governance</p>
          <h1 className="mt-2 text-3xl font-black text-white">System Audit Stream</h1>
          <p className="text-dev-text-muted mt-2 text-sm max-w-2xl">Immutable, append-only record of all system mutations and security events. No record may be updated or deleted.</p>
        </div>
        <div className="text-right text-xs font-mono text-dev-success bg-dev-success/10 p-2.5 border border-dev-success/20 flex items-center gap-2 shrink-0">
          <CheckCircle2 className="h-4 w-4" />
          APPEND-ONLY: ENFORCED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-dev-warning flex items-center gap-2 uppercase tracking-widest">
              <ShieldAlert className="h-4 w-4" />
              Security Events ({securityEvents?.length ?? 0})
            </h2>
          </div>
          {secError && <p className="text-dev-critical text-sm border border-dev-critical/30 bg-dev-critical/10 p-3">Error: {secError.message}</p>}
          
          <div className="bg-dev-surface border border-dev-border overflow-hidden divide-y divide-dev-border h-[600px] overflow-y-auto scrollbar-thin">
            {securityEvents?.map((event: any) => {
              const isError = event.event_type?.includes('FAIL') || event.event_type?.includes('PREVENTED') || event.event_type?.includes('DENIED');
              const isWarning = event.event_type?.includes('ESCALAT') || event.event_type?.includes('GOD_MODE') || event.event_type?.includes('ROOT') || event.event_type?.includes('REVOKED');
              return (
                <div key={event.id} className="p-4 hover:bg-dev-elevated transition-colors">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 border uppercase tracking-wider ${
                      isError ? 'bg-dev-critical/10 text-dev-critical border-dev-critical/30' : 
                      isWarning ? 'bg-dev-warning/10 text-dev-warning border-dev-warning/30' :
                      'bg-dev-success/10 text-dev-success border-dev-success/30'
                    }`}>
                      {event.event_type}
                    </span>
                    <span className="text-[10px] text-dev-text-muted font-mono shrink-0">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-white mb-2">
                    <span className="text-dev-text-muted text-[10px] uppercase tracking-widest mr-2">Actor:</span> 
                    <span className="font-mono text-xs">{event.users?.email || event.actor_id || 'System'}</span>
                  </div>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <pre className="p-3 bg-dev-bg text-xs text-dev-text-muted overflow-x-auto border border-dev-border font-mono scrollbar-thin">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  )}
                  <div className="mt-2 text-[10px] text-dev-text-muted/50 font-mono">IP: {event.ip_address || 'N/A'}</div>
                </div>
              );
            })}
            {(!securityEvents || securityEvents.length === 0) && (
              <div className="p-8 text-center text-dev-text-muted text-sm">No security events recorded.</div>
            )}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <ScrollText className="h-4 w-4 text-dev-primary" />
              Audit Log ({auditLogs?.length ?? 0})
            </h2>
          </div>
          {auditError && <p className="text-dev-critical text-sm border border-dev-critical/30 bg-dev-critical/10 p-3">Error: {auditError.message}</p>}
          
          <div className="bg-dev-surface border border-dev-border overflow-hidden divide-y divide-dev-border h-[600px] overflow-y-auto scrollbar-thin">
            {auditLogs?.map((log: any) => (
              <div key={log.id} className="p-4 hover:bg-dev-elevated transition-colors">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-dev-primary bg-dev-primary/10 px-2 py-1 border border-dev-primary/20 uppercase tracking-wider">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-dev-text-muted font-mono bg-dev-bg px-2 py-1 border border-dev-border">
                      {log.entity_type}
                    </span>
                    {log.actor_role && (
                      <span className="text-[10px] text-dev-text-muted/70 font-mono">{log.actor_role}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-dev-text-muted font-mono whitespace-nowrap shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-white mb-1">
                  <span className="text-dev-text-muted text-[10px] uppercase tracking-widest mr-2">Actor:</span> 
                  <span className="font-mono text-xs">{log.users?.email || log.actor_user_id || 'System'}</span>
                </div>
                {log.entity_id && log.entity_id !== 'unknown' && (
                  <div className="text-[10px] text-dev-text-muted mb-2 font-mono">
                    Resource ID: {log.entity_id}
                  </div>
                )}
                {log.reason && (
                  <div className="text-xs text-dev-text-muted italic mb-2 border-l-2 border-dev-border pl-2">
                    {log.reason}
                  </div>
                )}
                {(log.old_value || log.new_value) && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {log.old_value && (
                      <div className="p-3 bg-dev-warning/5 border border-dev-warning/20">
                        <div className="text-[10px] text-dev-warning/70 font-bold uppercase tracking-widest mb-2">Before</div>
                        <pre className="text-[10px] text-dev-text-muted overflow-x-auto font-mono scrollbar-thin">
                          {JSON.stringify(log.old_value, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_value && (
                      <div className="p-3 bg-dev-success/5 border border-dev-success/20">
                        <div className="text-[10px] text-dev-success/70 font-bold uppercase tracking-widest mb-2">After</div>
                        <pre className="text-[10px] text-dev-text-muted overflow-x-auto font-mono scrollbar-thin">
                          {JSON.stringify(log.new_value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {(!auditLogs || auditLogs.length === 0) && (
              <div className="p-8 text-center text-dev-text-muted text-sm">No audit log entries found.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
