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

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*, assignments(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: courses });
}
