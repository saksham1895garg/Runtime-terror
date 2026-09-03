import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Activity, Clock, Server, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { fetchML } from "@/utils/api/mlBackend";

export const metadata = {
  title: "Run Detail - DHARA-SOOCHAK",
};

export const dynamic = 'force-dynamic';

export default async function RunDetailPage({
  params,
}: {
  params: { run_id: string }
}) {
  const { run_id } = params;

  let runData = null;
  let recoveryData = null;
  let eventsData = null;
  
  try {
    const [runRes, recRes, evtRes] = await Promise.all([
      fetchML(`/runs/${run_id}`, { cache: 'no-store' }),
      fetchML(`/runs/${run_id}/recovery`, { cache: 'no-store' }),
      fetchML(`/runs/${run_id}/events?limit=100`, { cache: 'no-store' })
    ]);
    if (runRes.ok) runData = runRes.data;
    if (recRes.ok) recoveryData = recRes.data;
    if (evtRes.ok) eventsData = evtRes.data;
  } catch (e) {
    console.error(e);
  }

  if (!runData) {
    return <div className="p-8 text-dev-critical">Failed to load run details. Ensure backend is running.</div>;
  }

  let statusColor = "text-dev-text-muted";
  if (runData.status === "RUNNING") statusColor = "text-dev-accent";
  if (runData.status === "COMPLETED") statusColor = "text-dev-success";
  if (runData.status === "FAILED") statusColor = "text-dev-critical";

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dev-dashboard/runs" className="text-dev-primary hover:underline text-sm">
          ← Back to Runs
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-dev-primary" />
            Run Details
          </h1>
          <p className="text-dev-text-muted mt-1 font-mono text-sm">{run_id}</p>
        </div>
        <div className={`px-4 py-2 rounded-full border border-current font-bold ${statusColor}`}>
          {runData.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-dev-surface border-dev-border shadow-premium">
          <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{runData.progress_percent?.toFixed(1)}%</div>
            <div className="w-full h-2 bg-dev-bg rounded-full overflow-hidden">
              <div className="h-full bg-dev-primary" style={{ width: `${runData.progress_percent}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-dev-text-muted">
              <span>{runData.processed_cells} processed</span>
              <span>{runData.total_cells} total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dev-surface border-dev-border shadow-premium">
          <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Outcomes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-dev-text-muted uppercase mb-1">Success</div>
                <div className="text-2xl font-bold text-dev-success">{runData.successful_cells || 0}</div>
              </div>
              <div>
                <div className="text-xs text-dev-text-muted uppercase mb-1">Failed</div>
                <div className="text-2xl font-bold text-dev-critical">{runData.failed_cells || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dev-surface border-dev-border shadow-premium">
          <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Lineage & Duration</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-dev-text-muted">Model:</span>
              <span className="text-white font-mono">{runData.model_name || "N/A"}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-dev-text-muted">Duration:</span>
              <span className="text-white">{runData.duration ? `${runData.duration.toFixed(2)}s` : "-"}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-dev-text-muted">Trigger:</span>
              <span className="text-white">{runData.trigger_source || "API"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-dev-surface border-dev-border shadow-premium flex flex-col h-[500px]">
          <CardHeader className="border-b border-dev-border pb-4">
            <CardTitle className="text-white">Recovery Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-auto flex-1 text-sm space-y-6">
             {!recoveryData ? (
               <div className="text-dev-text-muted">Loading recovery...</div>
             ) : (
               <>
                 <div>
                   <h3 className="text-dev-critical font-bold mb-2 flex items-center gap-2"><XCircle className="w-4 h-4" /> Explicitly Failed Grids ({recoveryData.failed_grids?.length || 0})</h3>
                   <div className="bg-dev-bg border border-dev-border rounded p-2 text-xs font-mono h-24 overflow-auto">
                     {recoveryData.failed_grids?.join(", ") || "None"}
                   </div>
                 </div>
                 
                 <div>
                   <h3 className="text-dev-warning font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Incomplete / Stale Grids ({recoveryData.incomplete_grids?.length || 0})</h3>
                   <div className="bg-dev-bg border border-dev-border rounded p-2 text-xs font-mono h-24 overflow-auto">
                     {recoveryData.incomplete_grids?.join(", ") || "None"}
                   </div>
                 </div>

                 <div>
                   <h3 className="text-dev-text-muted font-bold mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Unprocessed Grids ({recoveryData.unprocessed_grids?.length || 0})</h3>
                   <div className="bg-dev-bg border border-dev-border rounded p-2 text-xs font-mono h-24 overflow-auto">
                     {recoveryData.unprocessed_grids?.join(", ") || "None"}
                   </div>
                 </div>
               </>
             )}
          </CardContent>
        </Card>

        <Card className="bg-dev-surface border-dev-border shadow-premium flex flex-col h-[500px]">
          <CardHeader className="border-b border-dev-border pb-4">
            <CardTitle className="text-white">Recent Events Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-1">
             <div className="divide-y divide-dev-border">
               {eventsData?.events?.map((ev: any) => {
                 let ecolor = "text-dev-text-muted";
                 if (ev.event_type.includes("FAIL")) ecolor = "text-dev-critical";
                 if (ev.event_type.includes("COMPLETED")) ecolor = "text-dev-success";
                 if (ev.event_type.includes("STARTED")) ecolor = "text-dev-accent";

                 return (
                   <div key={ev.id} className="p-4 hover:bg-dev-elevated">
                     <div className="flex items-center justify-between mb-1">
                       <span className={`text-xs font-bold ${ecolor}`}>{ev.event_type}</span>
                       <span className="text-xs text-dev-text-muted">{new Date(ev.created_at).toLocaleString()}</span>
                     </div>
                     <p className="text-sm text-white font-mono break-all">{ev.message}</p>
                   </div>
                 )
               })}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
