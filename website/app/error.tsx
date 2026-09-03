"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px] w-full bg-slate-50 p-6 text-center">
      <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertOctagon className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Module Failed to Load</h2>
      <p className="text-slate-600 max-w-md mb-8">
        We encountered an unexpected error while rendering this intelligence module. 
        Your operational data is safe. Please retry loading the module.
      </p>
      <Button 
        onClick={() => reset()}
        className="flex items-center gap-2"
        size="lg"
      >
        <RotateCcw className="h-4 w-4" />
        Retry Loading
      </Button>
    </div>
  );
}
