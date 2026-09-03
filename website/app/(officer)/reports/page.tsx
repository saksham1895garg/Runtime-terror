"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Eye, FileText } from "lucide-react";

import { ReportDetailDrawer } from "@/src/components/dashboard/ReportDetailDrawer";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/data-table";
import { SectionError } from "@/src/components/ui/section-error";
import { StatusPill, StatusType } from "@/src/components/ui/status-pill";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/officer/reports", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to load reports");
      const loadedReports = Array.isArray(body.reports) ? body.reports : [];
      setReports(loadedReports);

      const requestedReport = new URLSearchParams(window.location.search).get("report");
      if (requestedReport) {
        const localReport = loadedReports.find((report: any) => report.id === requestedReport);
        if (localReport) setSelectedReport(localReport);
        else {
          const detailResponse = await fetch(`/api/officer/reports/${encodeURIComponent(requestedReport)}`, { cache: "no-store" });
          const detailBody = await detailResponse.json();
          if (detailResponse.ok) setSelectedReport(detailBody.report);
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const closeDetail = () => {
    setSelectedReport(null);
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  };

  const openDetail = (report: any) => {
    setSelectedReport(report);
    window.history.pushState(null, "", `/reports?report=${encodeURIComponent(report.id)}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Public Field Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Manage and verify risk reports submitted by citizens and field officers.</p>
      </div>

      {!error && (
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm"><div className="mb-1 text-sm font-medium text-slate-500">All reports</div><div className="text-3xl font-bold text-slate-900">{reports.length}</div></div>
          <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm"><div className="mb-1 text-sm font-medium text-slate-500">Needs verification</div><div className="text-3xl font-bold text-orange-600">{reports.filter((report) => ["NEW", "UNDER_REVIEW"].includes(report.status)).length}</div></div>
          <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm"><div className="mb-1 text-sm font-medium text-slate-500">Resolved</div><div className="text-3xl font-bold text-green-600">{reports.filter((report) => report.status === "RESOLVED").length}</div></div>
        </div>
      )}

      {error ? (
        <SectionError title="Public reports unavailable" message={error} onRetry={fetchReports} />
      ) : (
        <DataTable>
          <TableHeader><TableRow><TableHead>Report ID</TableHead><TableHead>Category</TableHead><TableHead>Severity</TableHead><TableHead>Reporter</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-slate-500">Loading reports...</TableCell></TableRow>
            ) : reports.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-slate-500"><div className="flex flex-col items-center"><FileText className="mb-3 h-10 w-10 text-slate-300" /><p>No reports are recorded in the database.</p></div></TableCell></TableRow>
            ) : (
              reports.map((report) => {
                const lat = Number(report.lat);
                const lon = Number(report.lon);
                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.id}</TableCell>
                    <TableCell><span className="text-sm font-medium capitalize text-slate-700">{String(report.category).replaceAll("_", " ").toLowerCase()}</span></TableCell>
                    <TableCell><Badge variant={report.severity === "HIGH" ? "destructive" : report.severity === "MODERATE" ? "warning" : "secondary"}>{report.severity}</Badge></TableCell>
                    <TableCell className="text-slate-600">{report.anonymous ? "Anonymous" : report.users?.name || report.users?.email || "Unknown"}</TableCell>
                    <TableCell><div className="font-mono text-xs text-slate-500">{Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : "Not recorded"}</div>{report.nearest_village && <div className="text-xs text-slate-700">{report.nearest_village}</div>}</TableCell>
                    <TableCell><StatusPill status={report.status as StatusType} /></TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openDetail(report)}><Eye className="mr-1.5 h-4 w-4" /> View</Button></TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </DataTable>
      )}

      {selectedReport && <ReportDetailDrawer report={selectedReport} onClose={closeDetail} />}
    </div>
  );
}
