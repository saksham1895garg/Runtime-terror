import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ElementType;
  className?: string;
}

export function EmptyState({ 
  title = "No data available", 
  message = "There is currently no information to display here.",
  icon: Icon = FileQuestion,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 rounded-md bg-slate-50 w-full h-full min-h-[200px] ${className}`}>
      <Icon className="h-12 w-12 text-slate-400 mb-4 opacity-50" />
      <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm">{message}</p>
    </div>
  );
}
