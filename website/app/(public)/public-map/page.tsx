"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SectionError } from "@/src/components/ui/section-error";
import { SectionLoading } from "@/src/components/ui/section-loading";

const MapView = dynamic(() => import("@/src/components/map/MapView"), { ssr: false });

export default function PublicMapPage() {
  const [riskGrid, setRiskGrid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskGrid = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/public/risk", { cache: "no-store" });
      const grid = await response.json();
      if (!response.ok || grid?.type !== "FeatureCollection" || !Array.isArray(grid.features)) {
        throw new Error(grid?.error || "Public risk map response is invalid");
      }
        setRiskGrid(grid);
    } catch (loadError) {
      setRiskGrid(null);
      setError(loadError instanceof Error ? loadError.message : "Public risk map is unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskGrid();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden bg-slate-900">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 pointer-events-auto">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium tracking-wide">Live Susceptibility Map</span>
        </div>
      </div>
      
      {loading ? (
        <SectionLoading text="Loading public risk map..." className="bg-slate-100" />
      ) : error ? (
        <SectionError title="Public map unavailable" message={error} onRetry={fetchRiskGrid} />
      ) : (
        <MapView riskData={riskGrid} />
      )}
    </div>
  );
}
