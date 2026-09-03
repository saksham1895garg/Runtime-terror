import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Check deployment secret
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
    if (!bootstrapSecret || body.secret !== bootstrapSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid bootstrap secret.' }, { status: 401 });
    }

    // 2. Authenticated user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Must be logged in.' }, { status: 401 });
    }


    // Actually, let's just create it directly
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Check if root already exists (single-use lock)
    const { data: existingRoot, error: checkError } = await adminClient
      .from('developer_identities')
      .select('user_id')
      .eq('is_root', true)
      .limit(1);

    if (checkError) {
      console.error('Supabase DB Check Error:', checkError);
      return NextResponse.json({ error: 'Database check failed', details: checkError }, { status: 500 });
    }

    if (existingRoot && existingRoot.length > 0) {
      return NextResponse.json({ error: 'Forbidden: Root identity has already been bootstrapped.' }, { status: 403 });
    }

    // 5. Explicit target identity check
    if (body.targetUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Target identity mismatch.' }, { status: 403 });
    }

    // 6. Grant Root Access
    const { error: insertError } = await adminClient
      .from('developer_identities')
      .insert({
        user_id: user.id,
        is_root: true
      });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to bootstrap root identity.' }, { status: 500 });
    }

    // 7. Security/Audit Logging
    await adminClient
      .from('security_events')
      .insert({
        actor_id: user.id,
        event_type: 'ROOT_BOOTSTRAPPED',
        details: { reason: "Initial secure system bootstrap", target: user.id },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    return NextResponse.json({ success: true, message: 'Root developer bootstrapped securely.' });

  } catch (err: any) {
    console.error('Bootstrap Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
