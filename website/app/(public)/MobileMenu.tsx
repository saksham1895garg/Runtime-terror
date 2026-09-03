"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation, AlertTriangle, FileWarning, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button variant="ghost" className="md:hidden" onClick={() => setIsOpen(true)}>
        <Menu className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" className="md:hidden relative z-[610]" onClick={() => setIsOpen(false)}>
        <X className="h-6 w-6" />
      </Button>
      
      <div className="fixed inset-0 z-[605] bg-white pt-20 px-6 flex flex-col gap-6 md:hidden">
        <nav className="flex flex-col gap-6">
          <Link href="/public-map" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-800 flex items-center gap-3 py-2 border-b border-slate-100">
            <Navigation className="h-5 w-5 text-blue-600" /> Risk Map
          </Link>
          <Link href="/public-advisories" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-800 flex items-center gap-3 py-2 border-b border-slate-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Advisories
          </Link>
          <Link href="/report" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-800 flex items-center gap-3 py-2 border-b border-slate-100">
            <FileWarning className="h-5 w-5 text-red-600" /> Report Landslide
          </Link>
          <Link href="/login" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-800 flex items-center gap-3 py-2 border-b border-slate-100">
            <LogIn className="h-5 w-5 text-slate-500" /> Officer Login
          </Link>
        </nav>
      </div>
    </>
  );
}
