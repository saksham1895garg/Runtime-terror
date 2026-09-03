import Link from "next/link";
import { MapPinOff, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-screen w-full bg-slate-50 p-6 text-center">
      <div className="h-20 w-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
        <MapPinOff className="h-10 w-10 text-slate-500" />
      </div>
      <h2 className="text-4xl font-bold text-slate-900 mb-3">404 - Area Not Found</h2>
      <p className="text-slate-600 max-w-md mb-8 text-lg">
        The requested coordinate or module does not exist in the current deployment region.
      </p>
      <Link href="/dashboard">
        <Button className="flex items-center gap-2" size="lg">
          <ArrowLeft className="h-4 w-4" />
          Return to Command Center
        </Button>
      </Link>
    </div>
  );
}
