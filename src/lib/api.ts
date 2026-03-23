import { createClient } from '@/lib/supabase/client';

/**
 * Authenticated fetch wrapper that sends the Supabase access token
 * in the Authorization header for API routes.
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options?.method === 'POST') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}
