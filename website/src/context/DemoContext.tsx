"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { PublicReport, OfficerFlag } from "@/src/types";
import { initialPublicReports, initialOfficerFlags } from "@/src/data/demo";

interface DemoContextType {
  reports: PublicReport[];
  addReport: (report: PublicReport) => void;
  flags: OfficerFlag[];
  updateFlagStatus: (id: string, status: OfficerFlag["status"]) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<PublicReport[]>(initialPublicReports);
  const [flags, setFlags] = useState<OfficerFlag[]>(initialOfficerFlags);

  const addReport = (report: PublicReport) => {
    setReports((prev) => [report, ...prev]);
    
    // Automatically create a discrepancy flag if it conflicts with low risk
    if (report.discrepancy) {
      const newFlag: OfficerFlag = {
        id: `FL-${Date.now()}`,
        type: "DISCREPANCY",
        relatedReportId: report.id,
        gridId: report.gridId,
        title: "FIELD-MODEL DISCREPANCY",
        description: "Local field evidence contradicts current model estimate (LOW RISK).",
        status: "NEW",
        timestamp: new Date().toISOString(),
        recommendedAction: "HUMAN VERIFICATION REQUIRED"
      };
      setFlags((prev) => [newFlag, ...prev]);
    }
  };

  const updateFlagStatus = (id: string, status: OfficerFlag["status"]) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
  };

  return (
    <DemoContext.Provider value={{ reports, addReport, flags, updateFlagStatus }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
