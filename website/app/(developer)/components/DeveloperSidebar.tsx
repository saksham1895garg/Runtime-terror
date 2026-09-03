"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Terminal, Activity, HeartPulse, 
  Users, UserCog, ShieldCheck, KeyRound, Clock,
  FileWarning, Flag, Bell, Image as ImageIcon, MessageSquareWarning,
  Database, Map, MapPin, Navigation, CloudRain, History,
  ShieldAlert, ScrollText, AlertTriangle, Settings, Zap,
  ChevronRight, X
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  highRisk?: boolean;
};

type NavGroup = {
  title: string;
  id?: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { title: "Command Center", href: "/dev-dashboard", icon: Terminal },
      { title: "Grid Controls", href: "/dev-dashboard/grids", icon: MapPin },
      { title: "Prediction Runs", href: "/dev-dashboard/runs", icon: Activity },
    ],
  },
  {
    title: "IDENTITY",
    id: "IDENTITY",
    items: [
      { title: "Developers", href: "/users?tab=developers", icon: UserCog },
      { title: "Officers", href: "/users?tab=officers", icon: ShieldCheck },
      { title: "Public Users", href: "/users?tab=public", icon: Users },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { title: "Public Reports", href: "/dev-dashboard/reports", icon: FileWarning },
      { title: "Advisories", href: "/dev-dashboard/advisories", icon: MessageSquareWarning },
    ],
  },
  {
    title: "DATA",
    items: [
      { title: "Demo Data", href: "/demo", icon: Database },
    ],
  },
  {
    title: "GOVERNANCE",
    id: "GOVERNANCE",
    items: [
      { title: "Audit Logs", href: "/dev-audit", icon: ScrollText },
    ],
  },
];

const highRiskGroup: NavGroup = {
  title: "HIGH RISK",
  items: [
    { title: "God Mode", href: "/dev-dashboard/god-mode", icon: AlertTriangle, highRisk: true },
  ],
};

export default function DeveloperSidebar({ 
  isCollapsed, 
  isRootEligible,
  canManageUsers,
  canReadAudit,
  onClose
}: { 
  isCollapsed: boolean;
  isRootEligible: boolean;
  canManageUsers?: boolean;
  canReadAudit?: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const renderLink = (item: NavItem) => {
    const [itemPath, itemQuery] = item.href.split('?');
    let isActive = false;

    if (pathname === itemPath || (itemPath !== "/dev-dashboard" && itemPath !== "/" && pathname.startsWith(`${itemPath}/`))) {
      if (itemQuery) {
        const paramMatches = new URLSearchParams(itemQuery);
        let allParamsMatch = true;
        paramMatches.forEach((val, key) => {
          if (searchParams.get(key) !== val) allParamsMatch = false;
        });
        isActive = allParamsMatch;
      } else {
        isActive = true;
      }
    }
    const Icon = item.icon;

    return (
      <Link 
        key={item.href} 
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative ${
          isActive 
            ? item.highRisk 
              ? "bg-dev-critical/15 text-dev-critical border border-dev-critical/30" 
              : "bg-dev-primary/15 text-dev-primary border border-dev-primary/30 shadow-[0_0_15px_rgba(37,99,235,0.15)]"
            : "text-dev-text-muted hover:bg-dev-elevated hover:text-dev-text border border-transparent"
        }`}
        title={isCollapsed ? item.title : undefined}
        onClick={() => {
          if (window.innerWidth < 1024) onClose();
        }}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className={`h-5 w-5 shrink-0 ${isActive ? "" : "group-hover:scale-110 transition-transform duration-200"}`} />
        {!isCollapsed && (
          <span className="font-medium text-sm tracking-wide truncate">{item.title}</span>
        )}
        
        {isActive && !isCollapsed && (
          <ChevronRight className={`h-4 w-4 ml-auto opacity-70 ${item.highRisk ? "text-dev-critical" : "text-dev-primary"}`} />
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-4 px-2 py-1 bg-dev-elevated border border-dev-border text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {item.title}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="h-full bg-dev-bg border-r border-dev-border flex flex-col w-full shadow-2xl">
      <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-dev-border shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-dev-primary to-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0 overflow-hidden">
            <img src="/logo/favicon_180x180.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-widest text-white">DHARA-SOOCHAK</span>
              <span className="text-[10px] text-dev-primary font-mono tracking-widest uppercase opacity-80">Control Center</span>
            </div>
          )}
        </div>
        <button className="lg:hidden text-dev-text-muted hover:text-white" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin">
        {navGroups.filter(g => {
          if (g.id === "IDENTITY" && !canManageUsers) return false;
          if (g.id === "GOVERNANCE" && !canReadAudit) return false;
          return true;
        }).map((group) => (
          <div key={group.title} className="space-y-2">
            {!isCollapsed ? (
              <h3 className="px-3 text-[11px] font-semibold tracking-[0.2em] text-dev-text-muted/60 mb-3">
                {group.title}
              </h3>
            ) : (
              <div className="h-4" />
            )}
            <div className="space-y-1">
              {group.items.map(renderLink)}
            </div>
          </div>
        ))}

        {isRootEligible && (
          <div className="space-y-2 pt-4 border-t border-dev-critical/10">
            {!isCollapsed && (
              <h3 className="px-3 text-[11px] font-semibold tracking-[0.2em] text-dev-critical/60 mb-3">
                {highRiskGroup.title}
              </h3>
            )}
            <div className="space-y-1">
              {highRiskGroup.items.map(renderLink)}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-dev-border shrink-0 bg-dev-bg/50 backdrop-blur">
        <Link 
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded bg-dev-surface border border-dev-border text-dev-text-muted hover:text-white hover:bg-dev-elevated transition-colors text-sm font-medium"
        >
          <Navigation className="h-4 w-4" />
          {!isCollapsed && "Exit to Officer App"}
        </Link>
      </div>
    </div>
  );
}
