import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ grid_code: string }> }
) {
  try {
    const { grid_code } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!profile || !["officer", "developer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch Supabase Data (Geometry, Operatonal State)
    const { data: cell, error: cellError } = await supabase
      .from("analysis_grid_cells")
      .select("*")
      .eq("grid_code", grid_code)
      .single();

    if (cellError) {
      if (cellError.code === "PGRST116") return NextResponse.json({ error: "Grid not found" }, { status: 404 });
      throw cellError;
    }

    const [assignmentsRes, flagsRes, advisoriesRes] = await Promise.all([
      supabase.from("officer_assignments").select("*").eq("grid_id", grid_code),
      supabase.from("decision_flags").select("*").eq("grid_id", grid_code),
      supabase.from("advisories").select("*").eq("area", grid_code)
    ]);

    // 2. Fetch FastAPI Data (ML State)
    let modelOutput = null;
    try {
      const mlRes = await fetch(`http://127.0.0.1:18000/predictions/grid/${grid_code}/live`, {
        cache: "no-store",
        next: { revalidate: 0 }
      });
      if (mlRes.ok) {
        modelOutput = await mlRes.json();
      }
    } catch (e) {
      console.warn("FastAPI live prediction fetch failed:", e);
    }

    // 3. Fetch Officer Assessment from risk_predictions
    const { data: assessmentData } = await supabase
      .from("risk_predictions")
      .select("*")
      .eq("grid_code", grid_code)
      .eq("model_name", "OFFICER_ASSESSMENT")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      cell,
      model_output: modelOutput ? {
        calibrated_probability: modelOutput.calibrated_probability,
        model_name: modelOutput.model_name,
        model_version: modelOutput.model_version
      } : null,
      officer_assessment: assessmentData ? {
        risk_category: assessmentData.risk_category,
        model_name: assessmentData.model_name,
        model_version: assessmentData.model_version
      } : null,
      operational: {
        assignments: assignmentsRes.data || [],
        flags: flagsRes.data || [],
        advisories: advisoriesRes.data || [],
        is_public: (advisoriesRes.data || []).some((a: any) => a.status === "PUBLISHED")
      }
    });

  } catch (error) {
    console.error("Grid Detail API Error:", error);
    return NextResponse.json({ error: "Failed to fetch grid detail" }, { status: 500 });
  }
}
