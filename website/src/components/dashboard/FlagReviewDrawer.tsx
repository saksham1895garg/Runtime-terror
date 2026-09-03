"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, MapPin, X } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { SectionError } from "@/src/components/ui/section-error";
import { SectionLoading } from "@/src/components/ui/section-loading";

export function FlagReviewDrawer({
  flagId,
  onClose,
  onUpdated,
}: {
  flagId: string;
  onClose: () => void;
  onUpdated: (flag: any) => void;
}) {
  const [detail, setDetail] = useState<{ flag: any; report: any | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setDetail(null);
    try {
      const response = await fetch(`/api/officer/flags/${encodeURIComponent(flagId)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to load flag detail");
      setDetail(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load flag detail");
    }
  }, [flagId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: "REVIEW" | "RESOLVE" | "DISMISS") => {
    setPendingAction(action);
    setActionError(null);
    try {
      const response = await fetch(`/api/officer/flags/${encodeURIComponent(flagId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Flag action failed");
      setDetail(body);
      onUpdated(body.flag);
    } catch (mutationError) {
      setActionError(mutationError instanceof Error ? mutationError.message : "Flag action failed");
    } finally {
      setPendingAction(null);
    }
  };

  const report = detail?.report;
  const lat = Number(report?.lat);
  const lon = Number(report?.lon);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lon);
  const isClosed = ["RESOLVED", "DISMISSED"].includes(detail?.flag?.status);

  return (
    <div className="fixed inset-0 z-[700] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="flag-review-title">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close flag review" />
      <section className="relative h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Decision flag review</p>
            <h2 id="flag-review-title" className="mt-1 text-xl font-bold text-slate-900">{flagId}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close flag review">
            <X className="h-5 w-5" />
          </button>
        </header>

        {!detail && !error && <SectionLoading text="Loading flag and linked evidence..." />}
        {error && <SectionError title="Flag detail unavailable" message={error} onRetry={load} />}

        {detail && (
          <div className="space-y-6 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant={detail.flag.type === "DISCREPANCY" ? "destructive" : "warning"}>{detail.flag.type.replaceAll("_", " ")}</Badge>
              <Badge variant="outline">{detail.flag.status.replaceAll("_", " ")}</Badge>
            </div>

            <div>
              <h3 className="flex items-center gap-2 font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-500" /> {detail.flag.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{detail.flag.description}</p>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Grid reference</dt><dd className="mt-1 font-mono">{detail.flag.grid_id || "Not recorded"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Created</dt><dd className="mt-1">{new Date(detail.flag.created_at).toLocaleString()}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Model estimate</dt><dd className="mt-1">{detail.flag.model_estimate == null ? "Not recorded" : `${(Number(detail.flag.model_estimate) * 100).toFixed(0)}%`}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-500">Field severity</dt><dd className="mt-1">{detail.flag.field_severity || "Not recorded"}</dd></div>
            </dl>

            {detail.flag.recommended_action && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <span className="font-semibold">Recorded recommendation:</span> {detail.flag.recommended_action}
              </div>
            )}

            {report ? (
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-semibold text-slate-900">Linked report {report.id}</p>
                <p className="mt-2 text-slate-600">{report.description}</p>
                <p className="mt-3 text-xs text-slate-500">{report.category.replaceAll("_", " ")} · {report.severity} · {report.status.replaceAll("_", " ")}</p>
                {hasCoordinates && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
                    <MapPin className="h-4 w-4" /> Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">This flag has no linked public report.</p>
            )}

            {actionError && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}

            <div className="border-t pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Audited actions</p>
              
              {detail.flag.officer_actions && detail.flag.officer_actions.length > 0 ? (
                <ul className="mb-4 space-y-2">
                  {detail.flag.officer_actions.map((action: any) => (
                    <li key={action.id} className="text-sm text-slate-600 rounded bg-slate-50 p-2">
                      <span className="font-semibold text-slate-900">{action.action}</span> by officer <span className="font-mono">{action.officer_id.slice(0,8)}</span> on {new Date(action.created_at).toLocaleString()}
                      {action.notes && <p className="mt-1 text-xs text-slate-500">Notes: {action.notes}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 text-sm text-slate-500 italic">No previous actions recorded.</p>
              )}

              {isClosed ? (
                <p className="text-sm text-slate-500">This flag is closed. Its recorded status is {detail.flag.status.replaceAll("_", " ")}.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.flag.status === "NEW" && <Button onClick={() => act("REVIEW")} disabled={Boolean(pendingAction)}>{pendingAction === "REVIEW" ? "Recording..." : "Mark under review"}</Button>}
                  <Button variant="outline" onClick={() => act("RESOLVE")} disabled={Boolean(pendingAction)}>{pendingAction === "RESOLVE" ? "Recording..." : "Resolve"}</Button>
                  <Button variant="outline" onClick={() => act("DISMISS")} disabled={Boolean(pendingAction)}>{pendingAction === "DISMISS" ? "Recording..." : "Dismiss"}</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
