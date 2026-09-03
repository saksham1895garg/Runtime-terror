import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

const ACTION_TO_STATUS = {
  REVIEW: "UNDER_REVIEW",
  RESOLVE: "RESOLVED",
  DISMISS: "DISMISSED",
} as const;

async function getContext() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Unauthorized", status: 401 } as const;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["officer", "developer"].includes(profile.role)) {
    return { error: "Forbidden", status: 403 } as const;
  }

  return { supabase, user, profile };
}

async function loadFlagDetail(supabase: any, id: string) {
  const { data: flag, error } = await supabase
    .from("decision_flags")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { flag: null, report: null, error };

  const { data: actions } = await supabase
    .from("officer_actions")
    .select("*")
    .eq("entity_id", id)
    .eq("entity_type", "FLAG")
    .order("created_at", { ascending: false });
    
  flag.officer_actions = actions || [];

  if (!flag.related_report_id) return { flag, report: null, error: null };

  const { data: report, error: reportError } = await supabase
    .from("public_reports")
    .select("*, report_media(*)")
    .eq("id", flag.related_report_id)
    .maybeSingle();

  return { flag, report: report ?? null, error: reportError };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getContext();
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { id } = await params;
    const detail = await loadFlagDetail(context.supabase, id);
    if (detail.error?.code === "PGRST116") {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }
    if (detail.error) throw detail.error;

    return NextResponse.json({ flag: detail.flag, report: detail.report });
  } catch (error) {
    console.error("Officer flag detail API error:", error);
    return NextResponse.json({ error: "Flag detail is unavailable" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getContext();
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { id } = await params;
    const body = await request.json();
    const action = String(body.action ?? "") as keyof typeof ACTION_TO_STATUS;
    const targetStatus = ACTION_TO_STATUS[action];

    if (!targetStatus) {
      return NextResponse.json({ error: "Unsupported flag action" }, { status: 400 });
    }

    const { data: current, error: currentError } = await context.supabase
      .from("decision_flags")
      .select("*")
      .eq("id", id)
      .single();

    if (currentError?.code === "PGRST116") {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }
    if (currentError) throw currentError;

    if (["RESOLVED", "DISMISSED"].includes(current.status) && current.status !== targetStatus) {
      return NextResponse.json({ error: "A closed flag cannot transition to another state" }, { status: 409 });
    }

    if (current.status === targetStatus) {
      const detail = await loadFlagDetail(context.supabase, id);
      return NextResponse.json({ flag: detail.flag, report: detail.report });
    }

    const { data: updated, error: updateError } = await context.supabase
      .from("decision_flags")
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", current.status)
      .select("*")
      .single();

    if (updateError) throw updateError;

    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 1000) : null;
    const { error: actionError } = await context.supabase.from("officer_actions").insert({
      officer_id: context.user.id,
      entity_type: "FLAG",
      entity_id: id,
      action,
      notes,
    });

    if (actionError) {
      const { error: rollbackError } = await context.supabase
        .from("decision_flags")
        .update({ status: current.status, updated_at: current.updated_at })
        .eq("id", id)
        .eq("status", targetStatus);
      if (rollbackError) console.error("Flag audit rollback failed:", rollbackError);
      throw actionError;
    }

    const detail = await loadFlagDetail(context.supabase, id);
    return NextResponse.json({ flag: updated, report: detail.report });
  } catch (error) {
    console.error("Officer flag action API error:", error);
    return NextResponse.json({ error: "Flag action could not be recorded" }, { status: 500 });
  }
}
