import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid verification code format' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
    const adminClient = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch the active unexpired OTP for this user
    const { data: activeCodes } = await adminClient
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('purpose', 'GOD_MODE_ENTRY')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const activeCode = activeCodes?.[0];

    if (!activeCode) {
      return NextResponse.json({ error: 'No active verification code found or it has expired' }, { status: 403 });
    }

    // 2. Enforce strict max attempts (3)
    if (activeCode.attempts >= 3) {
      await adminClient.from('verification_codes').update({ used_at: new Date().toISOString() }).eq('id', activeCode.id);
      
      // Log brute force attempt
      await adminClient.from('security_events').insert({
        actor_id: user.id,
        event_type: 'GOD_MODE_BRUTE_FORCE_PREVENTED',
        details: { code_id: activeCode.id },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json({ error: 'Too many failed attempts. Code invalidated. Request a new one.' }, { status: 403 });
    }

    // Increment attempts immediately
    await adminClient.from('verification_codes').update({ attempts: activeCode.attempts + 1 }).eq('id', activeCode.id);

    // 3. Verify cryptographic hash
    const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
    
    if (hashedInput !== activeCode.hashed_code) {
      await adminClient.from('security_events').insert({
        actor_id: user.id,
        event_type: 'GOD_MODE_FAILED',
        details: { reason: "Invalid OTP", attempts: activeCode.attempts + 1 },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 403 });
    }

    // 4. Verification successful -> Mark as used
    await adminClient.from('verification_codes').update({ used_at: new Date().toISOString() }).eq('id', activeCode.id);

    // 5. Generate secure cryptographically random Session Token (256-bits)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(sessionToken).digest('hex');
    
    // Set 60 minute God Mode session
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { error: sessionError } = await adminClient.from('god_mode_sessions').insert({
      user_id: user.id,
      hashed_token: hashedToken,
      expires_at: expiresAt.toISOString()
    });

    if (sessionError) {
      console.error('Session Error:', sessionError);
      return NextResponse.json({ error: 'Failed to create secure session' }, { status: 500 });
    }

    // 6. Issue Highly Secure HTTP-Only Cookie
    // We strictly use __Host- prefix conventions if possible, but local development limits us.
    // We enforce Secure, HttpOnly, Strict SameSite.
    cookieStore.set('GodMode-Token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      path: '/',
      expires: expiresAt
    });

    // Log success
    await adminClient.from('security_events').insert({
      actor_id: user.id,
      event_type: 'GOD_MODE_GRANTED',
      details: { expires_at: expiresAt.toISOString() },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true, message: 'God Mode access granted' });
  } catch (error) {
    console.error('Verify Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
