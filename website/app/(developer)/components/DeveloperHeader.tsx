"use client";

import { Menu, Search, Bell, LogOut, ShieldAlert, CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function DeveloperHeader({
  toggleSidebar,
  userEmail,
  isSidebarCollapsed
}: {
  toggleSidebar: () => void;
  userEmail: string;
  isSidebarCollapsed: boolean;
}) {
  const pathname = usePathname();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
  const isGodMode = pathname.includes('/god-mode');

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/dev-login';
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-dev-border bg-dev-bg/80 backdrop-blur-md z-30 shrink-0 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-md text-dev-text-muted hover:text-white hover:bg-dev-elevated transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex items-center gap-3">
          <div className="h-6 w-[1px] bg-dev-border mx-2"></div>
          {isDemo ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dev-accent/10 border border-dev-accent/20 text-dev-accent text-xs font-semibold tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dev-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-dev-accent"></span>
              </span>
              DEMO ENV
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dev-success/10 border border-dev-success/20 text-dev-success text-xs font-semibold tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-dev-success"></span>
              </span>
              PROD ENV
            </div>
          )}

          {isGodMode ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dev-critical/10 border border-dev-critical/30 text-dev-critical text-xs font-bold tracking-wider animate-pulse-soft">
              <ShieldAlert className="h-3.5 w-3.5" />
              ROOT ACTIVE
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dev-surface border border-dev-border text-dev-text-muted text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-dev-success" />
              SYSTEMS NOMINAL
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            document.dispatchEvent(event);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-dev-surface border border-dev-border text-dev-text-muted hover:text-white hover:border-dev-text-muted transition-colors md:w-64"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search (Cmd+K)</span>
        </button>

        <button className="p-2 rounded-md text-dev-text-muted hover:text-white hover:bg-dev-elevated transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-dev-primary border-2 border-dev-bg"></span>
        </button>

        <div className="h-6 w-[1px] bg-dev-border mx-1 hidden md:block"></div>

        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-sm font-medium text-white">{userEmail.split('@')[0]}</span>
          <span className="text-[10px] font-mono text-dev-text-muted uppercase">Developer</span>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2 rounded-md text-dev-text-muted hover:text-dev-critical hover:bg-dev-critical/10 transition-colors"
          title="Kill Session"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
