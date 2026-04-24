// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse, type NextRequest } from 'next/server';

// NOTE: we intentionally do NOT import the session module here, because
// Edge-runtime middleware cannot use `better-sqlite3` (native binding).
// Instead, we treat the presence of the session cookie as a weak signal
// of "logged in" and let the actual validation happen inside server
// components / API routes (which run in the Node runtime).

const SESSION_COOKIE = 'beacon_session';
const PROTECTED_PATHS = ['/dashboard', '/course', '/ask', '/settings', '/calendar'];

export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // Don't redirect API routes — they validate the session server-side.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === '/' && hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
