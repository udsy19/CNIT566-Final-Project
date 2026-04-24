// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextRequest, NextResponse } from 'next/server';
import { Users } from '@/lib/db/queries';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({}));

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = Users.findByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const ok = await verifyPassword(user.password_hash, password);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const { id: sessionId, expiresAt } = await createSession(user.id);
  await setSessionCookie(sessionId, expiresAt);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
