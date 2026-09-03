"use client";

import { useState, useEffect } from "react";
import { Search, Map as MapIcon, ChevronRight, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

export default function GridIntelligencePage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const [listData, setListData] = useState<any[]>([]);
  const [metadata, setMetadata] = useState({ total: 0, page: 1, pageSize: 50, totalPages: 1 });
  const [loadingList, setLoadingList] = useState(true);
  
  const [selectedGrid, setSelectedGrid] = useState<string | null>(null);
  const [gridDetail, setGridDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      setLoadingList(true);
      try {
        const res = await fetch(`/api/officer/grid-intelligence?search=${search}&page=${page}`);
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setListData(json.data || []);
        setMetadata(json.metadata || { total: 0, page: 1, pageSize: 50, totalPages: 1 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchList();
  }, [search, page]);

  useEffect(() => {
    if (!selectedGrid) {
      setGridDetail(null);
      return;
    }
    const fetchDetail = async () => {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await fetch(`/api/officer/grid-intelligence/${selectedGrid}`);
        if (!res.ok) throw new Error("Unable to load");
        const json = await res.json();
        setGridDetail(json);
      } catch (err: any) {
        setDetailError(err.message || "Failed to load");
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedGrid]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(query);
    setPage(1);
    setSelectedGrid(null);
  };

  const parseCentroid = (geometry: any) => {
    if (geometry?.type === "Polygon" && geometry.coordinates?.[0]?.[0]) {
      const coords = geometry.coordinates[0];
      const sum = coords.reduce((acc: any, val: any) => [acc[0] + val[0], acc[1] + val[1]], [0,0]);
      return { lon: sum[0] / coords.length, lat: sum[1] / coords.length };
    }
    return null;
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      {/* Left List Pane */}
      <div className={`${selectedGrid ? "hidden md:flex" : "flex"} w-full md:w-[450px] flex-shrink-0 flex-col bg-white border-r border-slate-200 z-10`}>
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-primary" />
            Grid Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">Complete analysis data for all grids</p>
          
          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <input 
              type="text" 
              placeholder="Search by Grid Code (e.g. GNG-)" 
              className="flex-1 text-sm border rounded-md px-3 py-2 outline-none focus:border-primary"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="bg-primary text-white px-3 py-2 rounded-md hover:bg-primary/90">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-4 text-center text-sm text-slate-500 animate-pulse">Loading grids...</div>
          ) : listData.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No records found</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {listData.map((item) => (
                <li key={item.grid_code}>
                  <button 
                    onClick={() => setSelectedGrid(item.grid_code)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedGrid === item.grid_code ? "bg-slate-50 border-l-2 border-primary" : ""}`}
                  >
                    <div>
                      <h3 className="font-mono font-bold text-slate-900">{item.grid_code}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {((metadata.page - 1) * metadata.pageSize) + 1} - {Math.min(metadata.page * metadata.pageSize, metadata.total)} of {metadata.total}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={metadata.page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-2 py-1 border rounded bg-white disabled:opacity-50"
            >
              Prev
            </button>
            <button 
              disabled={metadata.page >= metadata.totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-2 py-1 border rounded bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedGrid && (
        <div className="flex-1 bg-white overflow-y-auto flex flex-col relative z-20 w-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedGrid(null)}
                className="md:hidden p-2 -ml-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {selectedGrid}
              </h2>
            </div>
            <button onClick={() => setSelectedGrid(null)} className="hidden md:block p-1 hover:bg-slate-100 rounded text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {loadingDetail ? (
              <div className="text-center text-sm text-slate-500 animate-pulse mt-10">Loading detailed intelligence...</div>
            ) : detailError ? (
              <div className="text-center text-sm text-red-500 bg-red-50 p-4 rounded mt-10">Unable to load</div>
            ) : gridDetail ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Geography</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border">
                    {(() => {
                      const pt = parseCentroid(gridDetail.cell?.geometry);
                      return pt ? (
                        <>
                          <div>
                            <div className="text-xs text-slate-500">Latitude</div>
                            <div className="font-mono text-sm">{pt.lat.toFixed(5)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Longitude</div>
                            <div className="font-mono text-sm">{pt.lon.toFixed(5)}</div>
                          </div>
                          <div className="col-span-2">
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lon}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline text-sm inline-flex items-center gap-1 mt-1"
                            >
                              Open in Google Maps
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500">No geometry available</div>
                      )
                    })()}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Model Output</h3>
                  {gridDetail.model_output ? (
                    <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-slate-500">Calibrated Probability</div>
                          <div className="font-mono text-xl font-bold">{(gridDetail.model_output.calibrated_probability * 100).toFixed(4)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Model Name</div>
                          <div className="text-sm font-medium">{gridDetail.model_output.model_name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Version</div>
                          <div className="font-mono text-xs mt-1">{gridDetail.model_output.model_version}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border">No live prediction available from ML Engine</div>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Officer Assessment</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                    {gridDetail.officer_assessment ? (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Operational Risk Category</div>
                        <Badge variant={gridDetail.officer_assessment.risk_category === "VERY_HIGH" || gridDetail.officer_assessment.risk_category === "HIGH" ? "risk_high" : gridDetail.officer_assessment.risk_category === "MODERATE" ? "risk_moderate" : "risk_low"}>
                          {gridDetail.officer_assessment.risk_category}
                        </Badge>
                        <div className="text-xs text-slate-500 mt-2">
                          Set by {gridDetail.officer_assessment.model_name} ({gridDetail.officer_assessment.model_version})
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 mb-4">No operational risk category has been assessed yet.</div>
                    )}
                    
                    <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Assess Risk Category</label>
                        <select 
                          id="risk-assessment"
                          className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:border-primary bg-white"
                          defaultValue=""
                        >
                          <option value="" disabled>Select category...</option>
                          <option value="VERY_LOW">VERY LOW</option>
                          <option value="LOW">LOW</option>
                          <option value="MODERATE">MODERATE</option>
                          <option value="HIGH">HIGH</option>
                          <option value="VERY_HIGH">VERY HIGH</option>
                        </select>
                      </div>
                      <button 
                        onClick={async () => {
                          const select = document.getElementById("risk-assessment") as HTMLSelectElement;
                          if (!select.value) return;
                          
                          try {
                            const res = await fetch(`/api/officer/grid-intelligence/${selectedGrid}/assess`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ risk_category: select.value })
                            });
                            if (res.ok) {
                              const updated = await fetch(`/api/officer/grid-intelligence/${selectedGrid}`).then(r => r.json());
                              setGridDetail(updated);
                              alert("Assessment saved successfully.");
                            } else {
                              alert("Failed to save assessment.");
                            }
                          } catch (e) {
                            console.error(e);
                            alert("Error saving assessment.");
                          }
                        }}
                        className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
                      >
                        Save Assessment
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Operational State</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Public Release</div>
                      <Badge variant={gridDetail.operational.is_public ? "destructive" : "outline"}>
                        {gridDetail.operational.is_public ? "PUBLISHED" : "PRIVATE"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Active Flags</div>
                      <div className="text-sm font-bold">{gridDetail.operational.flags.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Linked Reports</div>
                      <div className="text-sm font-bold">{gridDetail.operational.advisories.length} advisories</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Officer Assignments</div>
                      <div className="text-sm font-bold">{gridDetail.operational.assignments.length} assignments</div>
                    </div>
                  </div>
                </section>

              </div>
            ) : null}
          </div>
        </div>
      )}
      
      {!selectedGrid && (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-100 z-0">
          <div className="text-center space-y-3">
            <MapIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-medium text-slate-400">Select a grid cell</h3>
            <p className="text-sm text-slate-400">Search and select a grid cell to view intelligence.</p>
          </div>
        </div>
      )}
    </div>
  );
}
