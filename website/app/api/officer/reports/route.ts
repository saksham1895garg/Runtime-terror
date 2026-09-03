import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error, count } = await supabase
      .from("public_reports")
      .select(
        `*, users!public_reports_reporter_id_fkey(name, email), report_media(*)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      reports: data ?? [],
      count: count ?? 0,
      countDefinition: "All public_reports visible to the authenticated officer or developer",
    });
  } catch (error) {
    console.error("Officer reports API error:", error);
    return NextResponse.json({ error: "Reports are unavailable" }, { status: 500 });
  }
}
