import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorize role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'officer' && profile.role !== 'developer')) {
      return NextResponse.json({ error: "Forbidden. Requires Officer access." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // 3. Fetch assignments (Developers see all, Officers see their own)
    let query = supabaseAdmin.from("officer_assignments").select(`*`).order("created_at", { ascending: false });

    if (profile.role === 'officer') {
      query = query.eq("officer_id", user.id);
    }

    if (statusFilter) {
      query = query.eq("assignment_status", statusFilter);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error("Database error fetching assignments:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (assignments && assignments.length > 0) {
      const runIds = [...new Set(assignments.map(a => a.run_id))];
      const gridCodes = [...new Set(assignments.map(a => a.grid_code))];
      
      const { data: predictions } = await supabaseAdmin
        .from('risk_predictions')
        .select('*')
        .in('run_id', runIds)
        .in('grid_code', gridCodes);
        
      if (predictions) {
        assignments.forEach(a => {
          a.risk_predictions = predictions.find(p => p.run_id === a.run_id && p.grid_code === a.grid_code) || null;
        });
      }
    }

    return NextResponse.json(assignments || []);
  } catch (err: any) {
    console.error("Officer Assignments API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
