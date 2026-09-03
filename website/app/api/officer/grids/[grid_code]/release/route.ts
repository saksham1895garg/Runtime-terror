import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// GET public visibility status of a grid
export async function GET(
  request: Request,
  { params }: { params: Promise<{ grid_code: string }> }
) {
  try {
    const { grid_code } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "officer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check if there is an active PUBLISHED advisory for this grid_code with an officer action
    const { data: advisories } = await supabase
      .from("advisories")
      .select("id")
      .eq("area", grid_code)
      .eq("status", "PUBLISHED");

    if (!advisories || advisories.length === 0) {
      return NextResponse.json({ is_public: false });
    }

    const advisoryIds = advisories.map(a => a.id);
    const { data: actions } = await supabase
      .from("officer_actions")
      .select("id")
      .eq("entity_type", "ADVISORY")
      .eq("action", "PUBLISH")
      .in("entity_id", advisoryIds);

    return NextResponse.json({ is_public: (actions && actions.length > 0) });
  } catch (error) {
    console.error("GET Release Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST to toggle public visibility
export async function POST(
  request: Request,
  { params }: { params: Promise<{ grid_code: string }> }
) {
  try {
    const { grid_code } = await params;
    const body = await request.json();
    const { is_public } = body; // true to publish, false to unpublish

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "officer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (is_public) {
      // Create or update advisory
      const { data: existing } = await supabase
        .from("advisories")
        .select("id")
        .eq("area", grid_code)
        .eq("status", "PUBLISHED")
        .maybeSingle();

      if (!existing) {
        // Create new advisory
        const { data: newAdv, error: insertError } = await supabase.from("advisories").insert({
          id: `ADV-GRID-${grid_code}-${Date.now().toString().slice(-6)}`,
          title: `Public Release: Grid ${grid_code}`,
          description: `Public release authorized by officer for grid cell ${grid_code}`,
          type: "TRAVEL_CAUTION",
          severity: "HIGH",
          area: grid_code,
          status: "PUBLISHED",
          published_by: user.id,
          created_by: user.id
        }).select().single();

        if (insertError) throw insertError;

        // Create officer action
        await supabase.from("officer_actions").insert({
          officer_id: user.id,
          entity_type: "ADVISORY",
          entity_id: newAdv.id,
          action: "PUBLISH"
        });
      }
      return NextResponse.json({ success: true, is_public: true });
    } else {
      // Turn off public visibility
      const { data: advisories } = await supabase
        .from("advisories")
        .select("id")
        .eq("area", grid_code)
        .eq("status", "PUBLISHED");

      if (advisories && advisories.length > 0) {
        const ids = advisories.map(a => a.id);
        await supabase
          .from("advisories")
          .update({ status: "ARCHIVED" })
          .in("id", ids);
      }
      return NextResponse.json({ success: true, is_public: false });
    }
  } catch (error) {
    console.error("POST Release Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
