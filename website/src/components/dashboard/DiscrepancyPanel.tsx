import Link from "next/link";
import { AlertTriangle, Flag } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";

interface DiscrepancyPanelProps {
  flags: any[];
  reports?: any[];
}

export function DiscrepancyPanel({ flags = [], reports = [] }: DiscrepancyPanelProps) {
  const actionableFlags = flags.filter((flag) => !["RESOLVED", "DISMISSED"].includes(flag.status));

  return (
    <div className="w-full bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">Action Flags ({actionableFlags.length})</h2>
        <p className="mt-1 text-[11px] text-slate-500">Open decision flags recorded in the decision_flags table.</p>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-2">
        {actionableFlags.length === 0 && (
          <EmptyState
            icon={Flag}
            title="No open decision flags"
            message="There are no NEW, UNDER_REVIEW, ASSIGNED, or FIELD_VERIFICATION flags to review."
          />
        )}

        {actionableFlags.map((flag) => {
          const linkedReport = reports.find((report) => report.id === flag.report_id || report.id === flag.related_report_id);
          return (
            <div key={flag.id} className="rounded-md border p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{flag.title || flag.id}</p>
                    <Badge variant={flag.type === "DISCREPANCY" ? "destructive" : "warning"}>
                      {String(flag.type).replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{flag.description || "No description recorded."}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block font-semibold uppercase text-slate-400">Grid</span>
                      <span className="font-mono text-slate-700">{flag.grid_id || "Not recorded"}</span>
                    </div>
                    <div>
                      <span className="block font-semibold uppercase text-slate-400">Status</span>
                      <span className="text-slate-700">{String(flag.status).replaceAll("_", " ")}</span>
                    </div>
                  </div>
                  {linkedReport && (
                    <p className="mt-2 text-xs text-slate-600">
                      Linked report: <span className="font-mono">{linkedReport.id}</span>
                      {linkedReport.nearest_village ? ` near ${linkedReport.nearest_village}` : ""}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/flags?flag=${encodeURIComponent(flag.id)}`}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
