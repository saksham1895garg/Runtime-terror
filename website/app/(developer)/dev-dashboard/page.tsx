import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  Users, UserCog, ShieldCheck, FileWarning, 
  Flag, MessageSquareWarning, ShieldAlert,
  Server, Database, Activity, Mail
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { fetchML } from "@/utils/api/mlBackend";

export const metadata = {
  title: "Dashboard - DHARA-SOOCHAK Control Center",
};

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function DevDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const adminClient = getAdminClient();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const [
    { count: devCount },
    { count: officerCount },
    { count: publicCount },
    { count: reportCount },
    { count: flagCount },
    { count: advisoryCount },
    { data: securityEvents }
  ] = await Promise.all([
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'developer'),
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'officer'),
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'public'),
    adminClient.from('public_reports').select('*', { count: 'exact', head: true }).neq('status', 'RESOLVED'),
    adminClient.from('decision_flags').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
    adminClient.from('advisories').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
    adminClient.from('security_events').select('id, event_type, actor_id, timestamp').order('timestamp', { ascending: false }).limit(8)
  ]);

  let healthData: any = null;
  try {
    const { ok, data } = await fetchML("/health", { cache: 'no-store' });
    if (ok) healthData = data;
  } catch (e) {
    // health check failed
  }

  return (
    <div className="space-y-6 animate-slide-up p-6 bg-dev-bg min-h-screen text-dev-text">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dev-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">System Overview</h1>
          <p className="text-xs text-dev-text-muted mt-1">
            DHARA-SOOCHAK Development & Operations Console
          </p>
        </div>
        {isDemo && (
          <div className="px-2 py-1 bg-amber-900/30 border border-amber-800/50 text-amber-500 text-[10px] uppercase font-bold tracking-wider rounded">
            Demo Environment Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Link href="/users?tab=developers" className="group lg:col-span-1">
          <Card className="bg-dev-surface border-dev-border hover:border-dev-border/80 transition-colors h-full rounded-md shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <UserCog className="h-4 w-4 text-dev-text-muted" />
                <span className="text-[10px] font-bold text-dev-text-muted uppercase">Devs</span>
              </div>
              <div className="text-2xl font-mono font-bold">{devCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/users?tab=officers" className="group lg:col-span-1">
          <Card className="bg-dev-surface border-dev-border hover:border-dev-border/80 transition-colors h-full rounded-md shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <ShieldCheck className="h-4 w-4 text-dev-text-muted" />
                <span className="text-[10px] font-bold text-dev-text-muted uppercase">Officers</span>
              </div>
              <div className="text-2xl font-mono font-bold">{officerCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/users?tab=public" className="group lg:col-span-1">
          <Card className="bg-dev-surface border-dev-border hover:border-dev-border/80 transition-colors h-full rounded-md shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Users className="h-4 w-4 text-dev-text-muted" />
                <span className="text-[10px] font-bold text-dev-text-muted uppercase">Public</span>
              </div>
              <div className="text-2xl font-mono font-bold">{publicCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dev-dashboard/reports" className="group lg:col-span-1">
          <Card className="bg-dev-surface border-dev-border hover:border-dev-warning/50 transition-colors h-full rounded-md shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <FileWarning className="h-4 w-4 text-dev-warning" />
                <span className="text-[10px] font-bold text-dev-warning uppercase">Reports</span>
              </div>
              <div className="text-2xl font-mono font-bold">{reportCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dev-dashboard/reports?filter=flags" className="group lg:col-span-1">
          <Card className="bg-dev-surface border-dev-border hover:border-dev-critical/50 transition-colors h-full rounded-md shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Flag className="h-4 w-4 text-dev-critical" />
                <span className="text-[10px] font-bold text-dev-critical uppercase">Flags</span>
              </div>
              <div className="text-2xl font-mono font-bold">{flagCount || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dev-dashboard/advisories" className="group lg:col-span-1">
          <Card className="bg-dev-surface border-dev-border hover:border-dev-accent/50 transition-colors h-full rounded-md shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <MessageSquareWarning className="h-4 w-4 text-dev-accent" />
                <span className="text-[10px] font-bold text-dev-accent uppercase">Advisories</span>
              </div>
              <div className="text-2xl font-mono font-bold">{advisoryCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dev-surface border-dev-border shadow-sm rounded-md flex flex-col h-[400px]">
          <CardHeader className="border-b border-dev-border py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Security Events Log</span>
              <Link href="/dev-audit" className="text-[10px] uppercase text-dev-primary hover:text-dev-secondary transition-colors tracking-wider">
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-1 text-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-dev-elevated sticky top-0">
                <tr>
                  <th className="py-2 px-4 font-semibold text-[10px] uppercase tracking-wider text-dev-text-muted border-b border-dev-border">Timestamp</th>
                  <th className="py-2 px-4 font-semibold text-[10px] uppercase tracking-wider text-dev-text-muted border-b border-dev-border">Event</th>
                  <th className="py-2 px-4 font-semibold text-[10px] uppercase tracking-wider text-dev-text-muted border-b border-dev-border">Actor ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dev-border font-mono text-xs">
                {securityEvents && securityEvents.length > 0 ? (
                  securityEvents.map((event: any) => (
                    <tr key={event.id} className="hover:bg-dev-elevated/50 transition-colors">
                      <td className="py-2 px-4 text-dev-text-muted whitespace-nowrap">
                        {new Date(event.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="py-2 px-4">
                        <span className="flex items-center gap-2">
                          <ShieldAlert className="h-3 w-3 text-dev-warning" />
                          {event.event_type}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-dev-text-muted">
                        {event.actor_id?.substring(0,8)}...
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-dev-text-muted">
                      No recent events.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-dev-surface border-dev-border shadow-sm rounded-md flex flex-col h-[400px]">
          <CardHeader className="border-b border-dev-border py-3 px-4">
            <CardTitle className="text-sm font-bold">System Health</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col text-sm">
            <div className="divide-y divide-dev-border">
              <div className="flex items-center justify-between p-4 hover:bg-dev-elevated/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-dev-text-muted" />
                  <span className="font-medium text-dev-text">Database (Supabase)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${healthData?.database === 'connected' ? 'bg-dev-success' : 'bg-dev-critical'}`}></span>
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${healthData?.database === 'connected' ? 'text-dev-success' : 'text-dev-critical'}`}>
                    {healthData?.database === 'connected' ? 'Healthy' : 'Unreachable'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-dev-elevated/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-dev-text-muted" />
                  <span className="font-medium text-dev-text">Prediction API</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${healthData?.status === 'ok' ? 'bg-dev-success' : 'bg-dev-warning'}`}></span>
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${healthData?.status === 'ok' ? 'text-dev-success' : 'text-dev-warning'}`}>
                    {healthData?.status === 'ok' ? 'Healthy' : (healthData ? 'Degraded' : 'Unreachable')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 hover:bg-dev-elevated/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-dev-text-muted" />
                  <span className="font-medium text-dev-text">Celery Workers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${healthData?.redis_queue === 'connected' ? 'bg-dev-success' : 'bg-dev-critical'}`}></span>
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${healthData?.redis_queue === 'connected' ? 'text-dev-success' : 'text-dev-critical'}`}>
                    {healthData?.redis_queue === 'connected' ? 'Healthy' : 'Unreachable'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-dev-elevated/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-dev-text-muted" />
                  <span className="font-medium text-dev-text">Mail Delivery</span>
                </div>
                {process.env.RESEND_API_KEY ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-dev-success"></span>
                    <span className="text-[10px] font-bold text-dev-success tracking-wider uppercase">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-dev-warning"></span>
                    <span className="text-[10px] font-bold text-dev-warning tracking-wider uppercase">Not Configured</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
