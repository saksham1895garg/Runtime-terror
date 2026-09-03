"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Send, AlertCircle, Video } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useDemo } from "@/src/context/DemoContext";

export default function PublicReportPage() {
  const router = useRouter();
  const { addReport } = useDemo();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [category, setCategory] = useState("GROUND_CRACK");
  const [severity, setSeverity] = useState("HIGH");
  const [description, setDescription] = useState("");
  
  // Simulated Location (Singtam area)
  const [location] = useState<[number, number]>([88.498, 27.235]); 
  const [fileAttached, setFileAttached] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      // Create a mock report. We simulate a discrepancy by linking it to a low-risk cell (ES-1000).
      // If we want this to be a conflict, discrepancy = true
      addReport({
        id: `PR-${Date.now()}`,
        gridId: "ES-1000",
        location,
        category: category as any,
        description,
        severity: severity as any,
        reporterType: "CITIZEN",
        timestamp: new Date().toISOString(),
        status: "NEW",
        discrepancy: severity === "HIGH" // If user reports HIGH severity, we force a discrepancy for demo purposes
      });
      
      setSuccess(true);
      setLoading(false);
    }, 1000);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Send className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted</h2>
        <p className="text-slate-600 max-w-sm mb-6">
          Thank you. Your report has been sent to the emergency response team for immediate verification.
        </p>
        <Button onClick={() => router.push("/public")}>Return to Map</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-full">
      <div className="mb-6 pb-4 border-b">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Submit Field Report
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Report ground cracks, landslides, or dangerous conditions to authorities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Incident Category</label>
          <select 
            className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="GROUND_CRACK">Ground Crack / Fissure</option>
            <option value="SLOPE_MOVEMENT">Slope Movement</option>
            <option value="FALLEN_DEBRIS">Fallen Debris</option>
            <option value="WATER_SEEPAGE">Unusual Water Seepage</option>
            <option value="BLOCKED_ROAD">Blocked Road</option>
            <option value="LANDSLIDE">Active Landslide</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Severity / Danger Level</label>
          <select 
            className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={severity}
            onChange={e => setSeverity(e.target.value)}
          >
            <option value="LOW">Low (Monitoring needed)</option>
            <option value="MODERATE">Moderate (Potential hazard)</option>
            <option value="HIGH">High (Immediate danger)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea 
            className="w-full p-3 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
            placeholder="Describe what you see..."
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>Using current GPS location: {location[1].toFixed(4)}, {location[0].toFixed(4)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Media Evidence</label>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => setFileAttached(true)}
              className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed transition-colors ${fileAttached ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400'}`}
            >
              <Camera className="h-6 w-6" />
              <span className="text-xs font-medium">{fileAttached ? 'Photo Attached' : 'Take Photo'}</span>
            </button>
            <button 
              type="button" 
              onClick={() => setFileAttached(true)}
              className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed transition-colors ${fileAttached ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400'}`}
            >
              <Video className="h-6 w-6" />
              <span className="text-xs font-medium">{fileAttached ? 'Video Attached' : 'Record Video'}</span>
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
          {loading ? "Submitting..." : "Submit Official Report"}
        </Button>
      </form>
    </div>
  );
}
