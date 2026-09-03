"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import { CloudRain, Droplets, ArrowUpRight } from "lucide-react";

const rainfallData = [
  { day: 'Mon', actual: 12, predicted: 15 },
  { day: 'Tue', actual: 45, predicted: 40 },
  { day: 'Wed', actual: 78, predicted: 85 },
  { day: 'Thu', actual: 120, predicted: 110 },
  { day: 'Fri', actual: 95, predicted: 90 },
  { day: 'Sat', actual: 30, predicted: 45 },
  { day: 'Sun', actual: 15, predicted: 10 },
];

const stationData = [
  { name: 'Gangtok', value: 120, status: 'High' },
  { name: 'Mangan', value: 85, status: 'Moderate' },
  { name: 'Gyalshing', value: 45, status: 'Low' },
  { name: 'Namchi', value: 30, status: 'Low' },
];

export default function RainfallAnalyticsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rainfall Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time precipitation monitoring and forecasts from IMD stations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
              Average 24h Rainfall
              <CloudRain className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">45.2 mm</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 text-red-500">
              <ArrowUpRight className="h-3 w-3" /> +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
              Forecast 72h Total
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">185.0 mm</div>
            <p className="text-xs text-slate-500 mt-1">High probability of crossing critical threshold</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Critical Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">2</div>
            <p className="text-xs text-amber-700/80 mt-1">Reporting &gt;100mm in 24h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>7-Day Precipitation Trend</CardTitle>
            <CardDescription>Actual vs Predicted rainfall across East Sikkim region.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rainfallData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="actual" name="Actual (mm)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="predicted" name="Predicted (mm)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Station Readings (24h)</CardTitle>
            <CardDescription>Highest recordings by weather station.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }} dx={-10} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Rainfall (mm)" radius={[0, 4, 4, 0]}>
                  {
                    stationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 100 ? '#ef4444' : entry.value > 50 ? '#f59e0b' : '#3b82f6'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
