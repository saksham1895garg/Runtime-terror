"use client";

import { ExternalLink, FileText, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

export function ReportDetailDrawer({ report, onClose }: { report: any; onClose: () => void }) {
  const [currentReport, setCurrentReport] = useState(report);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const lat = Number(report.lat);
  const lon = Number(report.lon);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lon);
  const media = Array.isArray(report.report_media) ? report.report_media : [];
  useEffect(() => {
    fetch(`/api/officer/reports/${encodeURIComponent(report.id)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((body) => {
        if (body?.report) setCurrentReport(body.report);
        setPrediction(body?.prediction ?? null);
      })
      .catch(() => undefined);
  }, [report.id]);
  const act = async (action: "REVIEW" | "RESOLVE") => {
    setPendingAction(action);
    setActionError(null);
    try {
      const response = await fetch(`/api/officer/reports/${encodeURIComponent(report.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Report action failed");
      setCurrentReport(body.report);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Report action failed");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="report-detail-title">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close report detail" />
      <section className="relative h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Public report</p>
            <h2 id="report-detail-title" className="mt-1 text-xl font-bold text-slate-900">{report.id}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close report detail">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={report.severity === "HIGH" ? "destructive" : report.severity === "MODERATE" ? "warning" : "secondary"}>
              {report.severity}
            </Badge>
            <Badge variant="outline">{String(currentReport.status).replaceAll("_", " ")}</Badge>
            <Badge variant="secondary">{String(report.category).replaceAll("_", " ")}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Submitted</dt>
              <dd className="mt-1 text-slate-800">{new Date(report.created_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Reporter</dt>
              <dd className="mt-1 text-slate-800">
                {report.anonymous ? "Anonymous" : report.users?.name || report.users?.email || "Unavailable"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Grid reference</dt>
              <dd className="mt-1 font-mono text-slate-800">{report.nearest_grid_cell || "Not recorded"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Coordinates</dt>
              <dd className="mt-1 font-mono text-slate-800">
                {hasCoordinates ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : "Not recorded"}
              </dd>
            </div>
          </dl>

          {hasCoordinates && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <MapPin className="h-4 w-4" /> Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {(report.nearest_village || report.nearest_road) && (
            <div className="rounded-lg border bg-slate-50 p-4 text-sm">
              {report.nearest_village && <p><span className="font-semibold">Nearest village:</span> {report.nearest_village}</p>}
              {report.nearest_road && <p className={report.nearest_village ? "mt-2" : ""}><span className="font-semibold">Nearest road:</span> {report.nearest_road}</p>}
            </div>
          )}

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FileText className="h-4 w-4" /> Report context</h3>
            {report.title && <p className="mt-3 font-semibold text-slate-800">{report.title}</p>}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.description}</p>
          </div>

          <div className="rounded-lg border bg-slate-50 p-4 text-sm">
            <h3 className="font-semibold text-slate-900">Prediction context</h3>
            {prediction ? (
              <p className="mt-2 text-slate-600">
                Grid {prediction.grid_code}: {prediction.risk_category} risk, score {prediction.risk_score}, generated {new Date(prediction.generated_at).toLocaleString()}.
              </p>
            ) : (
              <p className="mt-2 text-slate-500">No prediction is recorded for this report&apos;s grid.</p>
            )}
          </div>

          {actionError && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
          <div className="border-t pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Audited actions</p>
            
            {currentReport.officer_actions && currentReport.officer_actions.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {currentReport.officer_actions.map((action: any) => (
                  <li key={action.id} className="text-sm text-slate-600 rounded bg-slate-50 p-2">
                    <span className="font-semibold text-slate-900">{action.action}</span> by officer <span className="font-mono">{action.officer_id.slice(0,8)}</span> on {new Date(action.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-slate-500 italic">No previous actions recorded.</p>
            )}

            <div className="flex gap-2">
              {currentReport.status === "NEW" && <Button onClick={() => act("REVIEW")} disabled={Boolean(pendingAction)}>Mark under review</Button>}
              {!['RESOLVED', 'DISMISSED'].includes(currentReport.status) && <Button variant="outline" onClick={() => act("RESOLVE")} disabled={Boolean(pendingAction)}>Resolve</Button>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Media evidence</h3>
            {media.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed p-4 text-sm text-slate-500">No media is attached to this report.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {media.map((item: any) =>
                  item.type === "video" ? (
                    <video key={item.id} controls className="w-full rounded-lg border" src={item.url} />
                  ) : (
                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
                      <img src={item.thumbnail_url || item.url} alt={`Evidence for report ${report.id}`} className="w-full rounded-lg border object-cover" />
                    </a>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
