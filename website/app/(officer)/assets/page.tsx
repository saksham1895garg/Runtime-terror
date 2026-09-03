"use client";

import { useState, useEffect } from "react";
import { DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/data-table";
import { Badge } from "@/src/components/ui/badge";
import { Navigation, Activity, Search, Home, TrendingUp } from "lucide-react";
import { Asset } from "@/src/types";

export default function PriorityAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/risk/villages").then(r => r.json()),
      fetch("/api/risk/roads").then(r => r.json()),
    ]).then(([v, r]) => {
      const combined = [...v, ...r].sort((a, b) => b.riskScore - a.riskScore);
      setAssets(combined);
      setLoading(false);
    });
  }, []);

  const filteredAssets = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Priority Assets</h1>
          <p className="text-sm text-slate-500 mt-1">Infrastructure and settlements ranked by real-time landslide risk exposure.</p>
        </div>
      </div>

      <div className="flex items-center bg-white border rounded-lg px-3 py-2 w-full max-w-md shadow-sm">
        <Search className="h-4 w-4 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search by name..." 
          className="bg-transparent border-none outline-none text-sm w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Priority Level</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Last Assessed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                Loading assets...
              </TableCell>
            </TableRow>
          ) : filteredAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                No assets match your search.
              </TableCell>
            </TableRow>
          ) : (
            filteredAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    {asset.type === 'VILLAGE' ? <Home className="h-4 w-4 text-blue-500" /> : <TrendingUp className="h-4 w-4 text-slate-500" />}
                    {asset.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-slate-700 uppercase bg-slate-100 px-2 py-1 rounded">
                    {asset.type}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    asset.riskScore >= 90 ? "risk_very_high" : 
                    asset.riskScore >= 80 ? "risk_high" : 
                    asset.riskScore >= 60 ? "risk_moderate" : 
                    asset.riskScore >= 40 ? "risk_low" : "risk_very_low"
                  }>
                    {asset.riskScore} / 100
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-semibold text-slate-700">
                    {asset.priority.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {asset.type === 'VILLAGE' ? `Pop: ${(asset as any).population ?? '—'}` : `Status: ${(asset as any).status ?? '—'}`}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {(asset as any).lastAssessed ? new Date((asset as any).lastAssessed).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </div>
  );
}
