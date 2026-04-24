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
    .select('sync_status, sync_progress, last_synced_at')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reset completed/error status to idle after client reads it
  if (data?.sync_status === 'completed' || data?.sync_status === 'error') {
    await supabase
      .from('users')
      .update({ sync_status: 'idle' })
      .eq('id', user.id);
  }

  return NextResponse.json({ data });
}
