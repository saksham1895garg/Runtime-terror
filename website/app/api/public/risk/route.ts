import { NextResponse } from "next/server";

import { parseGeometry } from "@/src/lib/geo";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;

async function fetchAllAnalysisCells() {
  const admin = createAdminClient();
  const rows: any[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("analysis_grid_cells")
      .select("grid_code, district, cell_size_m, geometry")
      .order("grid_code", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const [{ data: advisories, error: advisoryError }, { data: releaseActions, error: releaseActionError }, grids] = await Promise.all([
      admin
        .from("advisories")
        .select("id, title, type, severity, area, published_at")
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false }),
      admin
        .from("officer_actions")
        .select("entity_id, officer_id")
        .eq("entity_type", "ADVISORY")
        .eq("action", "PUBLISH"),
      fetchAllAnalysisCells(),
    ]);

    if (advisoryError) throw advisoryError;
    if (releaseActionError) throw releaseActionError;

    const officerIds = [...new Set((releaseActions ?? []).map((action) => action.officer_id).filter(Boolean))];
    const { data: officers, error: officerError } = officerIds.length
      ? await admin.from("users").select("id").in("id", officerIds).eq("role", "officer")
      : { data: [], error: null };
    if (officerError) throw officerError;
    const officerIdSet = new Set((officers ?? []).map((officer) => officer.id));
    const releasedAdvisoryIds = new Set(
      (releaseActions ?? [])
        .filter((action) => officerIdSet.has(action.officer_id))
        .map((action) => action.entity_id),
    );

    const severityRank: Record<string, number> = {
      SAFE: 0,
      LOW: 1,
      MODERATE: 2,
      HIGH: 3,
      CRITICAL: 4,
    };

    const features = grids.flatMap((grid) => {
      const geometry = parseGeometry(grid.geometry);
      if (!geometry) return [];

      // The current schema has no advisory/grid join table. A published advisory
      // is attached to a cell only when its recorded area is that exact grid code.
      const gridAdvisories = (advisories ?? []).filter(
        (advisory) => releasedAdvisoryIds.has(advisory.id) && advisory.area === grid.grid_code,
      );
      if (gridAdvisories.length === 0) return [];

      const publicRiskLevel = gridAdvisories.reduce(
        (highest, advisory) =>
          severityRank[advisory.severity] > severityRank[highest] ? advisory.severity : highest,
        "SAFE",
      );

      return [
        {
          type: "Feature",
          geometry,
          properties: {
            grid_code: grid.grid_code,
            district: grid.district,
            cell_size_m: grid.cell_size_m,
            public_risk_level: publicRiskLevel,
            advisories: gridAdvisories.map((advisory) => ({
              id: advisory.id,
              title: advisory.title,
              type: advisory.type,
              published_at: advisory.published_at,
            })),
          },
        },
      ];
    });

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features,
        metadata: {
          source: "analysis_grid_cells",
          publicReleaseRule: "PUBLISHED advisory with matching officer PUBLISH action and area equal to grid_code",
          analysisCellCount: grids.length,
          renderedCellCount: features.length,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Public Risk API Error:", error);
    return NextResponse.json({ error: "Public risk map is unavailable" }, { status: 500 });
  }
}
