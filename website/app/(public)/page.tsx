"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ShieldCheck, Map, Bell, ArrowRight, ArrowUpRight, Activity, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";

export default function PublicHomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 font-sans">
      {/* Official Government Banner */}
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs tracking-wider uppercase font-semibold border-b-4 border-primary">
        An Official Government Safety Portal for East Sikkim
      </div>

      {/* Hero Section */}
      <section className="w-full bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded text-red-700 font-bold flex items-center gap-2 text-xs uppercase tracking-widest border border-red-200">
              <Activity className="h-4 w-4" />
              Monitoring Active
            </div>
            <div className="text-sm font-medium text-slate-500">
              Last updated: {mounted ? new Date().toLocaleDateString() : 'Loading...'}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight max-w-4xl">
            DHARA-SOOCHAK Early Warning & Information System
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-slate-600 mb-10 leading-relaxed border-l-4 border-primary pl-4">
            Official landslide risk management and early warning system providing real-time intelligence for the safety of citizens and infrastructure.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/public-map" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-12 px-8 text-base bg-primary hover:bg-blue-800 text-white rounded-md shadow-sm">
                View Live Risk Map <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/report" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-md">
                <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                Report an Incident
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Status & Information Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Active Advisories Panel */}
            <Card className="border border-slate-200 shadow-sm rounded-md overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-slate-700" />
                <h3 className="font-bold text-slate-900">Current Safety Advisories</h3>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded border border-green-200">All Clear</span>
                      <span className="text-xs text-slate-500">Today, 08:00 AM</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">No active evacuation orders in effect.</p>
                  </div>
                  <div className="p-6 bg-slate-50 text-center">
                    <Link href="/public-advisories" className="text-sm font-semibold text-primary hover:underline flex items-center justify-center">
                      View all past advisories <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="flex flex-col gap-4">
              <Link href="/public-map" className="group block border border-slate-200 rounded-md p-6 bg-white hover:border-primary transition-colors shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-primary rounded-md group-hover:bg-primary group-hover:text-white transition-colors">
                    <Map className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 flex items-center">
                      Public Risk Map <ArrowUpRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-slate-600">Access the 500m×500m localized risk map updated in real-time.</p>
                  </div>
                </div>
              </Link>

              <Link href="/report" className="group block border border-slate-200 rounded-md p-6 bg-white hover:border-warning transition-colors shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 text-warning rounded-md group-hover:bg-warning group-hover:text-white transition-colors">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 flex items-center">
                      Submit Field Report <ArrowUpRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-slate-600">Report ground cracks, rockfalls, or abnormal water seepages.</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-white mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                DHARA-SOOCHAK
              </div>
              <p className="max-w-xs">
                Official Early Warning and Decision Support System for Disaster Management.
              </p>
            </div>
            <div className="flex gap-8 md:justify-end">
              <div className="flex flex-col gap-2">
                <Link href="/public-map" className="hover:text-white transition-colors">Public Map</Link>
                <Link href="/report" className="hover:text-white transition-colors">Report Incident</Link>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/public-advisories" className="hover:text-white transition-colors">Advisories</Link>
                <Link href="/login" className="hover:text-white transition-colors">Official Login</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} Government Disaster Management Authority. All rights reserved.</p>
            <p>For emergencies, dial official hotline numbers immediately.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
