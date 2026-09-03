import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Must use Admin Client to check root and write to verification_codes securely
    const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
    const adminClient = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify Root eligibility
    const { data: identity } = await adminClient
      .from('developer_identities')
      .select('is_root')
      .eq('user_id', user.id)
      .single();

    if (!identity || !identity.is_root) {
      return NextResponse.json({ error: 'Forbidden: Not eligible for God Mode' }, { status: 403 });
    }

    // Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Hash it before storing (SHA-256 is perfectly fast and secure for ephemeral 5-min bounded codes)
    const hashedCode = crypto.createHash('sha256').update(otp).digest('hex');

    // Invalidate previous unused codes for this purpose to prevent replay/buildup
    await adminClient
      .from('verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('purpose', 'GOD_MODE_ENTRY')
      .is('used_at', null);

    // Set strict expiration 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await adminClient
      .from('verification_codes')
      .insert({
        user_id: user.id,
        hashed_code: hashedCode,
        purpose: 'GOD_MODE_ENTRY',
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('OTP Gen Error:', insertError);
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }

    // Send the email securely
    const { error: resendError } = await resend.emails.send({
      from: 'Dhara Soochak Security <onboarding@resend.dev>', // Using verified dev domain
      to: user.email,
      subject: 'Your God Mode Verification Code',
      html: `
        <div style="font-family: sans-serif; background: #0f1115; color: #fff; padding: 40px; text-align: center; border-radius: 8px;">
          <h2 style="color: #ef4444; margin-bottom: 20px;">Dhara-Soochak Security Alert</h2>
          <p style="font-size: 16px; color: #9ca3af;">A request was made to enter God Mode for your account.</p>
          <div style="background: #1f2937; display: inline-block; padding: 15px 30px; font-size: 32px; letter-spacing: 5px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #ef4444;">This code is strictly confidential and expires in 5 minutes.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Resend Error:', resendError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Log the event
    await adminClient.from('security_events').insert({
      actor_id: user.id,
      event_type: 'GOD_MODE_OTP_REQUESTED',
      details: { expires_at: expiresAt },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true, message: 'Verification code sent securely' });
  } catch (error) {
    console.error('Step-Up Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
