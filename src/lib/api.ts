// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

/**
 * Authenticated fetch wrapper with retry logic.
 * The session cookie is sent automatically by the browser — no headers needed.
 * Retries with exponential backoff on network errors and 5xx responses.
 */
export async function apiFetch(
  url: string,
  options?: RequestInit,
  retries = 3,
): Promise<Response> {
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type') && options?.method === 'POST') {
    headers.set('Content-Type', 'application/json');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

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
