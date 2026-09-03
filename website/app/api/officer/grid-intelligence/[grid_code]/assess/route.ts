import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!profile || !["officer", "developer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { risk_category } = await request.json();
    if (!risk_category || !['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'].includes(risk_category)) {
      return NextResponse.json({ error: "Invalid risk category" }, { status: 400 });
    }

    // Insert Officer Assessment into risk_predictions
    // risk_predictions has NOT NULL constraint on risk_score, confidence, run_id
    const newId = uuidv4();
    const { data: assessmentRecord, error: insertError } = await supabaseAdmin
      .from('risk_predictions')
      .insert({
        id: newId,
        run_id: newId, // Use the new ID as run_id for manual assessment to satisfy constraint
        grid_code: grid_code,
        risk_score: 0, // Not applicable for officer assessment
        risk_category: risk_category,
        confidence: 1.0,
        model_name: "OFFICER_ASSESSMENT",
        model_version: "manual",
        input_snapshot: {
          actor: user.id,
          assessment: true
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error("Officer Assessment Insert Error:", insertError);
      return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
    }

    // Log the action
    await supabaseAdmin.from('audit_logs').insert({
      action: 'OFFICER_ASSESSMENT',
      entity_type: 'risk_predictions',
      entity_id: newId,
      actor_id: user.id,
      details: {
        grid_code,
        risk_category
      }
    });

    return NextResponse.json({ success: true, assessment: assessmentRecord });
  } catch (error) {
    console.error("Grid Detail Assess API Error:", error);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
