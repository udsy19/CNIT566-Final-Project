// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';
import { runFullSync } from '@/lib/brightspace/sync';

export async function POST(request: Request) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Check if already syncing
  const { data: userData } = await supabase
    .from('users')
    .select('sync_status')
    .eq('id', user.id)
    .single();

  if (userData?.sync_status === 'syncing') {
    return NextResponse.json({ error: 'Sync already in progress' }, { status: 409 });
  }

  // Run sync in background using admin client (bypasses RLS for writes)
  const adminClient = createAdminClient();
  runFullSync(user.id, adminClient).catch(console.error);

  return NextResponse.json({ data: { message: 'Sync started' } });
}
