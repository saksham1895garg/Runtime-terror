import { useEffect, useState } from 'react';
import { useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';

export function DynamicGridLayer() {
  const map = useMap();
  const [gridData, setGridData] = useState<any>(null);

  const drawGrid = () => {
    // 500m is approximately 0.005 degrees
    const GRID_SIZE = 0.005;
    
    // Only render grid when zoomed in (otherwise too many lines)
    if (map.getZoom() < 12) {
      setGridData(null);
      return;
    }

    const bounds = map.getBounds();
    // Expand bounds slightly so lines don't snap visibly at edges
    const north = bounds.getNorth() + GRID_SIZE;
    const south = bounds.getSouth() - GRID_SIZE;
    const east = bounds.getEast() + GRID_SIZE;
    const west = bounds.getWest() - GRID_SIZE;

    const startLat = Math.floor(south / GRID_SIZE) * GRID_SIZE;
    const startLng = Math.floor(west / GRID_SIZE) * GRID_SIZE;

    const features = [];

    // Horizontal lines
    for (let lat = startLat; lat <= north; lat += GRID_SIZE) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [[west, lat], [east, lat]]
        }
      });
    }

    // Vertical lines
    for (let lng = startLng; lng <= east; lng += GRID_SIZE) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [[lng, south], [lng, north]]
        }
      });
    }

    setGridData({
      type: "FeatureCollection",
      features
    });
  };

  useEffect(() => {
    drawGrid();
  }, [map]);

  useMapEvents({
    moveend: () => drawGrid(),
    zoomend: () => drawGrid()
  });

  if (!gridData) return null;

  return (
    <GeoJSON 
      key={map.getBounds().toBBoxString() + map.getZoom()} 
      data={gridData} 
      style={{
        color: '#94a3b8',
        weight: 1,
        opacity: 0.4,
        dashArray: "4, 4"
      }} 
      interactive={false}
    />
  );
}
