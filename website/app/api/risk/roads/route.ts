import { NextResponse } from 'next/server';
import { getGeometryCentroid, parseGeometry } from '@/src/lib/geo';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  // Query the 'road_segments' table (schema: id, name, geometry, risk_score, priority, is_demo)
  const { data, error } = await supabase
    .from('road_segments')
    .select('id, name, geometry, risk_score, priority, is_demo')
    .order('risk_score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedData = (data ?? []).map(road => {
    const geometry = parseGeometry(road.geometry);
    const point = getGeometryCentroid(geometry);

    return {
      id: road.id,
      name: road.name,
      type: 'ROAD' as const,
      lat: point?.lat ?? null,
      lng: point?.lon ?? null,
      geometry,
      riskScore: Number(road.risk_score),
      priority: road.priority ?? 'ROUTINE',
      isDemo: road.is_demo ?? false,
    };
  });

  return NextResponse.json(formattedData);
}
