import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { fetchML, MLError } from "@/utils/api/mlBackend";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate & Authorize Developer
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'developer') {
      return NextResponse.json({ error: "Forbidden. Requires Developer access." }, { status: 403 });
    }

    const body = await request.json();
    const { grid_code } = body;

    if (!grid_code) {
      return NextResponse.json({ error: "Missing grid_code" }, { status: 400 });
    }

    // 2. Trigger Prediction
    const mlResponse = await fetchML('/predictions/test', {
      method: 'POST',
      body: JSON.stringify({ grid_code })
    });

    const predictionData = mlResponse.data;

    // 3. Auto-Assignment (if risk is high)
    if (predictionData && predictionData.risk_category === 'HIGH') {
        const autoAssignUrl = new URL('/api/internal/assignments/auto', request.url);
        try {
            // We use fetch without blocking the response immediately if we wanted to, 
            // but we'll await it to ensure consistency for now.
            const assignRes = await fetch(autoAssignUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`
                },
                body: JSON.stringify({
                    run_id: predictionData.run_id,
                    grid_code: grid_code
                })
            });
            
            if (!assignRes.ok) {
                console.warn("Auto-assignment failed:", await assignRes.text());
            }
        } catch (e) {
            console.error("Failed to trigger auto-assignment", e);
        }
    }

    return NextResponse.json(predictionData, { status: 200 });

  } catch (err: any) {
    if (err instanceof MLError) {
       // Convert MLError to standard JSON response
       return NextResponse.json({ 
           error: "ML Backend Error", 
           details: err.details || err.message
       }, { status: err.status });
    }

    console.error("Prediction Trigger API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
