import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  // Query the 'villages' table (schema: id, name, lat, lon, risk_score, priority, exposure, district, is_demo)
  const { data, error } = await supabase
    .from('villages')
    .select('id, name, lat, lon, risk_score, priority, exposure, district, is_demo')
    .order('risk_score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedData = (data ?? []).map(village => ({
    id: village.id,
    name: village.name,
    type: 'VILLAGE' as const,
    lat: Number(village.lat),
    lng: Number(village.lon),
    geometry: {
      type: 'Point',
      coordinates: [Number(village.lon), Number(village.lat)],
    },
    riskScore: Number(village.risk_score),
    priority: village.priority ?? 'ROUTINE',
    population: village.exposure ?? 0,
    district: village.district ?? null,
    isDemo: village.is_demo ?? false,
  }));

  return NextResponse.json(formattedData);
}
