import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";



export async function POST(request: Request) {
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );
    const authHeader = request.headers.get("Authorization");
    // Verify a shared internal secret to prevent unauthorized public access
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
       // Allow Developer cookie auth as fallback for testing
       // But typically this is called by backend webhook, so it needs the secret
       // We'll enforce this later or allow it to be called from the NextJS frontend via developer session.
       // Let's implement a dual check: either valid developer session OR internal secret.
       
       const { createClient } = await import("@/utils/supabase/server");
       const { cookies } = await import("next/headers");
       const cookieStore = await cookies();
       const supabase = createClient(cookieStore);
       const { data: { user } } = await supabase.auth.getUser();
       let isDeveloper = false;
       
       if (user) {
         const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
         if (profile && profile.role === 'developer') {
           isDeveloper = true;
         }
       }
       
       if (!isDeveloper && authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
       }
    }

    const body = await request.json();
    const { run_id, grid_code } = body;

    if (!run_id || !grid_code) {
      return NextResponse.json({ error: "Missing run_id or grid_code" }, { status: 400 });
    }

    // 1. Idempotency Check: Check if an ACTIVE assignment already exists for this grid_code
    const { data: existingAssignment, error: existingError } = await supabaseAdmin
      .from('officer_assignments')
      .select('*')
      .eq('grid_code', grid_code)
      .in('assignment_status', ['PENDING', 'ACKNOWLEDGED'])
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingAssignment) {
      // Already actively assigned. Return 200 OK.
      return NextResponse.json({ success: true, message: "Already actively assigned", assignment: existingAssignment }, { status: 200 });
    }

    // 2. Fetch all eligible officers
    const { data: officers, error: officersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'officer');

    if (officersError || !officers || officers.length === 0) {
      return NextResponse.json({ error: "No available officers found" }, { status: 404 });
    }

    // 3. Deterministic load balancing: find officer with fewest PENDING/ACKNOWLEDGED assignments
    // Note: since this is an MVP, we do a quick count per officer. 
    // In production with high concurrency, this could be a SQL function or transaction.
    const { data: activeAssignments, error: activeError } = await supabaseAdmin
      .from('officer_assignments')
      .select('officer_id')
      .in('assignment_status', ['PENDING', 'ACKNOWLEDGED']);

    if (activeError) throw activeError;

    const assignmentCounts: Record<string, number> = {};
    officers.forEach(o => assignmentCounts[o.id] = 0);

    if (activeAssignments) {
        activeAssignments.forEach(a => {
            if (assignmentCounts[a.officer_id] !== undefined) {
                assignmentCounts[a.officer_id]++;
            }
        });
    }

    // Sort officers by count, then alphabetically by ID to ensure determinism
    let selectedOfficerId = officers[0].id;
    let minCount = Infinity;

    for (const officer of officers) {
        const count = assignmentCounts[officer.id];
        if (count < minCount || (count === minCount && officer.id < selectedOfficerId)) {
            minCount = count;
            selectedOfficerId = officer.id;
        }
    }

    // 4. Create Assignment
    const { data: newAssignment, error: insertError } = await supabaseAdmin
      .from('officer_assignments')
      .insert({
        run_id,
        grid_code,
        officer_id: selectedOfficerId,
        assignment_status: 'PENDING',
        assignment_reason: 'Automated high risk assignment'
      })
      .select()
      .single();

    if (insertError) {
       // Could be a race condition inserting at same time. Handle as 409 if unique constraint exists.
       if (insertError.code === '23505') { // postgres unique violation
           return NextResponse.json({ error: "Conflict: assignment already exists." }, { status: 409 });
       }
       throw insertError;
    }

    return NextResponse.json({ success: true, assignment: newAssignment }, { status: 201 });

  } catch (err: any) {
    console.error("Auto Assignment API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
