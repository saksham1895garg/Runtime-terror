type GeoJsonGeometry = {
  type?: string;
  coordinates?: unknown;
};

export type Coordinate = {
  lat: number;
  lon: number;
};

export function parseGeometry(value: unknown): GeoJsonGeometry | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return parseGeometry(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== "object") return null;
  const geometry = value as GeoJsonGeometry;
  return geometry.type && geometry.coordinates ? geometry : null;
}

function collectCoordinatePairs(value: unknown, pairs: number[][]) {
  if (!Array.isArray(value)) return;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    pairs.push(value as number[]);
    return;
  }

  value.forEach((item) => collectCoordinatePairs(item, pairs));
}

export function getGeometryCentroid(value: unknown): Coordinate | null {
  const geometry = parseGeometry(value);
  if (!geometry) return null;

  const pairs: number[][] = [];
  collectCoordinatePairs(geometry.coordinates, pairs);
  if (pairs.length === 0) return null;

  const lons = pairs.map((pair) => pair[0]);
  const lats = pairs.map((pair) => pair[1]);

  return {
    lon: (Math.min(...lons) + Math.max(...lons)) / 2,
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
  };
}

export function distanceSquared(a: Coordinate, b: Coordinate) {
  const latitudeScale = Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  const lonDistance = (a.lon - b.lon) * latitudeScale;
  const latDistance = a.lat - b.lat;
  return lonDistance * lonDistance + latDistance * latDistance;
}
