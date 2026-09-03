"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/data-table";
import { formatDistanceToNow, format } from "date-fns";
import { ShieldCheck, User } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          user:users!audit_logs_user_id_fkey(name, email, role)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
        
      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    }
    fetchLogs();
  }, [supabase]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Immutable record of all critical system actions, overrides, and advisory broadcasts.</p>
      </div>

      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                Loading audit logs...
              </TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <ShieldCheck className="h-10 w-10 text-slate-300 mb-3" />
                  <p>No audit logs available.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                  <div>{format(new Date(log.created_at), "MMM d, yyyy")}</div>
                  <div className="text-xs text-slate-400">{format(new Date(log.created_at), "HH:mm:ss")}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="h-3 w-3 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{log.user?.name || log.user?.email || 'System'}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{log.user?.role || 'System'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 font-mono text-[10px]">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-700">{log.table_name}</span>
                  <span className="text-xs text-slate-400 block">{log.record_id}</span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <pre className="text-[10px] bg-slate-50 p-2 rounded border text-slate-600 overflow-x-auto">
                    {JSON.stringify(log.new_data || log.old_data || {}, null, 2)}
                  </pre>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-500">
                  {log.ip_address || '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </div>
  );
}
