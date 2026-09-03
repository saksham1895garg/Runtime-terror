"use client";

import { ReactNode, useState, useEffect } from "react";
import DeveloperSidebar from "./DeveloperSidebar";
import DeveloperHeader from "./DeveloperHeader";
import CommandPalette from "./CommandPalette";

export default function DeveloperLayoutClient({
  children,
  userEmail,
  isRootEligible,
  canManageUsers,
  canReadAudit,
}: {
  children: ReactNode;
  userEmail: string;
  isRootEligible: boolean;
  canManageUsers: boolean;
  canReadAudit: boolean;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-dev-bg text-dev-text font-sans overflow-hidden">
      <CommandPalette />
      {/* Mobile Drawer Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:w-20"
        } ${!isSidebarOpen && !isMobile ? "lg:translate-x-0" : ""} w-72`}
      >
        <DeveloperSidebar 
          isCollapsed={!isSidebarOpen && !isMobile} 
          isRootEligible={isRootEligible} 
          canManageUsers={canManageUsers}
          canReadAudit={canReadAudit}
          onClose={() => isMobile && setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DeveloperHeader 
          toggleSidebar={toggleSidebar} 
          userEmail={userEmail} 
          isSidebarCollapsed={!isSidebarOpen && !isMobile}
        />
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
