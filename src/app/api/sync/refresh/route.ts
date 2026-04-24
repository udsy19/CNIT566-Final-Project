// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';
import { runIncrementalSync } from '@/lib/brightspace/sync';

export async function POST(request: Request) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  runIncrementalSync(user.id, adminClient).catch(console.error);

  return NextResponse.json({ data: { message: 'Incremental sync started' } });
}
