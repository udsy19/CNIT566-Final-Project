import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { getAuthSession, cleanupAuthSession } from '@/lib/brightspace/playwright-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = getAuthSession(user.id);

  if (!session) {
    return NextResponse.json({
      data: { status: 'idle', duoCode: null, error: null }
    });
  }

  if (session.status === 'completed') {
    // Save cookies to database and cleanup
    const { cookies, brightspaceUserId } = await cleanupAuthSession(user.id);

    if (cookies) {
      const adminClient = createAdminClient();
      await adminClient
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          brightspace_user_id: brightspaceUserId || null,
          brightspace_access_token: JSON.stringify(cookies),
          brightspace_refresh_token: 'session_cookies',
          brightspace_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'id' });
    }

    return NextResponse.json({
      data: { status: 'completed', duoCode: null, error: null }
    });
  }

  if (session.status === 'error') {
    const error = session.error;
    await cleanupAuthSession(user.id);
    return NextResponse.json({
      data: { status: 'error', duoCode: null, error }
    });
  }

  return NextResponse.json({
    data: {
      status: session.status,
      duoCode: session.duoCode,
      error: null,
    }
  });
}
