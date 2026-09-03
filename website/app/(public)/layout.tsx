import Link from "next/link";
import { Mountain, Navigation, AlertTriangle, FileWarning, LogIn } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { MobileMenu } from "./MobileMenu";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-[600] w-full bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-sm">
                <img src="/logo/logo.svg" alt="DHARA-SOOCHAK Logo" className="h-5 w-5 invert" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                DHARA<span className="text-blue-600">-SOOCHAK</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/public-map" className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                <Navigation className="h-4 w-4" /> Risk Map
              </Link>
              <Link href="/public-advisories" className="text-sm font-medium text-slate-600 hover:text-amber-600 flex items-center gap-1.5 transition-colors">
                <AlertTriangle className="h-4 w-4" /> Advisories
              </Link>
              <Link href="/report" className="text-sm font-medium text-slate-600 hover:text-red-600 flex items-center gap-1.5 transition-colors">
                <FileWarning className="h-4 w-4" /> Report Landslide
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> Officer Login
                </Button>
              </Link>
              <Link href="/report">
                <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200">
                  <FileWarning className="h-4 w-4 mr-2" /> Report
                </Button>
              </Link>
              <MobileMenu />
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo/logo.svg" alt="DHARA-SOOCHAK Logo" className="h-6 w-6 invert opacity-80" />
              <span className="font-bold text-xl tracking-tight text-slate-200">
                DHARA-SOOCHAK
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Early Warning and Decision Support System for Landslide Risk Management. Empowering communities with actionable intelligence.
            </p>
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/public-map" className="hover:text-blue-400 transition-colors">Public Risk Map</Link></li>
              <li><Link href="/public-advisories" className="hover:text-amber-400 transition-colors">Safety Advisories</Link></li>
              <li><Link href="/report" className="hover:text-red-400 transition-colors">Report an Incident</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-slate-300 transition-colors">Accessibility</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
