import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { UserNav } from "./UserNav";
import { Bell } from "lucide-react";
import { MobileSidebarToggle } from "./MobileSidebarToggle";

export async function TopBar() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <header className="flex h-12 items-center gap-4 border-b border-slate-800 bg-[#09090b] px-4 md:px-6 text-white shrink-0 relative z-50">
      <MobileSidebarToggle />
      <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
        <div className="bg-primary p-1 rounded-sm">
          <img src="/logo/logo.svg" alt="DHARA-SOOCHAK Logo" className="h-4 w-4 invert" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-slate-100">DHARA-SOOCHAK</span>
      </Link>
      
      <div className="ml-4 hidden md:flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
        EAST SIKKIM
      </div>
      {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <div className="hidden md:flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-900/30 border border-amber-800/50 text-amber-500">
          [DEMO ENVIRONMENT]
        </div>
      )}
      
      <div className="ml-auto flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 hidden sm:flex">
          <div className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-bold tracking-wider">SYSTEM ACTIVE</span>
        </div>
        
        {profile && (
          <>
            <div className="h-4 w-px bg-slate-700" />
            <Link href="/flags" className="relative text-slate-300 hover:text-white transition-colors" title="Open decision flags">
              <Bell className="h-5 w-5" />
            </Link>
            <div className="h-4 w-px bg-slate-700" />
            <UserNav name={profile.name} role={profile.role} email={profile.email} />
          </>
        )}
      </div>
    </header>
  );
}
