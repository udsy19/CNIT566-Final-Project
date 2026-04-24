// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

const BRIGHTSPACE_URL = 'https://purdue.brightspace.com';

interface AuthSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  status: 'logging_in' | 'duo_pending' | 'duo_code' | 'completing' | 'completed' | 'error';
  duoCode: string | null;
  cookies: Record<string, string> | null;
  error: string | null;
  brightspaceUserId?: string | null;
}

// In-memory store for active auth sessions
const activeSessions = new Map<string, AuthSession>();

export function getAuthSession(userId: string): AuthSession | undefined {
  return activeSessions.get(userId);
}

export async function startBrightspaceLogin(
  userId: string,
  username: string,
  password: string
): Promise<void> {
  // Clean up any existing session
  const existing = activeSessions.get(userId);
  if (existing) {
    try { await existing.browser.close(); } catch {}
    activeSessions.delete(userId);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const session: AuthSession = {
    browser,
    context,
    page,
    status: 'logging_in',
    duoCode: null,
    cookies: null,
    error: null,
  };
  activeSessions.set(userId, session);

  // Run the auth flow in background (don't await)
  runAuthFlow(userId, session, username, password).catch(async (err) => {
    session.status = 'error';
    session.error = err instanceof Error ? err.message : 'Unknown error';
    try { await session.browser.close(); } catch {}
  });
}

async function runAuthFlow(
  userId: string,
  session: AuthSession,
  username: string,
  password: string
): Promise<void> {
  const { page } = session;

  try {
    // Step 1: Navigate to Brightspace login
    await page.goto(`${BRIGHTSPACE_URL}/d2l/login`);

    // Step 1.5: Handle campus selection if present
    try {
      const campusLink = page.locator("a[title='Purdue West Lafayette Login']");
      if (await campusLink.isVisible({ timeout: 5000 })) {
        await campusLink.click();
        await page.waitForLoadState('networkidle');
      }
    } catch {
      // No campus selection, continue
    }

    // Step 2: Fill login form
    try {
      await page.waitForSelector("input[name='j_username'], input[id='username']", { timeout: 10000 });
      await page.fill("input[name='j_username'], input[id='username']", username);
      await page.fill("input[name='j_password'], input[id='password']", password);
      await page.click("button[type='submit'], input[type='submit']");
    } catch {
      // Check if already logged in
      if (page.url().includes('d2l/home')) {
        session.status = 'completing';
      } else {
        throw new Error('Login fields not found');
      }
    }

    // Step 3: Handle Duo 2FA
    session.status = 'duo_pending';

    try {
      // Wait for Duo screen
      const otherOptions = page.locator(".other-options-link").or(page.locator("text='Other options'")).first();
      await otherOptions.waitFor({ state: 'visible', timeout: 15000 });

      await otherOptions.click();

      // Select Duo Push
      const duoPush = page.locator("text='Duo Push'");
      await duoPush.waitFor({ state: 'visible', timeout: 10000 });
      await duoPush.first().click();
    } catch {
      // Check if already past Duo
      if (page.url().includes('d2l/home')) {
        session.status = 'completing';
      }
    }

    // Step 4: Extract Duo verification code
    if (session.status !== 'completing') {
      try {
        await page.waitForSelector("text=Verify it's you", { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const bodyText = await page.innerText('body');
        const codeMatch = bodyText.replace(/\n/g, ' ').match(/Verify it.*?(\d{3})\b/i);

        if (codeMatch) {
          session.duoCode = codeMatch[1];
        } else {
          const potentialCodes = bodyText.match(/\b\d{3}\b/g);
          if (potentialCodes && potentialCodes.length > 0) {
            session.duoCode = potentialCodes[0];
          }
        }

        session.status = 'duo_code';
      } catch {
        if (!page.url().includes('d2l/home')) {
          throw new Error('Could not detect Duo verification code');
        }
      }
    }

    // Step 5: Wait for Duo approval (user taps on phone)
    if (!page.url().includes('d2l/home')) {
      await page.waitForURL('**/d2l/home/**', { timeout: 120000 });
    }

    session.status = 'completing';

    // Step 6: Extract cookies
    const cookies = await session.context.cookies();
    const cookieMap: Record<string, string> = {};
    for (const cookie of cookies) {
      cookieMap[cookie.name] = cookie.value;
    }
    session.cookies = cookieMap;

    // Step 7: Get user info from Brightspace API
    let brightspaceUserId: string | null = null;
    try {
      const whoAmI = await page.evaluate(async () => {
        const res = await fetch('/d2l/api/lp/1.40/users/whoami');
        if (res.ok) return res.json();
        return null;
      });
      if (whoAmI) {
        brightspaceUserId = whoAmI.Identifier || null;
      }
    } catch {
      // Non-critical
    }

    session.status = 'completed';
    session.brightspaceUserId = brightspaceUserId;

  } catch (err) {
    session.status = 'error';
    session.error = err instanceof Error ? err.message : 'Authentication failed';
  }
}

export async function cleanupAuthSession(userId: string): Promise<{ cookies: Record<string, string> | null; brightspaceUserId?: string | null }> {
  const session = activeSessions.get(userId);
  if (!session) return { cookies: null };

  const result = {
    cookies: session.cookies,
    brightspaceUserId: session.brightspaceUserId || null,
  };

  try {
    await session.browser.close();
  } catch {}
  activeSessions.delete(userId);

  return result;
}
