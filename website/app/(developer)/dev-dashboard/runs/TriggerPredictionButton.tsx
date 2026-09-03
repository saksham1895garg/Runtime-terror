"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TriggerPredictionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/developer/predictions/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid_code: "GNG-000026" })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger prediction");
      }
      
      router.refresh(); // Refresh the server component to show new run
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {error && <span className="text-sm text-dev-critical font-medium">{error}</span>}
      <button 
        onClick={handleTrigger}
        disabled={loading}
        className="flex items-center gap-2 bg-dev-primary hover:bg-dev-accent text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {loading ? "Triggering..." : "Run Test Prediction"}
      </button>
    </div>
  );
}
