"use client";

import { useState, useEffect } from "react";
import { GridCell } from "@/src/types";
import { Badge } from "@/src/components/ui/badge";
import { ContributionChart } from "./ContributionChart";
import { X, CloudRain, Mountain, Wind, MapPin, ExternalLink, Globe, AlertCircle, RefreshCcw } from "lucide-react";
import { getGeometryCentroid } from "@/src/lib/geo";

interface GridDetailDrawerProps {
  cell: GridCell;
  onClose: () => void;
}

export function GridDetailDrawer({ cell, onClose }: GridDetailDrawerProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchVisibility = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/officer/grids/${cell.gridCode || cell.id}/release`);
      if (!res.ok) throw new Error("Failed to fetch visibility status");
      const data = await res.json();
      setIsPublic(data.is_public);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisibility();
  }, [cell.gridCode, cell.id]);

  const toggleVisibility = async () => {
    setToggling(true);
    setError(null);
    try {
      const res = await fetch(`/api/officer/grids/${cell.gridCode || cell.id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !isPublic })
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      const data = await res.json();
      setIsPublic(data.is_public);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  };

  const centroid = getGeometryCentroid(cell.geometry) ?? (
    Number.isFinite(cell.latitude) && Number.isFinite(cell.longitude)
      ? { lat: Number(cell.latitude), lon: Number(cell.longitude) }
      : null
  );
  return (
    <div className="w-80 border-l bg-white flex flex-col h-full shadow-xl overflow-hidden relative">
      <div className="p-4 border-b flex justify-between items-start bg-slate-50 sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">GRID: {cell.gridCode || cell.id}</h2>
          <span className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            Analysis Cell
          </span>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>

    {centroid && (
      <div className="px-4 py-2 bg-slate-100 border-b flex justify-between items-center text-xs">
        <div className="font-mono text-slate-600 font-medium">
          {centroid.lat.toFixed(5)}, {centroid.lon.toFixed(5)}
        </div>
        <a 
          href={`https://www.google.com/maps/place/${centroid.lat},${centroid.lon}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
        >
          Open in Google Maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )}

      <div className="px-4 py-3 border-b bg-white text-xs text-slate-600 space-y-1">
        <p><span className="font-semibold text-slate-800">Grid code:</span> {cell.gridCode || cell.id}</p>
        <p><span className="font-semibold text-slate-800">Area:</span> {cell.district || "No place name recorded"}</p>
        {cell.nearbyVillages?.[0] && <p><span className="font-semibold text-slate-800">Nearest village:</span> {cell.nearbyVillages[0]}</p>}
        {cell.nearbyRoads?.[0] && <p><span className="font-semibold text-slate-800">Nearest road:</span> {cell.nearbyRoads[0]}</p>}
      </div>

      <div className="px-4 py-4 border-b bg-slate-50">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-slate-500" />
            PUBLIC VISIBILITY
          </div>
          {loading ? (
            <span className="text-[10px] text-slate-400">Loading...</span>
          ) : error ? (
            <button onClick={fetchVisibility} className="text-[10px] text-red-500 hover:underline flex items-center gap-1">
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          ) : (
            <Badge variant={isPublic ? "default" : "outline"} className={isPublic ? "bg-green-600 hover:bg-green-700" : ""}>
              {isPublic ? "ON" : "OFF"}
            </Badge>
          )}
        </div>
        
        <p className="text-[10px] text-slate-500 mb-3">
          {isPublic ? "This grid is currently visible on the public map." : "Not visible to public."}
        </p>

        {!loading && (
          <button 
            onClick={toggleVisibility}
            disabled={toggling}
            className={`w-full py-2 px-3 rounded text-xs font-semibold transition-colors disabled:opacity-50 ${
              isPublic 
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {toggling ? "Processing..." : isPublic ? "Revoke Public Visibility" : "Publish to Public Map"}
          </button>
        )}
        {error && <div className="mt-2 text-[10px] text-red-500 flex items-start gap-1"><AlertCircle className="h-3 w-3 shrink-0 mt-0.5" /> {error}</div>}
      </div>

      <div className="flex-1 overflow-auto pb-6">
        <div className="p-5 border-b bg-gradient-to-b from-slate-50 to-white">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Estimated Risk</div>
          <div className="flex items-end gap-3">
            <div className="text-5xl font-bold text-slate-900 tracking-tighter leading-none">{cell.riskScore ?? "—"}</div>
            <div className="text-sm font-medium text-slate-400 pb-1">/ 100</div>
          </div>
          <div className="flex gap-2 mt-4 items-center">
            <Badge variant={
              cell.riskCategory === 'UNASSESSED' ? "outline" :
              cell.riskCategory === 'VERY_HIGH' ? "risk_very_high" : 
              cell.riskCategory === 'HIGH' ? "risk_high" : 
              cell.riskCategory === 'MODERATE' ? "risk_moderate" : 
              cell.riskCategory === 'LOW' ? "risk_low" : "risk_very_low"
            } className="px-3 py-1 text-[11px] uppercase tracking-wider">
              {cell.riskCategory.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-slate-500">Model Estimate: {cell.modelEstimate == null ? "Unavailable" : `${(cell.modelEstimate * 100).toFixed(1)}%`}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 pt-3 border-t">
            Updated: {cell.generatedAt ? new Date(cell.generatedAt).toLocaleString() : "No prediction timestamp"}
          </div>
        </div>

        <div className="p-5 border-b">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4 flex items-center gap-1.5">
            <CloudRain className="h-4 w-4 text-blue-500" />
            Environmental
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2 rounded border text-center">
              <div className="text-xs text-slate-500 mb-1">24h</div>
              <div className="font-semibold text-slate-800">{cell.rainfall24h} <span className="text-[10px] font-normal text-slate-400">mm</span></div>
            </div>
            <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center">
              <div className="text-xs text-blue-600/70 mb-1">72h</div>
              <div className="font-semibold text-blue-900">{cell.rainfall72h} <span className="text-[10px] font-normal text-blue-600/50">mm</span></div>
            </div>
            <div className="bg-slate-50 p-2 rounded border text-center">
              <div className="text-xs text-slate-500 mb-1">7d</div>
              <div className="font-semibold text-slate-800">{cell.rainfall7d} <span className="text-[10px] font-normal text-slate-400">mm</span></div>
            </div>
          </div>
        </div>

        <div className="p-5 border-b">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4 flex items-center gap-1.5">
            <Mountain className="h-4 w-4 text-emerald-600" />
            Terrain & Static
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Elevation</span>
              <span className="font-medium text-slate-800">{cell.elevation} m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Slope</span>
              <span className="font-medium text-slate-800">{cell.slope}°</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Aspect</span>
              <span className="font-medium text-slate-800">{cell.aspect}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Land Cover</span>
              <span className="font-medium text-slate-800">{cell.landCover}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-slate-500">Susceptibility</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold">{cell.susceptibility}</Badge>
            </div>
          </div>
        </div>

        {Array.isArray(cell.explanation) && cell.explanation.length > 0 && (
          <div className="p-5 border-b">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Why was this flagged?</div>
            <ContributionChart explanation={cell.explanation} />
          </div>
        )}

        <div className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Nearby Assets</div>
          {cell.nearbyVillages && cell.nearbyVillages.length > 0 ? (
            <div className="mb-3">
              <span className="text-xs text-slate-400 block mb-1">Villages:</span>
              <div className="flex flex-wrap gap-1">
                {cell.nearbyVillages.map(v => (
                  <Badge key={v} variant="secondary" className="font-normal">{v}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {cell.nearbyRoads && cell.nearbyRoads.length > 0 ? (
            <div>
              <span className="text-xs text-slate-400 block mb-1">Roads:</span>
              <div className="flex flex-wrap gap-1">
                {cell.nearbyRoads.map(r => (
                  <Badge key={r} variant="outline" className="font-normal bg-slate-50 text-slate-600">{r}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
