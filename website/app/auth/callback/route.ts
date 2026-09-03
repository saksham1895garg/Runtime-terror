import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Determine user role and redirect appropriately
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Use admin client to read profile to completely bypass any RLS or cookie sync issues
        const adminSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: profile } = await adminSupabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        let redirectPath = next
        if (profile) {
          if (profile.role === 'developer') {
            const hasOnboarded = user.user_metadata?.onboarded === true;
            redirectPath = hasOnboarded ? '/dev-dashboard' : '/dev-onboarding';
          }
          else if (profile.role === 'officer') redirectPath = '/dashboard'
          else redirectPath = '/'
        } else {
          // Profile doesn't exist yet (first-time Google Auth)
          // We create it securely from the server
          const newRole = user.email === 'gargsaksham1895@gmail.com' ? 'developer' : 'officer';
          
          // Upsert to gracefully handle edge cases where the row might already exist
          const { error: insertError } = await adminSupabase.from('users').upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            role: newRole,
            email_verified: true,
            is_demo: false
          });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            return NextResponse.redirect(`${origin}/dev-login?error=Failed+to+create+profile.+Please+try+again.`)
          }
          
          redirectPath = newRole === 'developer' ? '/dev-onboarding' : '/dashboard';
        }
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/dev-login?error=Google+Authentication+Failed`)
}
