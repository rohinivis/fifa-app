import 'dotenv/config';
import pool from './pool.js';
import { applyInitialSchemaAndSeed } from './seed.js';
import { runMigrations } from '../migrations/runMigrations.js';

async function init() {
  await applyInitialSchemaAndSeed();
  await runMigrations();
  console.log('Database init complete.');
  await pool.end();
}

init().catch((err) => {
  console.error('Database init failed:', err);
  process.exit(1);
});
