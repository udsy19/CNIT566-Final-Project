// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Users } from '@/lib/db/queries';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';

const PURDUE_EMAIL_RE = /^[a-z0-9._%+-]+@purdue\.edu$/i;

export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({}));

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  if (!PURDUE_EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'Beacon is for Purdue students. Please use your @purdue.edu email.' },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const normalized = email.toLowerCase();
  if (Users.findByEmail(normalized)) {
    return NextResponse.json(
      { error: 'An account with that email already exists.' },
      { status: 409 },
    );
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  Users.create({ id, email: normalized, password_hash: passwordHash });

  const { id: sessionId, expiresAt } = await createSession(id);
  await setSessionCookie(sessionId, expiresAt);

  return NextResponse.json({ user: { id, email: normalized } });
}
