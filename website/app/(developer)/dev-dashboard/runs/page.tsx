import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Activity, Play, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { fetchML } from "@/utils/api/mlBackend";
import TriggerPredictionButton from "./TriggerPredictionButton";

export const metadata = {
  title: "Prediction Runs - DHARA-SOOCHAK Control Center",
};

export const dynamic = 'force-dynamic';

export default async function RunsListPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; status?: string; model_name?: string }
}) {
  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "20");
  
  let endpoint = `/runs?page=${page}&limit=${limit}`;
  if (searchParams.status) endpoint += `&status=${searchParams.status}`;
  if (searchParams.model_name) endpoint += `&model_name=${searchParams.model_name}`;

  let runsData = null;
  let fetchError = null;
  try {
    const res = await fetchML(endpoint, { cache: 'no-store' });
    runsData = res.data;
  } catch (err: any) {
    fetchError = err.message || "Failed to load runs";
  }
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Activity className="h-8 w-8 text-dev-primary" />
          Prediction Runs
        </h1>
        <div className="flex items-center gap-6">
          <TriggerPredictionButton />
          <div className="text-sm text-dev-text-muted">
            Showing page {page} of {Math.ceil((runsData?.total || 0) / limit) || 1}
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-lg bg-dev-critical/10 border border-dev-critical text-dev-critical">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          Failed to load runs: {fetchError}. Ensure FastAPI backend is running and configured.
        </div>
      )}

      <Card className="bg-dev-surface border-dev-border shadow-premium">
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-dev-text-muted uppercase bg-dev-bg border-b border-dev-border">
              <tr>
                <th className="px-6 py-4 font-medium">Run ID</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Outcome</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium">Cells (S/F)</th>
                <th className="px-6 py-4 font-medium">Model</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium text-right">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dev-border">
              {runsData?.runs?.map((run: any) => {
                let statusColor = "text-dev-text-muted";
                if (run.status === "RUNNING") statusColor = "text-dev-accent";
                if (run.status === "COMPLETED") statusColor = "text-dev-success";
                if (run.status === "FAILED") statusColor = "text-dev-critical";
                
                let outcomeColor = "text-dev-text-muted";
                if (run.completion_outcome === "SUCCESS") outcomeColor = "text-dev-success";
                if (run.completion_outcome === "PARTIAL_SUCCESS") outcomeColor = "text-dev-warning";
                if (run.completion_outcome === "FAILED") outcomeColor = "text-dev-critical";

                return (
                  <tr key={run.run_id} className="hover:bg-dev-elevated transition-colors group">
                    <td className="px-6 py-4 font-mono">
                      <Link href={`/dev-dashboard/runs/${run.run_id}`} className="text-dev-primary hover:underline group-hover:text-white transition-colors">
                        {run.run_id.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className={`px-6 py-4 font-medium ${statusColor}`}>
                      {run.status}
                    </td>
                    <td className={`px-6 py-4 font-medium ${outcomeColor}`}>
                      {run.completion_outcome || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-dev-bg rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-dev-primary" 
                            style={{ width: `${run.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs">{run.progress_percent?.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-dev-success">{run.successful_cells || 0}</span>
                       <span className="text-dev-text-muted mx-1">/</span>
                       <span className="text-dev-critical">{run.failed_cells || 0}</span>
                       <span className="text-dev-text-muted ml-2">of {run.total_cells}</span>
                    </td>
                    <td className="px-6 py-4">
                      {run.model_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-dev-text-muted">
                      {run.duration ? `${run.duration.toFixed(1)}s` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-dev-text-muted">
                      {run.started_at ? new Date(run.started_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}
              
              {(!runsData?.runs || runsData.runs.length === 0) && !fetchError && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-dev-text-muted">
                    No runs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      {/* Pagination Controls */}
      <div className="flex justify-end gap-2">
        {page > 1 && (
          <Link href={`/dev-dashboard/runs?page=${page - 1}&limit=${limit}`} className="px-4 py-2 rounded-md bg-dev-surface border border-dev-border hover:bg-dev-elevated transition-colors text-sm text-white">
            Previous
          </Link>
        )}
        {runsData && runsData.runs.length === limit && (
          <Link href={`/dev-dashboard/runs?page=${page + 1}&limit=${limit}`} className="px-4 py-2 rounded-md bg-dev-surface border border-dev-border hover:bg-dev-elevated transition-colors text-sm text-white">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
