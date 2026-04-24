// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'beacon.sqlite');

declare global {
  // eslint-disable-next-line no-var
  var __beaconDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var __beaconSqlite: Database.Database | undefined;
}

function createDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const sqlite = new Database(DB_FILE);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');
  return sqlite;
}

// Reuse a single connection across Next.js dev hot-reloads.
const sqlite = globalThis.__beaconSqlite ?? createDatabase();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__beaconSqlite = sqlite;
}

export const db =
  globalThis.__beaconDb ??
  drizzle(sqlite, { schema, logger: process.env.DB_LOG === '1' });
if (process.env.NODE_ENV !== 'production') {
  globalThis.__beaconDb = db;
}

export { sqlite };
export * as schema from './schema';
export type Db = typeof db;
