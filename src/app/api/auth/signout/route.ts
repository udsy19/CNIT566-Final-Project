// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse } from 'next/server';
import { clearSessionCookie, invalidateSession, readSessionIdFromCookie } from '@/lib/auth/session';

export async function POST() {
  const id = await readSessionIdFromCookie();
  if (id) await invalidateSession(id);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
