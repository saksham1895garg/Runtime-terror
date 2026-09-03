import { Layers, PhoneCall, Info } from "lucide-react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b bg-blue-900 px-4 md:px-6 text-white shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg">
          <img src="/logo/logo.svg" alt="DHARA-SOOCHAK Logo" className="h-8 w-8" />
          <span>DHARA-SOOCHAK <span className="font-normal opacity-80 text-sm ml-2 hidden sm:inline-block">Public Advisory</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-blue-200 hover:text-white underline underline-offset-2">
            Official Login
          </Link>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
            <PhoneCall className="h-4 w-4" />
            <span className="hidden sm:inline-block">Emergency: 112</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
