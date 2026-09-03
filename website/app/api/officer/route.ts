import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
      return NextResponse.json({ error: "Forbidden. Requires Officer access." }, { status: 403 });
    }

    const admin = createAdminClient();

    const [
      flags,
      reports,
      advisories,
      flagCount,
      reportCount,
      assignmentCount,
      advisoryCount,
      villagePriorityCount,
      roadPriorityCount,
    ] = await Promise.all([
      admin
        .from("decision_flags")
        .select("*")
        .neq("status", "RESOLVED")
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("public_reports")
        .select("*")
        .neq("status", "RESOLVED")
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("advisories")
        .select("*")
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false })
        .limit(5),
      admin.from("decision_flags").select("*", { count: "exact", head: true }).neq("status", "RESOLVED"),
      admin.from("public_reports").select("*", { count: "exact", head: true }).neq("status", "RESOLVED"),
      admin
        .from("officer_assignments")
        .select("*", { count: "exact", head: true })
        .eq("officer_id", user.id)
        .eq("assignment_status", "PENDING"),
      admin.from("advisories").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED"),
      admin.from("villages").select("*", { count: "exact", head: true }).neq("priority", "ROUTINE"),
      admin.from("road_segments").select("*", { count: "exact", head: true }).neq("priority", "ROUTINE"),
    ]);

    const errors = {
      flags: flags.error?.message ?? flagCount.error?.message ?? null,
      reports: reports.error?.message ?? reportCount.error?.message ?? null,
      advisories: advisories.error?.message ?? advisoryCount.error?.message ?? null,
      assignments: assignmentCount.error?.message ?? null,
      priorityAssets: villagePriorityCount.error?.message ?? roadPriorityCount.error?.message ?? null,
    };

    return NextResponse.json({
      flags: flags.data ?? [],
      reports: reports.data ?? [],
      advisories: advisories.data ?? [],
      counts: {
        flags: flagCount.count ?? 0,
        reports: reportCount.count ?? 0,
        assignments: assignmentCount.count ?? 0,
        advisories: advisoryCount.count ?? 0,
        priorityAssets: (villagePriorityCount.count ?? 0) + (roadPriorityCount.count ?? 0),
      },
      countDefinitions: {
        flags: "decision_flags where status != RESOLVED",
        reports: "public_reports where status != RESOLVED",
        assignments: "current officer assignments where assignment_status = PENDING",
        advisories: "advisories where status = PUBLISHED",
        priorityAssets: "villages and road_segments where priority != ROUTINE",
      },
      errors,
    });
  } catch (error) {
    console.error("Officer API Error:", error);
    return NextResponse.json({ error: "Officer dashboard data is unavailable" }, { status: 500 });
  }
}
