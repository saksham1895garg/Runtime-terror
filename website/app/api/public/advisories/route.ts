import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// We use the service client for public reads if RLS is not configured for public access.


export async function GET() {
  try {
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_KEY || ""
    );
    const { data: advisories, error } = await supabaseAdmin
      .from('advisories')
      .select('*')
      .eq('status', 'PUBLISHED')
      .order('published_at', { ascending: false });

    if (error) {
      console.error("Database error fetching public advisories:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(advisories || []);
  } catch (err: any) {
    console.error("Public Advisories API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
