"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Activity, ShieldAlert, Flag, CheckCircle, Search, AlertCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GridsPage() {
  const [gridCode, setGridCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Override State
  const [overrideRisk, setOverrideRisk] = useState("MODERATE");
  const [overrideScore, setOverrideScore] = useState(50);
  const [overrideReason, setOverrideReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  // Flag State
  const [flagging, setFlagging] = useState(false);

  const fetchGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gridCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/developer/grids/${gridCode}`);
      if (!res.ok) {
         if (res.status === 404) throw new Error("Grid cell not found");
         throw new Error("Failed to fetch grid data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const triggerPrediction = async () => {
    if (!gridCode) return;
    setPredicting(true);
    try {
      const res = await fetch(`/api/developer/predictions/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid_code: gridCode })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to trigger prediction");
      }
      // Refresh the grid data to show the new prediction
      await fetchGrid({ preventDefault: () => {} } as any);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPredicting(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.predictions?.[0]) return;
    setOverriding(true);
    try {
      const res = await fetch(`/api/developer/grids/${gridCode}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: data.predictions[0].run_id,
          risk_score: overrideScore,
          risk_category: overrideRisk,
          reason: overrideReason
        })
      });
      if (!res.ok) throw new Error("Override failed");
      
      // Refresh
      await fetchGrid({ preventDefault: () => {} } as any);
      setOverrideReason("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOverriding(false);
    }
  };

  const toggleFlag = async () => {
    setFlagging(true);
    const hasActiveFlag = data?.flags?.some((f: any) => f.status === 'NEW');
    try {
      const res = await fetch(`/api/developer/grids/${gridCode}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: hasActiveFlag ? "UNFLAG" : "FLAG",
          title: "Developer Anomaly Flag"
        })
      });
      if (!res.ok) throw new Error("Flag action failed");
      await fetchGrid({ preventDefault: () => {} } as any);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFlagging(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Search className="h-8 w-8 text-dev-primary" />
          Grid Inspection & Controls
        </h1>
      </div>

      <form onSubmit={fetchGrid} className="flex gap-4 max-w-xl">
        <input 
          type="text" 
          value={gridCode}
          onChange={(e) => setGridCode(e.target.value)}
          placeholder="Enter Grid Code (e.g. GNG-000026)" 
          className="flex-1 bg-dev-surface border border-dev-border rounded-md px-4 py-2 text-white focus:outline-none focus:border-dev-primary"
        />
        <button type="submit" disabled={loading} className="bg-dev-primary text-white px-6 py-2 rounded-md hover:bg-dev-accent disabled:opacity-50 transition-colors font-medium">
          {loading ? "Searching..." : "Inspect"}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-dev-critical/10 border border-dev-critical text-dev-critical">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grid Overview */}
          <Card className="bg-dev-surface border-dev-border shadow-premium">
            <CardHeader className="border-b border-dev-border/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-dev-primary" />
                Latest Prediction State
              </CardTitle>
              <button 
                onClick={triggerPrediction}
                disabled={predicting}
                className="bg-dev-primary text-white px-3 py-1.5 rounded text-sm hover:bg-dev-accent disabled:opacity-50 transition-colors"
              >
                {predicting ? "Running..." : "Trigger Run"}
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {data.predictions && data.predictions.length > 0 ? (
                <>
                  <div className="flex justify-between items-center bg-dev-bg p-4 rounded-lg border border-dev-border">
                    <span className="text-dev-text-muted">Risk Category</span>
                    <span className={`font-bold ${
                      data.predictions[0].risk_category === 'HIGH' || data.predictions[0].risk_category === 'CRITICAL' 
                        ? 'text-dev-critical' 
                        : 'text-dev-warning'
                    }`}>{data.predictions[0].risk_category}</span>
                  </div>
                  <div className="flex justify-between items-center bg-dev-bg p-4 rounded-lg border border-dev-border">
                    <span className="text-dev-text-muted">Risk Score</span>
                    <span className="text-white font-mono">{data.predictions[0].risk_score}</span>
                  </div>
                  <div className="flex justify-between items-center bg-dev-bg p-4 rounded-lg border border-dev-border">
                    <span className="text-dev-text-muted">Confidence</span>
                    <span className="text-white">{data.predictions[0].confidence || "UNKNOWN"}</span>
                  </div>
                  <div className="flex justify-between items-center bg-dev-bg p-4 rounded-lg border border-dev-border">
                    <span className="text-dev-text-muted">Model Info</span>
                    <span className="text-dev-accent text-xs">
                      {data.predictions[0].model_name || "UNKNOWN"} ({data.predictions[0].model_version || "UNKNOWN"})
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-dev-bg p-4 rounded-lg border border-dev-border">
                    <span className="text-dev-text-muted">Timestamp</span>
                    <span className="text-dev-text-muted text-xs">
                      {new Date(data.predictions[0].generated_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {data.predictions[0].input_snapshot?.is_test_data && (
                    <div className="mt-2 p-3 rounded-lg bg-blue-900/20 border border-blue-500/50">
                      <p className="text-blue-400 font-bold text-xs mb-1">TEST / SYNTHETIC DATA</p>
                      <p className="text-blue-300/80 text-xs">This prediction was generated using the TEST_PREDICTOR pipeline.</p>
                    </div>
                  )}

                  {data.predictions[0].input_snapshot?.developer_override && (
                    <div className="mt-4 p-4 rounded-lg bg-dev-warning/10 border border-dev-warning">
                      <p className="text-dev-warning font-bold text-sm mb-1 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        SOURCE: DEVELOPER_OVERRIDE
                      </p>
                      <p className="text-dev-warning text-xs">DEVELOPER OVERRIDE: YES</p>
                      <p className="text-dev-warning/80 text-xs mt-2">
                        Reason: {data.predictions[0].input_snapshot.reason}
                      </p>
                    </div>
                  )}

                  {data.predictions.length > 1 && data.predictions[0].input_snapshot?.developer_override && (
                    <div className="mt-4 p-4 rounded-lg bg-dev-bg border border-dev-border">
                      <p className="text-dev-text-muted font-bold text-xs mb-1 uppercase tracking-wider">
                        Original Model Result (Preserved)
                      </p>
                      <p className="text-white text-sm">
                        Score: {data.predictions[1].risk_score} | Category: {data.predictions[1].risk_category}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-dev-text-muted italic">No prediction history for this grid.</p>
              )}
              
              <div className="pt-4 border-t border-dev-border/50">
                <p className="text-dev-text-muted font-bold text-xs uppercase mb-2">Workflow Status</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Officer Review:</span>
                  <span className="text-sm text-dev-accent font-medium">
                    {data.assignments?.length > 0 ? data.assignments[0].assignment_status : "PENDING"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Public Release:</span>
                  <span className="text-sm text-dev-text-muted font-medium">NOT RELEASED</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="space-y-6">
            {/* Flag Control */}
            <Card className="bg-dev-surface border-dev-border shadow-premium">
              <CardHeader className="border-b border-dev-border/50 pb-4">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Flag className="h-5 w-5 text-dev-warning" />
                  System Anomaly Flag
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {data.flags?.some((f: any) => f.status === 'NEW') ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-dev-warning/10 border border-dev-warning rounded-md text-dev-warning text-sm">
                      Grid is currently flagged as an anomaly.
                    </div>
                    <button 
                      onClick={toggleFlag} disabled={flagging}
                      className="w-full bg-dev-bg border border-dev-warning text-dev-warning hover:bg-dev-warning/20 px-4 py-2 rounded-md transition-colors"
                    >
                      {flagging ? "Processing..." : "Resolve Flag"}
                    </button>
                  </div>
                ) : (
                   <div className="space-y-4">
                     <p className="text-sm text-dev-text-muted">No active flags.</p>
                     <button 
                       onClick={toggleFlag} disabled={flagging}
                       className="w-full bg-dev-warning text-dev-bg font-medium hover:bg-dev-warning/80 px-4 py-2 rounded-md transition-colors"
                     >
                       {flagging ? "Processing..." : "Flag as Anomaly"}
                     </button>
                   </div>
                )}
              </CardContent>
            </Card>

            {/* Override Control */}
            {data.predictions && data.predictions.length > 0 && (
              <Card className="bg-dev-surface border-dev-border shadow-premium">
                <CardHeader className="border-b border-dev-border/50 pb-4">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-dev-critical" />
                    Manual Override
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                   <p className="text-xs text-dev-text-muted mb-4">
                     Overrides append a new record with developer provenance. Original data is not destroyed.
                   </p>
                   <form onSubmit={handleOverride} className="space-y-4">
                     <div>
                       <label className="block text-xs text-dev-text-muted mb-1">New Category</label>
                       <select 
                         value={overrideRisk} onChange={e => setOverrideRisk(e.target.value)}
                         className="w-full bg-dev-bg border border-dev-border rounded-md px-3 py-2 text-white text-sm"
                       >
                         <option value="LOW">LOW</option>
                         <option value="MODERATE">MODERATE</option>
                         <option value="HIGH">HIGH</option>
                         <option value="CRITICAL">CRITICAL</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs text-dev-text-muted mb-1">New Score (0-100)</label>
                       <input 
                         type="number" min="0" max="100"
                         value={overrideScore} onChange={e => setOverrideScore(parseInt(e.target.value))}
                         className="w-full bg-dev-bg border border-dev-border rounded-md px-3 py-2 text-white text-sm"
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-dev-text-muted mb-1">Reason (Required)</label>
                       <input 
                         type="text" required
                         value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                         placeholder="Why is this being overridden?"
                         className="w-full bg-dev-bg border border-dev-border rounded-md px-3 py-2 text-white text-sm"
                       />
                     </div>
                     <button 
                       type="submit" disabled={overriding}
                       className="w-full bg-dev-critical text-white font-medium hover:bg-dev-critical/80 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                     >
                       <Save className="h-4 w-4" />
                       {overriding ? "Saving..." : "Apply Override"}
                     </button>
                   </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
