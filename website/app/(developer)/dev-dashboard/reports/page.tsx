import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { FileWarning, Eye, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Public Reports - DHARA-SOOCHAK Control Center',
};

function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function DevReportsPage() {
  const adminClient = getAdminClient();
  
  const { data: reports, error } = await adminClient
    .from('public_reports')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-slide-up">
      <div className="border-b border-dev-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <FileWarning className="h-8 w-8 text-dev-warning" />
            Public Reports
          </h1>
          <p className="text-dev-text-muted mt-2 text-sm">Developer inspection view of all submitted reports.</p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-dev-critical/10 border border-dev-critical/30 rounded-lg text-dev-critical flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>Failed to load reports: {error.message}</span>
        </div>
      ) : (
        <div className="bg-dev-surface border border-dev-border rounded-xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-dev-elevated text-dev-text-muted uppercase text-[10px] tracking-widest border-b border-dev-border">
                <tr>
                  <th className="p-4 font-bold">Report ID / Title</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Location</th>
                  <th className="p-4 font-bold">Reporter</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dev-border">
                {reports?.map((report: any) => (
                  <tr key={report.id} className="hover:bg-dev-elevated transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{report.title}</div>
                      <div className="text-[10px] font-mono text-dev-text-muted mt-1">{report.id}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold text-dev-accent bg-dev-accent/10 px-2 py-1 rounded border border-dev-accent/20 uppercase tracking-widest">
                        {report.category || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-dev-text-muted">
                      {report.lat?.toFixed(4)}, {report.lon?.toFixed(4)}
                    </td>
                    <td className="p-4">
                      <div className="text-white text-xs">{report.users?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-dev-text-muted font-mono">{report.users?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${
                        report.status === 'NEW' ? 'bg-dev-critical/10 text-dev-critical border-dev-critical/30' :
                        report.status === 'RESOLVED' ? 'bg-dev-success/10 text-dev-success border-dev-success/30' :
                        'bg-dev-warning/10 text-dev-warning border-dev-warning/30'
                      }`}>
                        {report.status || 'NEW'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-xs text-dev-primary hover:text-white px-2.5 py-1.5 bg-dev-primary/10 hover:bg-dev-primary/30 rounded transition-colors border border-dev-primary/20 flex items-center justify-center gap-1.5 ml-auto">
                        <Eye className="h-3.5 w-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {(!reports || reports.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-dev-text-muted text-sm">
                      No public reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
