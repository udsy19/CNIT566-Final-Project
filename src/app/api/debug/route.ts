import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Method 1: Token from header
  const tokenUser = await getUserFromToken(request);

  // Method 2: Cookie-based
  let cookieUser = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    cookieUser = data?.user;
  } catch {}

  const authHeader = request.headers.get('authorization');

  return NextResponse.json({
    tokenAuth: tokenUser ? { id: tokenUser.id, email: tokenUser.email } : null,
    cookieAuth: cookieUser ? { id: cookieUser.id, email: cookieUser.email } : null,
    hasAuthHeader: !!authHeader,
    authHeaderPreview: authHeader ? authHeader.slice(0, 30) + '...' : null,
  });
}
