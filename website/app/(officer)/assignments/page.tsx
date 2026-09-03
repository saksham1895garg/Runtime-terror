"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Activity, ShieldCheck, MapPin, CheckCircle, XCircle, AlertCircle, RefreshCcw } from "lucide-react";

export default function OfficerAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/officer/assignments');
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const json = await res.json();
      // The API returns an array directly, but we check both formats just in case
      const fetchedAssignments = Array.isArray(json) ? json : (json.assignments || []);
      setAssignments(fetchedAssignments);
    } catch (err: any) {
      setAssignments([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/officer/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      await fetchAssignments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
          <ShieldCheck className="h-6 w-6" />
          My Active Assignments
        </h1>
        <button 
          onClick={fetchAssignments}
          className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
          <button onClick={fetchAssignments} className="px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded hover:bg-destructive/90">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && assignments.length === 0 && (
        <Card className="bg-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>You have no pending assignments.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && assignments.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment: any) => (
          <Card key={assignment.id} className="bg-card shadow-sm border border-border flex flex-col">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {assignment.grid_code}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  assignment.assignment_status === 'PENDING' ? 'bg-amber-500/20 text-amber-600' :
                  assignment.assignment_status === 'ACKNOWLEDGED' ? 'bg-blue-500/20 text-blue-600' :
                  'bg-green-500/20 text-green-600'
                }`}>
                  {assignment.assignment_status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Run ID</p>
                  <p className="text-sm font-mono truncate" title={assignment.run_id}>{assignment.run_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Risk Information</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-sm">
                      Score: <span className="font-bold">{assignment.risk_predictions?.risk_score ?? 'N/A'}</span>
                    </span>
                    <span className="text-sm">
                      Category: <span className="font-bold">{assignment.risk_predictions?.risk_category ?? 'N/A'}</span>
                    </span>
                    <span className="text-sm">
                      Conf: <span className="font-bold">{assignment.risk_predictions?.confidence ?? 'N/A'}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned At</p>
                  <p className="text-sm">{new Date(assignment.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border/50">
                {assignment.assignment_status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleAction(assignment.id, 'ACKNOWLEDGE')}
                      className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors"
                    >
                      Acknowledge
                    </button>
                    <button 
                      onClick={() => handleAction(assignment.id, 'DECLINE')}
                      className="w-full py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md font-medium transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}
                
                {assignment.assignment_status === 'ACKNOWLEDGED' && (
                  <button 
                    onClick={() => handleAction(assignment.id, 'COMPLETE')}
                    className="w-full py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Completed
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
