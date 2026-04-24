// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Idempotent migration runner invoked on the first server hit.
// Keeps the local-app experience to `npm run dev` — no extra setup step.

import { runMigrations } from './migrate';

let applied = false;

export function ensureMigrated() {
  if (applied) return;
  try {
    runMigrations();
    applied = true;
  } catch (err) {
    console.error('[db] migration failed:', err);
    throw err;
  }
}
