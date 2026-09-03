"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Settings, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function DevConfigPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Configuration</h1>
        <p className="text-slate-400">Platform-wide settings and API keys.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Environment Variables</CardTitle>
          <CardDescription className="text-slate-400">Manage external integration keys.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-500 uppercase">NEXT_PUBLIC_SUPABASE_URL</label>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">https://oqivxvlljiibncfeucje.supabase.co</div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-500 uppercase">NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT</label>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-sm font-mono text-slate-300">https://ik.imagekit.io/dhara</div>
          </div>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4 mr-2" /> Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
