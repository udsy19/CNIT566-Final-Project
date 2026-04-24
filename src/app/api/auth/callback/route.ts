// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { exchangeBrightspaceCode } from '@/lib/brightspace/auth';
import { BrightspaceClient } from '@/lib/brightspace/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error)}`, appUrl));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?error=missing_params', appUrl));
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('bs_oauth_state')?.value;
  cookieStore.delete('bs_oauth_state');

  if (state !== storedState) {
    return NextResponse.redirect(new URL('/settings?error=invalid_state', appUrl));
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/', appUrl));
    }

    // Exchange code for tokens
    const tokens = await exchangeBrightspaceCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Get Brightspace user info
    const client = new BrightspaceClient(tokens.access_token);
    const whoAmI = await client.whoAmI();

    // Upsert user record with Brightspace tokens
    await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        brightspace_user_id: whoAmI.Identifier,
        brightspace_access_token: tokens.access_token,
        brightspace_refresh_token: tokens.refresh_token,
        brightspace_token_expires_at: expiresAt,
      }, { onConflict: 'id' });

    return NextResponse.redirect(new URL('/dashboard', appUrl));
  } catch (err) {
    console.error('Brightspace callback error:', err);
    return NextResponse.redirect(new URL('/settings?error=auth_failed', appUrl));
  }
}
