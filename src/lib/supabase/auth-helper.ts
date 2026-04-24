// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Historically this looked for a Supabase JWT in the Authorization header.
// In the local app we authenticate via the session cookie — API routes are
// automatically gated because the browser sends the cookie with every fetch.

import { getSessionUser } from '@/lib/auth/session';

export async function getUserFromToken(_request: Request) {
  const user = await getSessionUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    // Shape-compat with the old Supabase `User` object.
    aud: 'authenticated',
    role: 'authenticated',
  };
}
