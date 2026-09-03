"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SituationOverview } from "@/src/components/dashboard/SituationOverview";
import { PriorityPanel } from "@/src/components/dashboard/PriorityPanel";
import { AssetDrawer } from "@/src/components/dashboard/AssetDrawer";
import { GridDetailDrawer } from "@/src/components/dashboard/GridDetailDrawer";
import { DiscrepancyPanel } from "@/src/components/dashboard/DiscrepancyPanel";
import { Asset, GridCell } from "@/src/types";
import { SectionLoading } from "@/src/components/ui/section-loading";
import { SectionError } from "@/src/components/ui/section-error";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

const MapView = dynamic(() => import("@/src/components/map/MapView"), { 
  ssr: false,
  loading: () => <SectionLoading text="Loading Map Engine..." className="bg-slate-100" />
});

export default function DashboardPage() {
  const [mapState, setMapState] = useState<{ loading: boolean; error: string | null; grid: any }>({
    loading: true, error: null, grid: null
  });
  const [assetsState, setAssetsState] = useState<{ loading: boolean; error: string | null; villages: Asset[]; roads: Asset[] }>({
    loading: true, error: null, villages: [], roads: []
  });
  
  const [officerState, setOfficerState] = useState<{ loading: boolean; error: string | null; reports: any[]; flags: any[]; advisories: any[]; counts: any }>({
    loading: true, error: null, reports: [], flags: [], advisories: [], counts: {}
  });

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedGridCell, setSelectedGridCell] = useState<GridCell | null>(null);

  const fetchMapData = async () => {
    setMapState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const gridRes = await fetch("/api/risk/grid", { cache: "no-store" });
      const grid = await gridRes.json();
      if (!gridRes.ok || grid?.type !== "FeatureCollection" || !Array.isArray(grid.features)) {
        throw new Error(grid?.error || "Risk grid response is invalid");
      }
      setMapState({ loading: false, error: null, grid });
    } catch (e) {
      setMapState({ loading: false, error: e instanceof Error ? e.message : "Failed to load geographic risk data", grid: null });
    }
  };

  const fetchAssets = async () => {
    setAssetsState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [villagesRes, roadsRes] = await Promise.all([
        fetch("/api/risk/villages", { cache: "no-store" }),
        fetch("/api/risk/roads", { cache: "no-store" })
      ]);
      const v = await villagesRes.json();
      const r = await roadsRes.json();
      if (!villagesRes.ok || !Array.isArray(v)) throw new Error(v?.error || "Village response is invalid");
      if (!roadsRes.ok || !Array.isArray(r)) throw new Error(r?.error || "Road response is invalid");
      setAssetsState({ loading: false, error: null, villages: v, roads: r });
    } catch (e) {
      setAssetsState({ loading: false, error: e instanceof Error ? e.message : "Failed to load priority assets", villages: [], roads: [] });
    }
  };

  const fetchOfficerData = async () => {
    setOfficerState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const officerRes = await fetch("/api/officer");
      if (!officerRes.ok) {
         if (officerRes.status === 401 || officerRes.status === 403) {
           window.location.href = '/login?error=Unauthorized';
           return;
         }
         throw new Error("Failed to fetch");
      }
      const data = await officerRes.json();
      setOfficerState({ loading: false, error: null, reports: data.reports || [], flags: data.flags || [], advisories: data.advisories || [], counts: data.counts || {} });
    } catch (e) {
      setOfficerState(prev => ({ ...prev, loading: false, error: e instanceof Error ? e.message : "Failed to fetch officer data" }));
    }
  };

  useEffect(() => {
    fetchMapData();
    fetchAssets();
    fetchOfficerData();
  }, []);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedGridCell(null);
    setSelectedAsset(asset);
  };

  const handleSelectCell = (cell: GridCell) => {
    setSelectedAsset(null);
    setSelectedGridCell(cell);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Top Overview Ribbon */}
      <div className="shrink-0 bg-white border-b border-slate-200">
        {officerState.loading ? (
          <div className="h-16 flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Loading situation overview...
          </div>
        ) : officerState.error ? (
          <div className="h-16 flex items-center justify-center text-xs text-red-500 bg-red-50">
            Failed to load situation overview
          </div>
        ) : (
          <SituationOverview
            reports={officerState.reports}
            flags={officerState.flags}
            advisories={officerState.advisories}
            counts={officerState.counts}
            riskGrid={mapState.grid}
            villages={assetsState.villages}
            roads={assetsState.roads}
          />
        )}
      </div>
      
      {/* Main Content Area: Split Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
        
        {/* Left Side: Map */}
        <div className="flex-1 relative flex flex-col bg-white border-r border-slate-200 lg:border-none shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
          <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Risk Map</h2>
            <div className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">500m Grid</div>
          </div>
          
          <div className="flex-1 relative">
            {mapState.loading ? (
              <SectionLoading text="Initializing GIS Engine..." className="bg-slate-100" />
            ) : mapState.error ? (
              <SectionError title="Map Data Unavailable" message={mapState.error} onRetry={fetchMapData} />
            ) : (
              <MapView 
                riskData={mapState.grid} 
                villages={assetsState.villages} 
                roads={assetsState.roads} 
                onSelectCell={handleSelectCell}
              />
            )}
          </div>
        </div>
        
        {/* Right Side: Tabbed Action Panels */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 flex flex-col bg-white border-l border-slate-200 z-20">
          <Tabs defaultValue="priority" className="flex flex-col h-full w-full">
            <TabsList className="w-full flex shrink-0 rounded-none border-b border-slate-200 bg-slate-50 p-0 h-auto">
              <TabsTrigger value="priority" className="flex-1 rounded-none py-3 text-xs font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none">
                Priority Assets
              </TabsTrigger>
              <TabsTrigger value="flags" className="flex-1 rounded-none py-3 text-xs font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none">
                Action Flags
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="priority" className="m-0 h-full p-4 focus-visible:outline-none">
                {assetsState.loading ? (
                  <SectionLoading text="Loading assets..." />
                ) : assetsState.error ? (
                  <SectionError title="Cannot Load Assets" message={assetsState.error} onRetry={fetchAssets} />
                ) : (
                  <PriorityPanel villages={assetsState.villages} roads={assetsState.roads} onSelect={handleSelectAsset} />
                )}
              </TabsContent>
              
              <TabsContent value="flags" className="m-0 h-full p-4 focus-visible:outline-none">
                {officerState.loading ? (
                  <SectionLoading text="Loading flags..." />
                ) : officerState.error ? (
                  <SectionError title="Cannot Load Flags" message={officerState.error} onRetry={fetchOfficerData} />
                ) : (
                  <DiscrepancyPanel flags={officerState.flags} reports={officerState.reports} />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Modals / Drawers for details */}
      {selectedAsset && (
        <div className="absolute top-0 right-0 h-full w-full md:w-[500px] bg-white z-[500] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-slate-200 animate-slide-up">
          <AssetDrawer 
            asset={selectedAsset} 
            riskCell={
              mapState.grid?.features.find((f: any) => 
                f.properties.riskScore >= selectedAsset.riskScore - 5
              )?.properties
            }
            onClose={() => setSelectedAsset(null)} 
          />
        </div>
      )}

      {selectedGridCell && (
        <div className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white z-[500] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-slate-200 animate-slide-up">
          <GridDetailDrawer 
            cell={selectedGridCell} 
            onClose={() => setSelectedGridCell(null)} 
          />
        </div>
      )}
    </div>
  );
}
