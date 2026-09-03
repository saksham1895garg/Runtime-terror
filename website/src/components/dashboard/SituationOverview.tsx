"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ShieldAlert, Map, Navigation, Activity, FileWarning, SearchX } from "lucide-react";
import Link from "next/link";

interface SituationOverviewProps {
  reports: any[];
  flags: any[];
  advisories?: any[];
  counts?: Record<string, number>;
  riskGrid?: any;
  villages?: any[];
  roads?: any[];
}

export function SituationOverview({ reports, flags, advisories = [], counts = {}, riskGrid, villages = [], roads = [] }: SituationOverviewProps) {
  const openReportsCount = counts.reports ?? reports.filter(r => r.status !== 'RESOLVED').length;
  const openFlagsCount = counts.flags ?? flags.filter(f => f.status !== 'RESOLVED').length;
  const highRiskCellCount = Array.isArray(riskGrid?.features)
    ? riskGrid.features.filter((feature: any) => ["HIGH", "VERY_HIGH"].includes(feature.properties?.riskCategory)).length
    : 0;
  const latestGeneratedAt = Array.isArray(riskGrid?.features)
    ? riskGrid.features
        .map((feature: any) => feature.properties?.generatedAt)
        .filter(Boolean)
        .sort()
        .at(-1)
    : null;
  const priorityVillages = villages.filter((asset) => asset.priority !== "ROUTINE").length;
  const priorityRoads = roads.filter((asset) => asset.priority !== "ROUTINE").length;
  const latestAdvisory = advisories[0];

  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-6 md:pb-0 md:mb-4 hide-scrollbar">
      <Card className="bg-red-50 border-red-200 min-w-[200px] shrink-0 snap-center md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-[11px] font-bold text-red-900 uppercase">Regional Warning</CardTitle>
          <ShieldAlert className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-black text-red-700 tracking-tight">{latestAdvisory?.severity ?? "N/A"}</div>
          <p className="text-[10px] text-red-600/80 mt-1 uppercase font-semibold">
            {latestAdvisory?.title ?? "No active public warning"}
          </p>
        </CardContent>
      </Card>
      
      <Card className="min-w-[200px] shrink-0 snap-center md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-[11px] font-bold text-slate-500 uppercase">High-Risk Cells</CardTitle>
          <Map className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-black text-orange-600 tracking-tight">{highRiskCellCount}</div>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{latestGeneratedAt ? new Date(latestGeneratedAt).toLocaleString() : "No prediction timestamp"}</p>
        </CardContent>
      </Card>

      <Card className="min-w-[200px] shrink-0 snap-center md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-[11px] font-bold text-slate-500 uppercase">Priority Villages</CardTitle>
          <Navigation className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-black text-slate-700 tracking-tight">{priorityVillages}</div>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Require attention</p>
        </CardContent>
      </Card>

      <Card className="min-w-[200px] shrink-0 snap-center md:min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-[11px] font-bold text-slate-500 uppercase">Priority Roads</CardTitle>
          <Activity className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-black text-slate-700 tracking-tight">{priorityRoads}</div>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Segments flagged</p>
        </CardContent>
      </Card>

      <Link href="/reports" className="block min-w-[200px] shrink-0 snap-center md:min-w-0 group focus:outline-none">
        <Card className={`h-full transition-colors ${openReportsCount > 0 ? "border-blue-200 bg-blue-50/50 group-hover:border-blue-300 group-hover:bg-blue-100/50 group-focus:border-blue-400 group-focus:ring-2 group-focus:ring-blue-200" : "group-hover:border-slate-300"}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase">New Field Reports</CardTitle>
            <FileWarning className={`h-4 w-4 ${openReportsCount > 0 ? "text-blue-500" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-2xl font-black tracking-tight ${openReportsCount > 0 ? "text-blue-600" : "text-slate-400"}`}>
              {openReportsCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Unresolved</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/flags" className="block min-w-[200px] shrink-0 snap-center md:min-w-0 group focus:outline-none">
        <Card className={`h-full transition-colors ${openFlagsCount > 0 ? "border-amber-200 bg-amber-50 group-hover:border-amber-300 group-hover:bg-amber-100/50 group-focus:border-amber-400 group-focus:ring-2 group-focus:ring-amber-200" : "group-hover:border-slate-300"}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase">Model Conflicts</CardTitle>
            <SearchX className={`h-4 w-4 ${openFlagsCount > 0 ? "text-amber-500" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-2xl font-black tracking-tight ${openFlagsCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
              {openFlagsCount}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Requires Verification</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
