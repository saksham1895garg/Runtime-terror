import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4 text-dev-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-dev-primary" />
        <p className="text-sm font-mono tracking-widest uppercase animate-pulse">Initializing Control Center...</p>
      </div>
    </div>
  );
}
