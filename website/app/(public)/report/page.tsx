"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { MapPin, Camera, AlertTriangle, Send, CheckCircle2, Loader2 } from "lucide-react";

export default function PublicReportPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationError, setLocationError] = useState("");
  const supabase = createClient();

  const [formData, setFormData] = useState({
    category: "",
    severity: "",
    description: "",
    lat: "",
    lon: ""
  });

  const getLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          lon: position.coords.longitude.toString()
        }));
      },
      () => {
        setLocationError("Unable to retrieve your location. Please ensure location permissions are granted.");
      }
    );
  };

  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          severity: formData.severity,
          description: formData.description,
          lat: parseFloat(formData.lat),
          lon: parseFloat(formData.lon)
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Server rejected the submission");
      }
      
      setSuccess(true);
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setSubmitError(err.message || "Unable to reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 w-full text-center">
        <div className="inline-flex items-center justify-center p-4 bg-green-100 text-green-600 rounded-full mb-6">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Report Submitted</h2>
        <p className="text-slate-600 mb-8">
          Thank you for reporting. Your information has been securely transmitted to the disaster management authorities for immediate review.
        </p>
        <Button onClick={() => setSuccess(false)} variant="outline">Submit Another Report</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Report an Incident</h1>
        <p className="text-slate-600">
          Help authorities act faster. Report ground cracks, rockfalls, or landslides in your area.
        </p>
      </div>

      <Card className="shadow-lg border-0 shadow-slate-200/50">
        <CardHeader className="bg-slate-50 border-b pb-6 rounded-t-xl">
          <CardTitle className="text-xl">Incident Details</CardTitle>
          <CardDescription>All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location Coordinates *</label>
              <div className="flex gap-2 items-start">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <input 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Latitude" 
                    value={formData.lat} 
                    onChange={e => setFormData({...formData, lat: e.target.value})} 
                    required 
                  />
                  <input 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Longitude" 
                    value={formData.lon} 
                    onChange={e => setFormData({...formData, lon: e.target.value})} 
                    required 
                  />
                </div>
                <Button type="button" variant="secondary" onClick={getLocation} className="shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <MapPin className="h-4 w-4 mr-2" /> Get Location
                </Button>
              </div>
              {locationError && <p className="text-xs text-red-500">{locationError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Observation Category *</label>
                <select 
                  required 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="" disabled>Select type...</option>
                  <option value="GROUND_CRACK">Ground Crack</option>
                  <option value="SLOPE_MOVEMENT">Slope Movement</option>
                  <option value="FALLEN_DEBRIS">Fallen Debris</option>
                  <option value="ROCKFALL">Rockfall</option>
                  <option value="WATER_SEEPAGE">Unusual Water Seepage</option>
                  <option value="LANDSLIDE">Active Landslide</option>
                  <option value="DAMAGED_INFRA">Damaged Infrastructure</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Severity Assessment *</label>
                <select 
                  required 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.severity}
                  onChange={(e) => setFormData({...formData, severity: e.target.value})}
                >
                  <option value="" disabled>Select severity...</option>
                  <option value="LOW">Low (Minor signs)</option>
                  <option value="MODERATE">Moderate (Developing issue)</option>
                  <option value="HIGH">High (Immediate danger)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Detailed Description *</label>
              <textarea 
                required 
                placeholder="Please describe what you see. Mention any nearby landmarks, impacts on roads, or immediate risks..."
                className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-3 border-t pt-6">
              <label className="text-sm font-medium leading-none">Attach Photo (Optional)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                <Camera className="h-8 w-8 mb-2 text-slate-400" />
                <span className="text-sm font-medium">Click to upload or drag and drop</span>
                <span className="text-xs text-slate-400 mt-1">JPEG, PNG up to 5MB</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p>In case of an active emergency with immediate threat to life, please step away from the site and call the National Emergency Number (112) immediately.</p>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <p className="font-semibold mb-1">Submission Failed</p>
                <p>{submitError}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Report...</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Submit to Authorities</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
