// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';

export async function GET(request: Request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = data || { id: user.id, email: user.email };
  // Never ship the password hash out of the server.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = row as Record<string, unknown>;
  return NextResponse.json({ data: safe });
}
