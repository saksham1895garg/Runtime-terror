"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Info, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";

const MapView = dynamic(() => import("@/src/components/map/MapView"), { ssr: false });

export default function PublicPage() {
  const [riskGrid, setRiskGrid] = useState<any>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/risk/grid").then(r => r.json()),
      fetch("/api/warnings").then(r => r.json())
    ]).then(([grid, w]) => {
      setRiskGrid(grid);
      setWarnings(w);
    });
  }, []);

  return (
    <div className="flex flex-col h-full md:flex-row">
      <div className="flex-1 relative order-2 md:order-1 h-[60vh] md:h-full">
        <MapView riskData={riskGrid} />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-xs font-medium text-slate-700 border border-slate-200 flex items-center gap-2 z-10">
          <Info className="h-4 w-4 text-blue-500" />
          Model-estimated local risk. Follow official advisories for emergency instructions.
        </div>
      </div>
      
      <div className="w-full md:w-96 bg-white border-l order-1 md:order-2 flex flex-col h-auto md:h-full shrink-0 shadow-lg z-20">
        <div className="p-5 border-b bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 mb-1">East Sikkim Status</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <Link 
            href="/public/report"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold shadow-sm transition-colors mb-6"
          >
            <PlusCircle className="h-5 w-5" />
            Submit Ground Report
          </Link>

          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Official Advisories</h3>
          
          {warnings.length > 0 ? (
            warnings.map(warning => (
              <div key={warning.id} className="border border-red-200 bg-red-50 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">{warning.title}</h4>
                    <p className="text-sm text-red-800 mt-1 leading-snug">{warning.description}</p>
                    <div className="text-xs text-red-600/80 mt-3 font-medium">Source: {warning.source}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 italic">No active advisories at this time.</div>
          )}
          
          <div className="pt-6 mt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Safety Guidance</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                Avoid traveling on mountain roads during heavy rainfall.
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                Move to higher ground or designated safe areas if instructed by authorities.
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                Report any cracks in slopes or sudden muddy water flow immediately.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
