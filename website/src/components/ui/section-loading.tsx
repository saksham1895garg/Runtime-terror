import { Loader2 } from "lucide-react";

interface SectionLoadingProps {
  text?: string;
  className?: string;
}

export function SectionLoading({ text = "Loading...", className = "" }: SectionLoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 w-full h-full min-h-[200px] ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
      <p className="text-sm font-medium tracking-wide">{text}</p>
    </div>
  );
}
