// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { createAdminClient } from '@/lib/supabase/admin';

export function getBrightspaceAuthUrl(state: string): string {
  // Legacy OAuth — now unused, kept for reference
  const BRIGHTSPACE_CLIENT_ID = process.env.BRIGHTSPACE_CLIENT_ID || '';
  const BRIGHTSPACE_AUTH_URL = process.env.BRIGHTSPACE_AUTH_URL || '';
  const BRIGHTSPACE_REDIRECT_URI = process.env.BRIGHTSPACE_REDIRECT_URI || '';
  const BRIGHTSPACE_SCOPES = process.env.BRIGHTSPACE_SCOPES || '';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: BRIGHTSPACE_CLIENT_ID,
    redirect_uri: BRIGHTSPACE_REDIRECT_URI,
    scope: BRIGHTSPACE_SCOPES,
    state,
  });
  return `${BRIGHTSPACE_AUTH_URL}?${params.toString()}`;
}

export async function getValidToken(userId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('brightspace_access_token, brightspace_refresh_token, brightspace_token_expires_at')
    .eq('id', userId)
    .single();

  if (error || !user?.brightspace_access_token) {
    throw new Error('No Brightspace session found. Please connect Brightspace first.');
  }

  // Check if session cookies are expired (we set a 24h expiry)
  if (user.brightspace_token_expires_at) {
    const expiresAt = new Date(user.brightspace_token_expires_at);
    if (expiresAt < new Date()) {
      throw new Error('Brightspace session expired. Please re-authenticate.');
    }
  }

  // Return the stored cookies (JSON string)
  return user.brightspace_access_token;
}

// Legacy OAuth functions kept for compatibility
export async function exchangeBrightspaceCode(code: string) {
  const BRIGHTSPACE_TOKEN_URL = process.env.BRIGHTSPACE_TOKEN_URL || '';
  const BRIGHTSPACE_CLIENT_ID = process.env.BRIGHTSPACE_CLIENT_ID || '';
  const BRIGHTSPACE_CLIENT_SECRET = process.env.BRIGHTSPACE_CLIENT_SECRET || '';
  const BRIGHTSPACE_REDIRECT_URI = process.env.BRIGHTSPACE_REDIRECT_URI || '';

  const response = await fetch(BRIGHTSPACE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: BRIGHTSPACE_CLIENT_ID,
      client_secret: BRIGHTSPACE_CLIENT_SECRET,
      redirect_uri: BRIGHTSPACE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshBrightspaceToken(refreshToken: string) {
  const BRIGHTSPACE_TOKEN_URL = process.env.BRIGHTSPACE_TOKEN_URL || '';
  const BRIGHTSPACE_CLIENT_ID = process.env.BRIGHTSPACE_CLIENT_ID || '';
  const BRIGHTSPACE_CLIENT_SECRET = process.env.BRIGHTSPACE_CLIENT_SECRET || '';

  const response = await fetch(BRIGHTSPACE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: BRIGHTSPACE_CLIENT_ID,
      client_secret: BRIGHTSPACE_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}
