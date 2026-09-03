import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getGeometryCentroid, distanceSquared, parseGeometry } from "@/src/lib/geo";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;

async function fetchAllRows(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>,
) {
  const rows: any[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

function confidenceLabel(value: unknown) {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return "LOW";
  if (confidence >= 0.9) return "HIGH";
  if (confidence >= 0.7) return "MODERATE";
  return "LOW";
}

function susceptibilityLabel(value: unknown) {
  const susceptibility = Number(value);
  if (!Number.isFinite(susceptibility)) return "LOW";
  if (susceptibility >= 0.75) return "VERY_HIGH";
  if (susceptibility >= 0.5) return "HIGH";
  if (susceptibility >= 0.25) return "MODERATE";
  return "LOW";
}

function nearestName(
  point: { lat: number; lon: number },
  assets: Array<{ name: string; point: { lat: number; lon: number } }>,
) {
  return assets.reduce<{ name: string; distance: number } | null>((nearest, asset) => {
    const distance = distanceSquared(point, asset.point);
    return !nearest || distance < nearest.distance ? { name: asset.name, distance } : nearest;
  }, null)?.name;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["officer", "developer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const [grids, predictions, villagesResult, roadsResult] = await Promise.all([
      fetchAllRows((from, to) =>
        admin
          .from("analysis_grid_cells")
          .select("grid_code, district, cell_size_m, geometry, created_at")
          .order("grid_code", { ascending: true })
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        admin
          .from("risk_predictions")
          .select(
            "id, run_id, grid_code, risk_score, risk_category, confidence, model_name, model_version, generated_at, input_snapshot, explanation",
          )
          .order("generated_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      ),
      admin.from("villages").select("name, lat, lon"),
      admin.from("road_segments").select("name, geometry"),
    ]);

    const latestPredictionByGrid = new Map<string, any>();
    predictions.forEach((prediction) => {
      if (!latestPredictionByGrid.has(prediction.grid_code)) {
        latestPredictionByGrid.set(prediction.grid_code, prediction);
      }
    });

    const villagePoints = (villagesResult.data ?? [])
      .filter((village) => Number.isFinite(Number(village.lat)) && Number.isFinite(Number(village.lon)))
      .map((village) => ({
        name: village.name,
        point: { lat: Number(village.lat), lon: Number(village.lon) },
      }));

    const roadPoints = (roadsResult.data ?? [])
      .map((road) => ({ name: road.name, point: getGeometryCentroid(road.geometry) }))
      .filter((road): road is { name: string; point: { lat: number; lon: number } } => Boolean(road.point));

    const features = grids.flatMap((grid) => {
      const geometry = parseGeometry(grid.geometry);
      const centroid = getGeometryCentroid(geometry);
      if (!geometry || !centroid) return [];

      const prediction = latestPredictionByGrid.get(grid.grid_code);
      const input = prediction?.input_snapshot ?? {};
      const riskScore = prediction ? Number(prediction.risk_score) : null;
      const explanation = Array.isArray(prediction?.explanation) ? prediction.explanation : [];
      const nearestVillage = nearestName(centroid, villagePoints);
      const nearestRoad = nearestName(centroid, roadPoints);

      return [
        {
          type: "Feature",
          geometry,
          properties: {
            id: grid.grid_code,
            gridCode: grid.grid_code,
            district: grid.district,
            cellSizeM: grid.cell_size_m,
            latitude: centroid.lat,
            longitude: centroid.lon,
            riskScore,
            riskCategory: prediction?.risk_category ?? "UNASSESSED",
            modelEstimate: riskScore === null ? null : riskScore / 100,
            rainfall24h: Number(input.rainfall_24h ?? 0),
            rainfall72h: Number(input.rainfall_72h ?? 0),
            rainfall7d: Number(input.rainfall_7d ?? 0),
            slope: Number(input.slope ?? 0),
            elevation: Number(input.elevation ?? 0),
            aspect: Number.isFinite(Number(input.aspect)) ? `${Number(input.aspect).toFixed(1)}°` : "Unavailable",
            susceptibility: susceptibilityLabel(input.susceptibility),
            landCover: input.land_cover ?? "Unavailable",
            confidence: confidenceLabel(prediction?.confidence),
            explanation,
            modelVersion: prediction?.model_version ?? null,
            generatedAt: prediction?.generated_at ?? null,
            nearbyVillages: nearestVillage ? [nearestVillage] : [],
            nearbyRoads: nearestRoad ? [nearestRoad] : [],
            dataSource: prediction ? "risk_predictions" : "analysis_grid_cells",
          },
        },
      ];
    });

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features,
        metadata: {
          analysisCellCount: grids.length,
          renderedCellCount: features.length,
          predictedCellCount: latestPredictionByGrid.size,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Grid API Error:", error);
    return NextResponse.json({ error: "Risk grid is unavailable" }, { status: 500 });
  }
}
