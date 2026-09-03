"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Flag as FlagIcon } from "lucide-react";

import { FlagReviewDrawer } from "@/src/components/dashboard/FlagReviewDrawer";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/data-table";
import { SectionError } from "@/src/components/ui/section-error";
import { StatusPill, StatusType } from "@/src/components/ui/status-pill";

export default function FlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/officer/flags", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to load flags");
      setFlags(Array.isArray(body.flags) ? body.flags : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    const requestedFlag = new URLSearchParams(window.location.search).get("flag");
    if (requestedFlag) setSelectedFlagId(requestedFlag);
  }, [fetchFlags]);

  const closeReview = () => {
    setSelectedFlagId(null);
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  };

  const openReview = (flagId: string) => {
    setSelectedFlagId(flagId);
    window.history.pushState(null, "", `/flags?flag=${encodeURIComponent(flagId)}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Decision Flags</h1>
        <p className="mt-1 text-sm text-slate-500">Review model-field discrepancies and high-risk asset escalations requiring human intervention.</p>
      </div>

      {error ? (
        <SectionError title="Decision flags unavailable" message={error} onRetry={fetchFlags} />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Flag ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Model Estimate</TableHead>
              <TableHead>Field Evidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-slate-500">Loading flags...</TableCell></TableRow>
            ) : flags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
                    <p className="font-medium text-slate-900">No decision flags</p>
                    <p className="text-sm">The database currently contains no flags for officer review.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              flags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell className="font-medium text-slate-900"><div className="flex items-center gap-2"><FlagIcon className="h-4 w-4 text-orange-500" />{flag.id}</div></TableCell>
                  <TableCell><Badge variant={flag.type === "DISCREPANCY" ? "destructive" : "warning"}>{String(flag.type).replaceAll("_", " ")}</Badge></TableCell>
                  <TableCell className="max-w-[300px]"><p className="truncate text-sm font-medium text-slate-900">{flag.title}</p><p className="truncate text-xs text-slate-500">{flag.description}</p></TableCell>
                  <TableCell>{flag.model_estimate == null ? "-" : <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{(Number(flag.model_estimate) * 100).toFixed(0)}%</span>}</TableCell>
                  <TableCell>{flag.field_severity ? <Badge variant={flag.field_severity === "HIGH" ? "destructive" : "secondary"}>{flag.field_severity}</Badge> : "-"}</TableCell>
                  <TableCell><StatusPill status={flag.status as StatusType} /></TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-500">{formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right"><Button variant="default" size="sm" onClick={() => openReview(flag.id)}>Review</Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      )}

      {selectedFlagId && (
        <FlagReviewDrawer
          flagId={selectedFlagId}
          onClose={closeReview}
          onUpdated={(updated) => setFlags((current) => current.map((flag) => flag.id === updated.id ? updated : flag))}
        />
      )}
    </div>
  );
}
