import * as React from "react"
import { cn } from "@/src/lib/utils"
import { CheckCircle2, AlertCircle, Clock, ShieldAlert, XCircle, Search } from "lucide-react"

export type StatusType = 
  | "NEW" 
  | "UNDER_REVIEW" 
  | "ASSIGNED" 
  | "FIELD_VERIFICATION" 
  | "RESOLVED" 
  | "DISMISSED"
  | "DRAFT"
  | "PUBLISHED"
  | "WITHDRAWN"

interface StatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "md", className, ...props }: StatusPillProps) {
  
  const getStatusConfig = (s: StatusType) => {
    switch(s) {
      case "NEW": 
        return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle, label: "New" }
      case "UNDER_REVIEW": 
        return { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Under Review" }
      case "ASSIGNED": 
        return { color: "bg-purple-100 text-purple-700 border-purple-200", icon: ShieldAlert, label: "Assigned" }
      case "FIELD_VERIFICATION": 
        return { color: "bg-orange-100 text-orange-700 border-orange-200", icon: Search, label: "Field Verification" }
      case "RESOLVED": 
        return { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Resolved" }
      case "DISMISSED": 
        return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: XCircle, label: "Dismissed" }
      case "DRAFT": 
        return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock, label: "Draft" }
      case "PUBLISHED": 
        return { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Published" }
      case "WITHDRAWN": 
        return { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Withdrawn" }
      default:
        return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle, label: s }
    }
  }

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        config.color,
        className
      )}
      {...props}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {config.label}
    </div>
  )
}
