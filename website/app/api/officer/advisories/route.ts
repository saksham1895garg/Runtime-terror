import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
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

    if (!profile || profile.role !== 'officer') {
      return NextResponse.json({ error: "Forbidden. Requires Officer access." }, { status: 403 });
    }

    // 3. Parse and validate body
    const body = await request.json();
    const { type, title, description, severity, area } = body;

    if (!title || !description || !severity || !area) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
    }

    // 4. Insert advisory
    const { data: advisory, error: insertError } = await supabaseAdmin
      .from('advisories')
      .insert({
        type: type || 'INFORMATIONAL',
        title,
        description,
        severity,
        area,
        status: 'PUBLISHED',
        published_by: user.id,
        published_at: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error("Advisory Insert Error:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 5. Record Officer Action for provenance
    const { error: actionError } = await supabaseAdmin
      .from('officer_actions')
      .insert({
        officer_id: user.id,
        entity_type: 'ADVISORY',
        entity_id: advisory.id,
        action: 'PUBLISH',
        notes: 'Advisory explicitly released to public'
      });
    if (actionError) {
      await supabaseAdmin.from('advisories').update({ status: 'DRAFT', published_by: null, published_at: null }).eq('id', advisory.id);
      throw actionError;
    }

    return NextResponse.json({ success: true, advisory }, { status: 201 });
  } catch (err: any) {
    console.error("Officer Advisory API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
