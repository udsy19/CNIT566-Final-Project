// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { startBrightspaceLogin, getAuthSession } from '@/lib/brightspace/playwright-auth';

export async function POST(request: Request) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  // Start the auth flow in background
  await startBrightspaceLogin(user.id, username, password);

  // Wait a moment for initial status
  await new Promise(resolve => setTimeout(resolve, 2000));

  const session = getAuthSession(user.id);
  return NextResponse.json({
    data: {
      status: session?.status || 'logging_in',
      duoCode: session?.duoCode || null,
    }
  });
}
