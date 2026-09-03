"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Database, RefreshCw, Trash2, Play } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useState } from "react";

export default function DevDemoDataPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Demo Data Management</h1>
        <p className="text-slate-400">Control the database state for presentation and testing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" /> Reset Database
            </CardTitle>
            <CardDescription className="text-slate-400">Truncate all tables and re-run seed script.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }} disabled={loading}>
              {loading ? "Running seed..." : "Reset to Default Seed"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-500" /> Trigger Simulation
            </CardTitle>
            <CardDescription className="text-slate-400">Simulate incoming field reports and risk escalations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              Run Simulation (1x)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-red-900/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Purge Data
            </CardTitle>
            <CardDescription className="text-slate-400">WARNING: This will permanently delete all records.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="bg-red-900 hover:bg-red-800 text-red-100">
              Truncate All Tables
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
