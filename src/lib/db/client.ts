// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'beacon.sqlite');
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'drizzle');

// Skip real DB work during Next.js builds — routes aren't actually invoked,
// and opening the file in parallel across many route modules races on
// migrations and trips SQLITE_BUSY.
const IS_BUILD =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.BEACON_SKIP_DB === '1';

declare global {
  // eslint-disable-next-line no-var
  var __beaconDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var __beaconSqlite: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __beaconMigrated: boolean | undefined;
}

function openConnection() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const sqlite = new Database(DB_FILE);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');
  return sqlite;
}

function getSqlite(): Database.Database {
  if (globalThis.__beaconSqlite) return globalThis.__beaconSqlite;
  const sqlite = openConnection();
  globalThis.__beaconSqlite = sqlite;
  return sqlite;
}

function getDrizzle() {
  if (globalThis.__beaconDb) return globalThis.__beaconDb;
  const d = drizzle(getSqlite(), { schema, logger: process.env.DB_LOG === '1' });
  globalThis.__beaconDb = d;
  return d;
}

/**
 * Idempotent — runs Drizzle migrations once per process.
 * Called automatically from the shim before any query.
 */
export function ensureReady() {
  if (globalThis.__beaconMigrated) return;
  if (IS_BUILD) return;
  if (!fs.existsSync(MIGRATIONS_DIR)) return;
  try {
    migrate(getDrizzle(), { migrationsFolder: MIGRATIONS_DIR });
    globalThis.__beaconMigrated = true;
  } catch (err) {
    console.error('[db] migration failed:', err);
    throw err;
  }
}

// Proxy that defers the SQLite connection until the first access. During
// `next build`, importing this file costs nothing — no file descriptors,
// no migrations, no race conditions.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const real = getDrizzle();
    const val = (real as unknown as Record<string | symbol, unknown>)[prop as string];
    if (typeof val === 'function') return (val as (...args: unknown[]) => unknown).bind(real);
    return Reflect.get(real as object, prop, receiver);
  },
});

export const sqlite = new Proxy({} as Database.Database, {
  get(_target, prop, receiver) {
    const real = getSqlite();
    const val = (real as unknown as Record<string | symbol, unknown>)[prop as string];
    if (typeof val === 'function') return (val as (...args: unknown[]) => unknown).bind(real);
    return Reflect.get(real as object, prop, receiver);
  },
});

export * as schema from './schema';
export type Db = typeof db;
