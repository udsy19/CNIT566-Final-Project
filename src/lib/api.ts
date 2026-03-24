import { createClient } from '@/lib/supabase/client';

/**
 * Authenticated fetch wrapper with retry logic.
 * Sends the Supabase access token in the Authorization header.
 * Retries with exponential backoff on network errors and 5xx responses.
 */
export async function apiFetch(
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<Response> {
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

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });

      // Don't retry on client errors (4xx) — only retry on 5xx
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // 5xx — retry
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Network error');
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}
