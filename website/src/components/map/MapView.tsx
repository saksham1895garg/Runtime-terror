"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, LayersControl, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Asset, GridCell } from '@/src/types';
import { Target, Search, X, Navigation, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useMap, useMapEvents } from 'react-leaflet';
import { DynamicGridLayer } from './DynamicGridLayer';

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
    }
  });

  if (!position) return null;

  return (
    <>
      <CircleMarker 
        center={position} 
        radius={8} 
        pathOptions={{ fillColor: '#2563eb', color: '#ffffff', weight: 3, fillOpacity: 1 }}
      >
        <Popup>Your Current Location</Popup>
      </CircleMarker>
      <CircleMarker 
        center={position} 
        radius={25} 
        pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.15 }}
      />
    </>
  );
}

function RecenterControl({ center, zoom, riskData }: { center: [number, number], zoom: number, riskData?: any }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  
  const handleRecenter = () => {
    if (riskData && riskData.features && riskData.features.length > 0) {
      try {
        const bounds = L.geoJSON(riskData).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
          return;
        }
      } catch (e) {
        console.warn("Failed to calculate bounds", e);
      }
    }
    map.flyTo(center, zoom, { duration: 1.5 });
  };
  
  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
    map.once('locationfound', () => setLocating(false));
    map.once('locationerror', () => {
      alert("Could not access your location. Please check browser permissions.");
      setLocating(false);
    });
  };
  
  return (
    <div className="leaflet-bottom leaflet-left mb-6 ml-4">
      <div className="leaflet-control leaflet-bar flex flex-col shadow-sm rounded-md overflow-hidden">
        <button 
          onClick={handleRecenter}
          className="bg-white w-8 h-8 flex items-center justify-center hover:bg-slate-100 transition-colors border-b border-slate-200"
          title="Recenter to active data"
        >
          <Target className="h-4 w-4 text-slate-700" />
        </button>
        <button 
          onClick={handleLocate}
          className={`bg-white w-8 h-8 flex items-center justify-center hover:bg-slate-100 transition-colors ${locating ? 'animate-pulse bg-blue-50' : ''}`}
          title="Find My Location"
        >
          <Navigation className="h-4 w-4 text-blue-600" />
        </button>
      </div>
    </div>
  );
}

function MapLegend() {
  const [expanded, setExpanded] = useState(true);

  if (!expanded) {
    return (
      <div className="absolute bottom-6 left-16 z-[1000] pointer-events-auto">
        <button 
          onClick={() => setExpanded(true)}
          className="bg-white/90 backdrop-blur-sm p-2 rounded-lg border shadow-md hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs font-semibold text-slate-700"
        >
          <Layers className="h-4 w-4" />
          Legend
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-16 z-[1000] pointer-events-auto">
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border shadow-[0_4px_20px_rgb(0,0,0,0.08)] text-xs min-w-[160px]">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold text-slate-800">Risk Level (500m Grid)</div>
          <button onClick={() => setExpanded(false)} className="text-slate-400 hover:text-slate-600">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1.5 text-slate-700 font-medium">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#dc2626] opacity-60 rounded-sm"></div> Very High</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#f97316] opacity-60 rounded-sm"></div> High</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#eab308] opacity-60 rounded-sm"></div> Moderate</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#4ade80] opacity-60 rounded-sm"></div> Low</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#10b981] opacity-60 rounded-sm"></div> Very Low</div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 font-semibold text-slate-800 mb-2">Map Features</div>
        <div className="space-y-1.5 text-slate-700 font-medium">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div> Village / Town</div>
          <div className="flex items-center gap-2"><div className="w-4 h-1 bg-slate-500"></div> Major Road</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 border border-white rounded-full"></div> Your Location</div>
        </div>
      </div>
    </div>
  );
}

function MapSearch({ villages = [], roads = [] }: { villages?: Asset[], roads?: Asset[] }) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const allAssets = [...villages, ...roads];
  const results = allAssets.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  const handleSelect = (asset: Asset) => {
    if (!asset.geometry) return;
    if (asset.geometry.type === 'Point') {
      const [lng, lat] = asset.geometry.coordinates;
      map.flyTo([lat, lng], 15, { duration: 1.5 });
    } else if (asset.geometry.type === 'LineString') {
      const coords = asset.geometry.coordinates;
      const bounds = L.latLngBounds(coords.map((c: any) => [c[1], c[0]]));
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
      <div className="relative">
        <div className="flex items-center bg-white/90 backdrop-blur-md border rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] px-3 py-2 w-64">
          <Search className="h-4 w-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search locations..." 
            className="bg-transparent border-none outline-none text-sm w-full"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(e.target.value.length > 0);
            }}
            onFocus={() => query.length > 0 && setIsOpen(true)}
          />
          {query && (
            <button type="button" className="ml-2 text-slate-400 hover:text-slate-600" onClick={() => { setQuery(""); setIsOpen(false); }} aria-label="Clear map search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-md border rounded-lg shadow-xl overflow-hidden py-1">
            {results.map(r => (
              <div 
                key={r.id} 
                className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700 flex justify-between items-center"
                onClick={() => handleSelect(r)}
              >
                <span className="font-medium truncate">{r.name}</span>
                <span className="text-[10px] text-slate-400 uppercase ml-2">{r.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function isCoordinatePair(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number" && Number.isFinite(value[0]) && Number.isFinite(value[1]);
}

function hasValidCoordinates(coordinates: unknown): boolean {
  if (isCoordinatePair(coordinates)) return true;
  return Array.isArray(coordinates) && coordinates.some(hasValidCoordinates);
}

function hasValidGeometry(feature: any) {
  return Boolean(feature?.geometry?.type && hasValidCoordinates(feature.geometry.coordinates));
}

interface MapViewProps {
  riskData?: any; // GeoJSON FeatureCollection
  villages?: Asset[];
  roads?: Asset[];
  onSelectCell?: (cell: GridCell) => void;
}

export default function MapView({ riskData, villages, roads, onSelectCell }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Fix leaflet marker icon issues in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-slate-100 animate-pulse" />;

  const safeRiskData = riskData?.type === "FeatureCollection" && Array.isArray(riskData.features)
    ? { ...riskData, features: riskData.features.filter(hasValidGeometry) }
    : null;
  const safeVillages = (villages ?? []).filter((asset) => hasValidGeometry({ geometry: asset.geometry }));
  const safeRoads = (roads ?? []).filter((asset) => hasValidGeometry({ geometry: asset.geometry }));

  const getStyle = (feature: any) => {
    const publicLevel = feature.properties?.public_risk_level;
    const category = feature.properties?.riskCategory ?? (
      publicLevel === 'CRITICAL' ? 'VERY_HIGH' : publicLevel === 'SAFE' ? 'VERY_LOW' : publicLevel
    );
    let color = '#cccccc';
    switch(category) {
      case 'VERY_LOW': color = '#10b981'; break;
      case 'LOW': color = '#4ade80'; break;
      case 'MODERATE': color = '#eab308'; break;
      case 'HIGH': color = '#f97316'; break;
      case 'VERY_HIGH': color = '#dc2626'; break;
    }
    
    return {
      fillColor: color,
      weight: 1,
      opacity: 0.3,
      color: 'white',
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (onSelectCell) {
      layer.on({
        click: () => {
          onSelectCell({ ...feature.properties, geometry: feature.geometry });
        },
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({
            weight: 2,
            color: '#000',
            fillOpacity: 0.8
          });
        },
        mouseout: (e) => {
          const l = e.target;
          l.setStyle(getStyle(feature));
        }
      });
    }
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[27.33, 88.61]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Light Map">
            <TileLayer
              url="/api/tiles/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
            />
          </LayersControl.BaseLayer>

          {safeRiskData && (
            <LayersControl.Overlay checked name="Risk Grid (500m)">
              <GeoJSON 
                key={`risk-grid-${safeRiskData.metadata?.renderedCellCount ?? safeRiskData.features.length}`}
                data={safeRiskData} 
                style={getStyle} 
                onEachFeature={onEachFeature}
              />
            </LayersControl.Overlay>
          )}

          <LayersControl.Overlay name="Universal Grid Lines (500m)">
            <DynamicGridLayer />
          </LayersControl.Overlay>

          {safeVillages.length > 0 && (
            <LayersControl.Overlay checked name="Villages">
              {/* Using a custom layer to render points */}
              <GeoJSON 
                data={{
                  type: "FeatureCollection",
                  features: safeVillages.map(v => ({ type: "Feature", geometry: v.geometry, properties: v }))
                } as any}
                pointToLayer={(feature, latlng) => {
                  return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "#3b82f6",
                    color: "#fff",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                  }).bindTooltip(feature.properties.name);
                }}
              />
            </LayersControl.Overlay>
          )}

          {safeRoads.length > 0 && (
            <LayersControl.Overlay checked name="Roads">
              <GeoJSON 
                data={{
                  type: "FeatureCollection",
                  features: safeRoads.map(r => ({ type: "Feature", geometry: r.geometry, properties: r }))
                } as any}
                style={{
                  color: "#64748b",
                  weight: 3,
                  opacity: 0.8
                }}
              />
            </LayersControl.Overlay>
          )}
        </LayersControl>
        
        <ZoomControl position="bottomright" />
        <RecenterControl center={[27.33, 88.61]} zoom={12} riskData={safeRiskData} />
        <MapSearch villages={safeVillages} roads={safeRoads} />
        <LocationMarker />
      </MapContainer>
      <MapLegend />
    </div>
  );
}
