import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";



export async function POST(
  request: Request,
  { params }: { params: Promise<{ grid_code: string }> }
) {
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );
    const { grid_code } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorize role (Developer)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'developer') {
      return NextResponse.json({ error: "Forbidden. Requires Developer access." }, { status: 403 });
    }

    // 3. Parse override
    const body = await request.json();
    const { run_id, risk_score, risk_category, reason } = body;

    if (!run_id || risk_score === undefined || !risk_category) {
      return NextResponse.json({ error: "Missing required override fields" }, { status: 400 });
    }

    // 4. Verify original prediction exists
    const { data: originalPrediction, error: fetchError } = await supabase
      .from('risk_predictions')
      .select('*')
      .eq('run_id', run_id)
      .eq('grid_code', grid_code)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !originalPrediction) {
      return NextResponse.json({ error: "Original prediction not found" }, { status: 404 });
    }

    // 5. Insert Override as a new risk_predictions record (Append Only)
    // with explicit provenance
    const newId = uuidv4();
    const { data: overrideRecord, error: insertError } = await supabaseAdmin
      .from('risk_predictions')
      .insert({
        id: newId,
        run_id: run_id,
        grid_code: grid_code,
        risk_score: risk_score,
        risk_category: risk_category,
        confidence: originalPrediction.confidence,
        model_name: originalPrediction.model_name,
        model_version: originalPrediction.model_version,
        input_snapshot: {
          developer_override: true,
          actor: user.id,
          reason: reason || "Developer manual override",
          original_prediction_id: originalPrediction.id
        },
        explanation: {
          note: `DEVELOPER OVERRIDE: ${reason || ''}`,
          original_explanation: originalPrediction.explanation
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert override error:", insertError);
      return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
    }

    // 6. Audit Logging (using Service Role for secure append-only logs)
    await supabaseAdmin.from('audit_logs').insert({
      action: 'DEVELOPER_OVERRIDE',
      entity_type: 'risk_predictions',
      entity_id: newId,
      actor_id: user.id,
      details: {
        run_id,
        grid_code,
        original_prediction_id: originalPrediction.id,
        new_risk_score: risk_score,
        new_risk_category: risk_category
      }
    });

    return NextResponse.json({ success: true, prediction: overrideRecord }, { status: 201 });
  } catch (err: any) {
    console.error("Developer Override API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
