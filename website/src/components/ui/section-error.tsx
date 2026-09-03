import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface SectionErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function SectionError({ 
  title = "Failed to load data", 
  message = "An error occurred while fetching the required information.",
  onRetry,
  className = ""
}: SectionErrorProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/50 border border-red-100 rounded-md w-full h-full min-h-[200px] ${className}`}>
      <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 max-w-sm mb-4">{message}</p>
      
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="border-red-200 text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
