"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateAdvisoryModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    type: "EVACUATION_WARNING",
    title: "",
    description: "",
    severity: "HIGH",
    area: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/officer/advisories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create advisory");
      }
      
      setOpen(false);
      setFormData({ type: "EVACUATION_WARNING", title: "", description: "", severity: "HIGH", area: "" });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button className="bg-blue-600" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Advisory
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-50 bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Issue Public Advisory</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="EVACUATION_WARNING">Evacuation Warning</option>
                  <option value="ROAD_CLOSURE">Road Closure</option>
                  <option value="GENERAL_SAFETY">General Safety</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input 
                  className="w-full p-2 border rounded-md"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Critical Landslide Warning"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Area / Grid Code</label>
                <input 
                  className="w-full p-2 border rounded-md"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="e.g. GNG-000026"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Severity</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={formData.severity}
                  onChange={(e) => setFormData({...formData, severity: e.target.value})}
                  required
                >
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="w-full p-2 border rounded-md"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Details of the advisory..."
                  rows={3}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 mt-2">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Advisory
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
