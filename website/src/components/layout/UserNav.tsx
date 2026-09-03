"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

interface UserNavProps {
  name: string | null;
  role: string;
  email: string;
}

export function UserNav({ name, role, email }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col text-right hidden sm:flex">
        <span className="text-sm font-medium text-white">{name || email}</span>
        <span className="text-xs text-blue-200 capitalize">{role}</span>
      </div>
      <div className="h-8 w-8 rounded-full bg-blue-700 border border-blue-600 flex items-center justify-center">
        <UserIcon className="h-4 w-4 text-blue-100" />
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleSignOut}
        className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8"
        title="Sign Out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
