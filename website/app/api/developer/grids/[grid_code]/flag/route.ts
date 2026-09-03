import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";



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

    // 2. Fetch grid_id from grid_code
    const { data: gridCell, error: gridError } = await supabase
      .from('analysis_grid_cells')
      .select('id')
      .eq('grid_code', grid_code)
      .single();

    if (gridError || !gridCell) {
      return NextResponse.json({ error: "Grid cell not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, title, description, type } = body;

    if (!["FLAG", "UNFLAG"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 3. Find existing active flag
    const { data: existingFlag } = await supabaseAdmin
      .from('decision_flags')
      .select('*')
      .eq('grid_id', gridCell.id)
      .eq('status', 'NEW')
      .maybeSingle();

    if (action === "FLAG") {
      if (existingFlag) {
        // Idempotent: already flagged
        return NextResponse.json({ success: true, flag: existingFlag, message: "Already flagged" }, { status: 200 });
      }

      // Create new flag
      const { data: newFlag, error: insertError } = await supabaseAdmin
        .from('decision_flags')
        .insert({
          type: type || 'SYSTEM_ANOMALY',
          grid_id: gridCell.id,
          title: title || `Developer Flag for ${grid_code}`,
          description: description || 'Flagged manually by developer.',
          status: 'NEW'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      await supabaseAdmin.from('audit_logs').insert({
          action: 'DEVELOPER_FLAG_CREATED',
          entity_type: 'decision_flags',
          entity_id: newFlag.id,
          actor_id: user.id,
          details: { grid_code, type: newFlag.type }
      });

      return NextResponse.json({ success: true, flag: newFlag }, { status: 201 });

    } else if (action === "UNFLAG") {
      if (!existingFlag) {
        // Idempotent: already unflagged/none active
        return NextResponse.json({ success: true, message: "No active flags to resolve" }, { status: 200 });
      }

      const { data: updatedFlag, error: updateError } = await supabaseAdmin
        .from('decision_flags')
        .update({ status: 'RESOLVED', updated_at: new Date().toISOString() })
        .eq('id', existingFlag.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await supabaseAdmin.from('audit_logs').insert({
          action: 'DEVELOPER_FLAG_RESOLVED',
          entity_type: 'decision_flags',
          entity_id: updatedFlag.id,
          actor_id: user.id,
          details: { grid_code }
      });

      return NextResponse.json({ success: true, flag: updatedFlag }, { status: 200 });
    }

  } catch (err: any) {
    console.error("Developer Flag API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
