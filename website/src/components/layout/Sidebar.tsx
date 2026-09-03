"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Map, List, History, CloudRain, Bell, Settings, Globe, 
  FileText, Flag, MessageSquareWarning, ShieldCheck, X
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

export function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ reports: 0, flags: 0, assignments: 0 });
  const { isOpen, setIsOpen } = useSidebar();

  useEffect(() => {
    fetch('/api/officer')
      .then(res => res.json())
      .then(data => {
        if (data && data.counts) {
          setCounts(data.counts);
        }
      })
      .catch(console.error);
  }, []);
  
  const navGroups = [
    {
      title: "Core",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Map View", href: "/map", icon: Map },
      ]
    },
    {
      title: "Workflows",
      items: [
        { name: "Assignments", href: "/assignments", icon: ShieldCheck, badge: counts.assignments > 0 ? counts.assignments.toString() : null },
        { name: "Public Reports", href: "/reports", icon: FileText, badge: counts.reports > 0 ? counts.reports.toString() : null },
        { name: "Decision Flags", href: "/flags", icon: Flag, badge: counts.flags > 0 ? counts.flags.toString() : null },
        { name: "Advisories", href: "/advisories", icon: MessageSquareWarning },
      ]
    },
    {
      title: "Analytics",
      items: [
        { name: "Grid Intelligence", href: "/grid-intelligence", icon: Map },
        { name: "Priority Assets", href: "/assets", icon: List },
        { name: "Rainfall", href: "/rainfall", icon: CloudRain },
        { name: "Historical", href: "/events", icon: History },
        { name: "Alerts", href: "/alerts", icon: Bell },
      ]
    }
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 w-64 flex-shrink-0 bg-[#09090b] border-r border-slate-800 h-full flex flex-col z-50 transition-transform duration-200 ease-in-out`}>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          <div className="md:hidden flex justify-end mb-2">
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          {navGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
              {group.title}
            </h4>
            <nav className="space-y-1">
              {group.items.map((item) => {
                // Exact match or nested path (e.g. /assignments/1)
                const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors group ${
                      isActive 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-[16px] w-[16px] ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-slate-800 space-y-1 bg-[#09090b]">
        {[
          { name: "Audit Logs", href: "/audit", icon: ShieldCheck },
          { name: "Settings", href: "/settings", icon: Settings },
        ].map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-[16px] w-[16px] ${isActive ? "text-primary" : "text-slate-500"}`} />
              {item.name}
            </Link>
          );
        })}
        <Link
          href="/public-map"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors mt-2"
        >
          <Globe className="h-[16px] w-[16px] text-slate-500" />
          Public View
        </Link>
      </div>
    </aside>
    </>
  );
}
