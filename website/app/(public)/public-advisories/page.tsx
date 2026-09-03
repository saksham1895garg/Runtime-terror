"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { AlertTriangle, Clock, MapPin, ShieldAlert } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

export default function PublicAdvisoriesPage() {
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAdvisories() {
      const { data, error } = await supabase
        .from("advisories")
        .select("*")
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false });
        
      if (!error && data) {
        setAdvisories(data);
      }
      setLoading(false);
    }
    fetchAdvisories();
  }, [supabase]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Official Safety Advisories</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Stay informed with the latest warnings and safety guidelines issued by the disaster management authorities for the East Sikkim region.
        </p>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 text-slate-500 animate-pulse">Loading advisories...</div>
        ) : advisories.length === 0 ? (
          <div className="text-center py-20 bg-emerald-50 rounded-2xl border border-emerald-100">
            <ShieldAlert className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-900 mb-2">No Active Advisories</h3>
            <p className="text-emerald-700">There are currently no active safety warnings for the region.</p>
          </div>
        ) : (
          advisories.map((advisory) => (
            <div key={advisory.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className={`p-4 border-b flex justify-between items-center ${
                advisory.severity === 'CRITICAL' ? 'bg-red-50 border-red-100' :
                advisory.severity === 'HIGH' ? 'bg-orange-50 border-orange-100' :
                'bg-blue-50 border-blue-100'
              }`}>
                <div className="flex items-center gap-3">
                  <Badge variant={advisory.severity === 'CRITICAL' ? 'destructive' : advisory.severity === 'HIGH' ? 'warning' : 'default'} className="uppercase">
                    {advisory.severity}
                  </Badge>
                  <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{advisory.type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {new Date(advisory.published_at).toLocaleString()}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{advisory.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">{advisory.description}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-700">Affected Area:</span> {advisory.area}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
