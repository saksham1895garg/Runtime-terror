"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GridDetailDrawer } from "@/src/components/dashboard/GridDetailDrawer";
import { AssetDrawer } from "@/src/components/dashboard/AssetDrawer";
import { Asset, GridCell } from "@/src/types";
import { AnimatePresence, motion } from "framer-motion";

const MapView = dynamic(() => import("@/src/components/map/MapView"), { ssr: false });

export default function FullMapPage() {
  const [riskGrid, setRiskGrid] = useState<any>(null);
  const [villages, setVillages] = useState<Asset[]>([]);
  const [roads, setRoads] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedGridCell, setSelectedGridCell] = useState<GridCell | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/risk/grid").then(r => r.json()),
      fetch("/api/risk/villages").then(r => r.json()),
      fetch("/api/risk/roads").then(r => r.json()),
    ]).then(([grid, v, r]) => {
      setRiskGrid(grid);
      setVillages(v);
      setRoads(r);
    });
  }, []);

  const handleSelectCell = (cell: GridCell) => {
    setSelectedAsset(null);
    setSelectedGridCell(cell);
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-slate-900">
      <MapView 
        riskData={riskGrid} 
        villages={villages} 
        roads={roads} 
        onSelectCell={handleSelectCell}
      />

      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute top-0 right-0 h-full w-full md:w-auto z-[500] shadow-[0_0_40px_rgba(0,0,0,0.2)]"
          >
            <AssetDrawer 
              asset={selectedAsset} 
              riskCell={
                riskGrid?.features.find((f: any) => 
                  f.properties.riskScore >= selectedAsset.riskScore - 5
                )?.properties
              }
              onClose={() => setSelectedAsset(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGridCell && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute top-0 right-0 h-full w-full md:w-auto z-[500] shadow-[0_0_40px_rgba(0,0,0,0.2)]"
          >
            <GridDetailDrawer 
              cell={selectedGridCell} 
              onClose={() => setSelectedGridCell(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
