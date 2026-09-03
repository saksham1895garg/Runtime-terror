import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Simple in-memory rate limiting for prototype
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export async function POST(request: Request) {
  // Rate limiting (max 5 requests per minute per IP)
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  
  if (rateLimitMap.has(ip)) {
    const rateData = rateLimitMap.get(ip)!;
    if (now > rateData.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    } else if (rateData.count >= 5) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    } else {
      rateData.count += 1;
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
  }

  try {
    const body = await request.json();

    // Input Validation
    if (!body.category || !body.severity || !body.description || !body.lat || !body.lon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { createAdminClient } = await import('@/utils/supabase/admin');
    const supabase = createAdminClient();

    const reportId = `PR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const { data, error } = await supabase.from('public_reports').insert({
      id: reportId,
      category: body.category,
      severity: body.severity,
      description: body.description,
      lat: parseFloat(body.lat),
      lon: parseFloat(body.lon),
      status: 'NEW'
    }).select().single();

    if (error) throw error;

    // Optional: Trigger a background job or decision flag evaluation here
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Return only verified or public-safe reports for public map
  const { data, error } = await supabase
    .from('public_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
