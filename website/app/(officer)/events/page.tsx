"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { History, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/data-table";

const historicalEvents = [
  { id: "EVT-2023-01", date: "2023-08-14", location: "Mangan-Chungthang Road", severity: "HIGH", impact: "Road blocked for 3 days", source: "GSI Report" },
  { id: "EVT-2023-02", date: "2023-07-22", location: "Singtam", severity: "MODERATE", impact: "Minor infrastructure damage", source: "Field Officer" },
  { id: "EVT-2022-01", date: "2022-09-05", location: "Namchi", severity: "HIGH", impact: "Evacuation of 50 households", source: "State Disaster Management" },
];

export default function HistoricalEventsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-slate-500" />
            Historical Landslides
          </h1>
          <p className="text-sm text-slate-500 mt-1">Past event records used for model training and susceptibility mapping.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Event Registry</CardTitle>
          <CardDescription>Verified landslide events in the region</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Event ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalEvents.map(evt => (
                <TableRow key={evt.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{evt.id}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3 text-slate-400" />
                      {evt.date}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {evt.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${evt.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {evt.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{evt.impact}</TableCell>
                  <TableCell className="text-xs text-slate-500">{evt.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
