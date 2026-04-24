// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/beacon.sqlite',
  },
  verbose: true,
  strict: true,
});
