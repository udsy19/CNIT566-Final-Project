// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// In the local-app build, the "browser-side Supabase client" is also the
// local shim. Client components call .auth.getSession() to satisfy API calls;
// because the local app uses cookie-based sessions, the shim returns a
// synthetic session so existing code continues to work.

import { createShimClient, type ShimClient } from './shim';

export function createClient(): ShimClient {
  return createShimClient();
}
