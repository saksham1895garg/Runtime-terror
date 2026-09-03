import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "risk_very_low" | "risk_low" | "risk_moderate" | "risk_high" | "risk_very_high"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80": variant === "default",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80": variant === "secondary",
          "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80": variant === "destructive",
          "text-slate-950": variant === "outline",
          "border-transparent bg-green-500 text-white": variant === "success",
          "border-transparent bg-yellow-500 text-white": variant === "warning" || variant === "risk_moderate",
          "border-transparent bg-emerald-500 text-white": variant === "risk_very_low",
          "border-transparent bg-green-400 text-white": variant === "risk_low",
          "border-transparent bg-orange-500 text-white": variant === "risk_high",
          "border-transparent bg-red-600 text-white": variant === "risk_very_high",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
