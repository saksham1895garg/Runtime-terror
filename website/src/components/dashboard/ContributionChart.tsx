import { GridCell, RiskExplanation } from "@/src/types";

export function ContributionChart({ explanation }: { explanation: RiskExplanation[] }) {
  return (
    <div className="space-y-3 mt-2">
      {explanation.map((exp, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-700">
            <span>{exp.direction === "UP" ? "↑" : "↓"} {exp.feature}</span>
            <span className="font-medium text-slate-500">{exp.importance}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${exp.importance === 'HIGH' ? 'bg-orange-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, exp.contribution)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
