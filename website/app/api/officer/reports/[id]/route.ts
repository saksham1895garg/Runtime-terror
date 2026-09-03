import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const { data, error } = await supabase
      .from("public_reports")
      .select(`*, users!public_reports_reporter_id_fkey(name, email), report_media(*), officer_actions(*)`)
      .eq("id", id)
      .single();

    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (error) throw error;

    let prediction = null;
    if (data.nearest_grid_cell) {
      try {
        const { fetchML } = await import("@/utils/api/mlBackend");
        const mlRes = await fetchML(`/predictions/grid/${data.nearest_grid_cell}/latest`);
        if (mlRes && mlRes.data) {
          prediction = mlRes.data;
        }
      } catch (err: any) {
        if (err.status !== 404) {
           console.error("FastAPI fetch failed for prediction:", err);
        }
      }
    }

    return NextResponse.json({ report: data, prediction });
  } catch (error) {
    console.error("Officer report detail API error:", error);
    return NextResponse.json({ error: "Report detail is unavailable" }, { status: 500 });
  }
}

const ACTION_TO_STATUS = {
  REVIEW: "UNDER_REVIEW",
  RESOLVE: "RESOLVED",
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "officer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const action = String((await request.json()).action ?? "") as keyof typeof ACTION_TO_STATUS;
    const targetStatus = ACTION_TO_STATUS[action];
    if (!targetStatus) return NextResponse.json({ error: "Unsupported report action" }, { status: 400 });

    const { data: report, error: updateError } = await supabase
      .from("public_reports")
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) throw updateError;

    const { error: actionError } = await supabase.from("officer_actions").insert({
      officer_id: user.id,
      entity_type: "REPORT",
      entity_id: id,
      action,
    });
    if (actionError) {
      await supabase.from("public_reports").update({ status: report.status, updated_at: new Date().toISOString() }).eq("id", id);
      throw actionError;
    }
    return NextResponse.json({ report });
  } catch (error) {
    console.error("Officer report action API error:", error);
    return NextResponse.json({ error: "Report action could not be recorded" }, { status: 500 });
  }
}
