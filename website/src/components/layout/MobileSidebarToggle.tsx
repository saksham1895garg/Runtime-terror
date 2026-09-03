"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export function MobileSidebarToggle() {
  const { setIsOpen } = useSidebar();
  return (
    <button 
      className="md:hidden mr-2 p-1 text-slate-400 hover:text-white transition-colors"
      onClick={() => setIsOpen(true)}
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
