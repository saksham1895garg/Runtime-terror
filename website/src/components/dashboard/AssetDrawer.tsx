import { Asset, GridCell, OfficerFlag } from "@/src/types";
import { Badge } from "@/src/components/ui/badge";
import { ContributionChart } from "./ContributionChart";
import { X } from "lucide-react";

interface AssetDrawerProps {
  asset: Asset;
  riskCell?: GridCell;
  onClose: () => void;
}

export function AssetDrawer({ asset, riskCell, onClose }: AssetDrawerProps) {
  return (
    <div className="w-80 border-l bg-white flex flex-col h-full shadow-xl">
      <div className="p-4 border-b flex justify-between items-start bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{asset.name}</h2>
          <span className="text-xs font-medium text-slate-500 uppercase">{asset.type}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-5 border-b">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Estimated Risk</div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-bold text-slate-900 leading-none">{asset.riskScore}</div>
            <div className="text-sm font-medium text-slate-400 pb-1">/ 100</div>
          </div>
          <Badge className="mt-3" variant={
            asset.riskScore >= 90 ? "risk_very_high" : 
            asset.riskScore >= 80 ? "risk_high" : 
            asset.riskScore >= 60 ? "risk_moderate" : 
            asset.riskScore >= 40 ? "risk_low" : "risk_very_low"
          }>
            {asset.riskScore >= 80 ? "HIGH RISK" : asset.riskScore >= 60 ? "MODERATE RISK" : "LOW RISK"}
          </Badge>
        </div>

        <div className="p-5 border-b">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Recommended Attention</div>
          <Badge variant={asset.priority === 'PRIORITY_INSPECTION' ? 'destructive' : 'warning'}>
            {asset.priority.replace('_', ' ')}
          </Badge>
        </div>

        {riskCell && riskCell.explanation && (
          <div className="p-5 border-b">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Why was this flagged?</div>
            <ContributionChart explanation={riskCell.explanation} />
            <div className="mt-4 pt-3 border-t text-[10px] text-slate-400 uppercase tracking-wide">Model Contributions</div>
          </div>
        )}

        <div className="p-5 border-b">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Data Quality</div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Confidence</span>
            <span className="font-medium text-slate-900">{riskCell?.confidence || "MODERATE"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
