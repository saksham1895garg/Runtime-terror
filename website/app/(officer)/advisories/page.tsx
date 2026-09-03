"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/data-table";
import { StatusPill, StatusType } from "@/src/components/ui/status-pill";
import { formatDistanceToNow } from "date-fns";
import { MessageSquareWarning, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import CreateAdvisoryModal from "./CreateAdvisoryModal";

export default function AdvisoriesPage() {
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAdvisories() {
      const { data, error } = await supabase
        .from("advisories")
        .select(`
          *,
          publisher:users!advisories_published_by_fkey(name),
          creator:users!advisories_created_by_fkey(name)
        `)
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setAdvisories(data);
      }
      setLoading(false);
    }
    fetchAdvisories();
  }, [supabase]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Official Advisories</h1>
          <p className="text-sm text-slate-500 mt-1">Manage public safety communications, travel warnings, and evacuation notices.</p>
        </div>
        <CreateAdvisoryModal />
      </div>

      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                Loading advisories...
              </TableCell>
            </TableRow>
          ) : advisories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <MessageSquareWarning className="h-10 w-10 text-slate-300 mb-3" />
                  <p>No advisories found.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            advisories.map((advisory) => (
              <TableRow key={advisory.id}>
                <TableCell className="font-medium text-slate-500">{advisory.id}</TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    {advisory.type.replace(/_/g, ' ')}
                  </span>
                </TableCell>
                <TableCell className="max-w-[250px]">
                  <p className="text-sm font-medium text-slate-900 truncate">{advisory.title}</p>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{advisory.area}</TableCell>
                <TableCell>
                  <Badge variant={advisory.severity === 'CRITICAL' || advisory.severity === 'HIGH' ? 'destructive' : 'warning'}>
                    {advisory.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusPill status={advisory.status as StatusType} />
                </TableCell>
                <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                  {advisory.published_at ? formatDistanceToNow(new Date(advisory.published_at), { addSuffix: true }) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </div>
  );
}
