import { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DeveloperLayoutClient from "./components/DeveloperLayoutClient";
import { isRoot, can } from "@/utils/auth/permissions";

export const metadata = {
  title: "DHARA-SOOCHAK Control Center",
  description: "Developer and Operations Control Plane",
};

export default async function DeveloperLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if this developer is eligible for God Mode
  const rootEligible = await isRoot(user.id);
  
  // Check granular permissions for sidebar visibility
  const canManageUsers = rootEligible || await can(user.id, 'users.manage');
  const canReadAudit = rootEligible || await can(user.id, 'audit.read');

  return (
    <DeveloperLayoutClient 
      userEmail={user.email || 'developer@dhara-soochak.gov'} 
      isRootEligible={rootEligible}
      canManageUsers={canManageUsers}
      canReadAudit={canReadAudit}
    >
      {children}
    </DeveloperLayoutClient>
  );
}
