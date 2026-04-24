// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// The "admin" client historically used Supabase's service-role key to bypass
// RLS for background jobs and sync work. In the local app there is no RLS —
// the shim simply queries SQLite directly.

import { createShimClient, type ShimClient } from './shim';

export function createAdminClient(): ShimClient {
  return createShimClient();
}
