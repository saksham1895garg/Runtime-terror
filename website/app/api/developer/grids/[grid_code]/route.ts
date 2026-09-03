import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ grid_code: string }> }
) {
  try {
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

    // 3. Fetch grid_cell
    const { data: gridCell, error: gridError } = await supabase
      .from('analysis_grid_cells')
      .select('*')
      .eq('grid_code', grid_code)
      .single();

    if (gridError) {
      if (gridError.code === 'PGRST116') { // Not found
          return NextResponse.json({ error: "Grid cell not found" }, { status: 404 });
      }
      throw gridError;
    }

    // 4. Fetch risk predictions from FastAPI instead of direct DB
    let predictions: any[] = [];
    try {
      const { fetchML } = await import('@/utils/api/mlBackend');
      const mlResponse = await fetchML(`/predictions/grid/${grid_code}/latest`);
      if (mlResponse && mlResponse.data) {
        predictions = [mlResponse.data];
      }
    } catch (mlErr: any) {
      if (mlErr.status !== 404) {
        console.error("FastAPI fetch failed for prediction:", mlErr);
      }
    }

    // 5. Fetch assignments
    const { data: assignments } = await supabase
      .from('officer_assignments')
      .select('*')
      .eq('grid_code', grid_code)
      .order('created_at', { ascending: false });

    // 6. Fetch flags
    const { data: flags } = await supabase
      .from('decision_flags')
      .select('*')
      .eq('grid_id', gridCell.id) // Assuming decision_flags uses the UUID id, not grid_code
      .order('created_at', { ascending: false });

    return NextResponse.json({
      grid_cell: gridCell,
      predictions: predictions || [],
      assignments: assignments || [],
      flags: flags || []
    });

  } catch (err: any) {
    console.error("Developer Grid API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
