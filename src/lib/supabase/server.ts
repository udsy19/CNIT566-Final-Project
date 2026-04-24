// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Server-side client — backed by the local shim which reads the session
// cookie via next/headers.

import { createShimClient, type ShimClient } from './shim';

export async function createClient(): Promise<ShimClient> {
  return createShimClient();
}
