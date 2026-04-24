// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

/**
 * Verify the Supabase JWT from the Authorization header.
 * Returns the authenticated user or a 401 JSON response.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: User; response?: never } | { user?: never; response: NextResponse }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // API routes don't need to set cookies
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return { user };
}
