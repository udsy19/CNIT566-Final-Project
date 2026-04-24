// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

/**
 * Gate an API route behind a valid local session.
 * Returns either `{ user }` or `{ response }` with a 401 JSON body.
 */
export async function requireAuth(
  _request: NextRequest,
): Promise<
  | { user: { id: string; email: string }; response?: never }
  | { user?: never; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      response: NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 },
      ),
    };
  }
  return { user: { id: user.id, email: user.email } };
}
