"use client";
import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
