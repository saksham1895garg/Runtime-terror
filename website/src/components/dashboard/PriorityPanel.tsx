import { Asset } from "@/src/types";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { MapPinned } from "lucide-react";

interface PriorityPanelProps {
  villages: Asset[];
  roads: Asset[];
  onSelect: (asset: Asset) => void;
}

export function PriorityPanel({ villages = [], roads = [], onSelect }: PriorityPanelProps) {
  const topAssets = [...(villages ?? []), ...(roads ?? [])]
    .filter((asset) => asset.priority !== "ROUTINE")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  return (
    <div className="w-full bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">Top Priorities ({topAssets.length})</h2>
        <p className="mt-1 text-[11px] text-slate-500">Villages and roads whose priority is not ROUTINE.</p>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {topAssets.length === 0 && (
          <EmptyState
            icon={MapPinned}
            title="No priority assets identified"
            message="The villages and road_segments tables contain no assets currently marked above ROUTINE priority."
          />
        )}
        {topAssets.map((asset, i) => (
          <button
            type="button"
            key={asset.id} 
            className="w-full p-3 border rounded-md text-left hover:bg-slate-50 transition-colors"
            onClick={() => onSelect(asset)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold text-slate-400 w-5">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900">{asset.name}</h4>
                <div className="text-xs text-slate-500 mt-0.5">
                  {asset.type}
                  {asset.district ? ` · ${asset.district}` : ""}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  {Number.isFinite(Number(asset.lat)) && Number.isFinite(Number(asset.lng))
                    ? `${Number(asset.lat).toFixed(5)}, ${Number(asset.lng).toFixed(5)}`
                    : "Location geometry unavailable"}
                </div>
              </div>
            </div>
            <div className="pl-5 mt-2 flex items-center justify-between">
              <Badge variant={
                asset.riskScore >= 90 ? "risk_very_high" : 
                asset.riskScore >= 80 ? "risk_high" : 
                asset.riskScore >= 60 ? "risk_moderate" : 
                asset.riskScore >= 40 ? "risk_low" : "risk_very_low"
              }>
                {asset.riskScore} / 100
              </Badge>
              <span className="text-xs font-semibold text-slate-600">
                {asset.priority.replaceAll('_', ' ')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
