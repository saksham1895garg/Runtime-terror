import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";



export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );
    const { id } = await params;
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

    if (!profile || profile.role !== 'officer') {
      // Developers shouldn't acknowledge/complete officer assignments directly
      return NextResponse.json({ error: "Forbidden. Requires Officer access." }, { status: 403 });
    }

    // 3. Check if assignment exists and belongs to this officer
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('officer_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.officer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden. Assignment belongs to another officer." }, { status: 403 });
    }

    // 4. Parse action
    const body = await request.json();
    const { action, notes } = body;

    if (!["ACKNOWLEDGE", "COMPLETE", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Validate state transition
    if (action === "ACKNOWLEDGE" && assignment.assignment_status !== "PENDING") {
      return NextResponse.json({ error: "Can only acknowledge PENDING assignments" }, { status: 400 });
    }
    if (action === "COMPLETE" && assignment.assignment_status !== "ACKNOWLEDGED") {
      return NextResponse.json({ error: "Can only complete ACKNOWLEDGED assignments" }, { status: 400 });
    }
    if (action === "DECLINE" && assignment.assignment_status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot decline a COMPLETED assignment" }, { status: 400 });
    }

    // 5. Apply transition
    const updates: any = {
      assignment_status: action === "ACKNOWLEDGE" ? "ACKNOWLEDGED" 
        : action === "COMPLETE" ? "COMPLETED" 
        : "PENDING" // DECLINE just returns it to PENDING for reassignment, or maybe a DECLINED state? The API docs say PENDING|ACKNOWLEDGED|COMPLETED. 
        // Let's use assignment_status logic carefully. Wait, is there a DECLINED status? Let's just set it to DECLINED or clear the officer_id.
    };

    if (action === "ACKNOWLEDGE") updates.acknowledged_at = new Date().toISOString();
    if (action === "COMPLETE") updates.completed_at = new Date().toISOString();
    
    // If decline, unassign and set back to pending for auto-assignment to pick up later?
    if (action === "DECLINE") {
        updates.officer_id = null;
        updates.assignment_status = "PENDING";
        updates.acknowledged_at = null;
    }

    const { error: updateError } = await supabaseAdmin
      .from('officer_assignments')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error("Error updating assignment:", updateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 6. Record Audit / Action
    await supabaseAdmin
      .from('officer_actions')
      .insert({
        officer_id: user.id,
        entity_type: 'ASSIGNMENT',
        entity_id: id,
        action: action,
        notes: notes || null
      });

    return NextResponse.json({ success: true, new_status: updates.assignment_status });
  } catch (err: any) {
    console.error("Officer Assignment Update Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
