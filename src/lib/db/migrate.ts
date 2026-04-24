// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Runs Drizzle-generated migrations against the local SQLite database.
// Called automatically from the server on startup (see src/lib/db/ensureMigrated.ts),
// and directly from `npm run db:migrate` for CLI use.

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';
import { db } from './client';

export function runMigrations() {
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  migrate(db, { migrationsFolder });
}

if (require.main === module) {
  runMigrations();
  console.log('✓ migrations applied');
}
