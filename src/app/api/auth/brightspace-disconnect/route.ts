import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';

export async function POST(request: Request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  await supabase
    .from('users')
    .update({
      brightspace_access_token: null,
      brightspace_refresh_token: null,
      brightspace_token_expires_at: null,
    })
    .eq('id', user.id);

  return NextResponse.json({ data: { success: true } });
}
