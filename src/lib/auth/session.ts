// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Minimal session-cookie auth inspired by Lucia v3's reference implementation.
// Stores session rows in the local SQLite `sessions` table.
// One active cookie per device; sliding expiry refreshes on each request.

import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { eq, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { sessions, users } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema-types';

export const SESSION_COOKIE = 'beacon_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // refresh when <15d left

function generateSessionId(): string {
  return randomBytes(24).toString('base64url');
}

export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  db.insert(sessions).values({ id, user_id: userId, expires_at: expiresAt }).run();
  return { id, expiresAt };
}

export async function setSessionCookie(sessionId: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function readSessionIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Validate a session id. Returns the associated user (and refreshes the
 * cookie if it's close to expiry). Idempotent; safe to call on every request.
 */
export async function validateSession(
  sessionId: string | null,
): Promise<{ user: User; sessionId: string } | null> {
  if (!sessionId) return null;

  const row = db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!row) return null;

  const now = Date.now();
  if (row.session.expires_at.getTime() <= now) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    return null;
  }

  // Sliding expiry — refresh when within renew threshold.
  if (row.session.expires_at.getTime() - now < SESSION_RENEW_THRESHOLD_MS) {
    const newExpiry = new Date(now + SESSION_DURATION_MS);
    db.update(sessions).set({ expires_at: newExpiry }).where(eq(sessions.id, sessionId)).run();
    row.session.expires_at = newExpiry;
  }

  return { user: row.user, sessionId: row.session.id };
}

export async function invalidateSession(sessionId: string) {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export async function invalidateAllUserSessions(userId: string) {
  db.delete(sessions).where(eq(sessions.user_id, userId)).run();
}

/** Opportunistic cleanup — delete any expired rows. */
export async function purgeExpiredSessions() {
  db.delete(sessions).where(lt(sessions.expires_at, new Date())).run();
}

/** Convenience: the default server-side gate for API routes and RSCs. */
export async function getSessionUser(): Promise<User | null> {
  const id = await readSessionIdFromCookie();
  const result = await validateSession(id);
  return result?.user ?? null;
}
