import { readFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';
import pool from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/************************************* USAGE *************************************************
INPUTS: N/A (READS process.env.RUN_SEED)
OUTPUTS: N/A (APPLIES schema.sql + seed.sql, LOGS RESULT)
FUNCTION: APPLIES THE INITIAL SCHEMA + SEED DATA, BUT ONLY ON A FRESH DATABASE (OR WHEN
          RUN_SEED=true IS SET). schema.sql IS DESTRUCTIVE (DROP TABLE), SO IT MUST NEVER
          RUN AGAINST A DATABASE THAT ALREADY HAS TABLES, OR IT WOULD WIPE REAL DATA.
************************************* USAGE **************************************************/
async function applyInitialSchemaAndSeed() {
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
    ) AS exists
  `);
  const tablesExist = tableCheck.rows[0].exists;
  const forceSeed = process.env.RUN_SEED === 'true';

  if (!tablesExist || forceSeed) {
    const schema = await readFile(path.join(__dirname, 'schema.sql'), 'utf-8');
    const seed = await readFile(path.join(__dirname, 'seed.sql'), 'utf-8');
    console.log('Applying schema...');
    await pool.query(schema);
    console.log('Applying seed data...');
    await pool.query(seed);
  } else {
    console.log('Tables already exist — skipping schema/seed (set RUN_SEED=true to force a reset).');
  }
}

/************************************* USAGE *************************************************
INPUTS: N/A
OUTPUTS: N/A (CREATES schema_migrations TRACKING TABLE IF IT DOESN'T EXIST)
FUNCTION: ENSURES THE TABLE THAT TRACKS WHICH MIGRATION FILES HAVE ALREADY BEEN
          APPLIED EXISTS. SAFE TO RUN EVERY TIME — CREATE TABLE IF NOT EXISTS.
************************************* USAGE **************************************************/
async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

/************************************* USAGE *************************************************
INPUTS: N/A (READS *.sql FILES FROM db/migrations/, READS schema_migrations TABLE)
OUTPUTS: N/A (APPLIES ANY MIGRATION NOT YET RECORDED, LOGS EACH ONE)
FUNCTION: THE APPEND-ONLY MIGRATION RUNNER. FILES IN db/migrations/ ARE APPLIED IN
          FILENAME ORDER. EACH ONE RUNS INSIDE A TRANSACTION AND IS RECORDED IN
          schema_migrations SO IT NEVER RUNS TWICE — THIS IS WHAT LETS YOU SAFELY
          RE-RUN `npm run db:init` AGAINST A LIVE DATABASE AFTER ADDING A NEW
          MIGRATION FILE, WITHOUT TOUCHING ANY EXISTING DATA.
************************************* USAGE **************************************************/
async function runMigrations() {
  await ensureMigrationsTable();

  let files;
  try {
    files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  } catch {
    files = []; // migrations dir doesn't exist yet — nothing to do
  }

  const applied = await pool.query('SELECT filename FROM schema_migrations');
  const alreadyApplied = new Set(applied.rows.map((r) => r.filename));

  const pending = files.filter((f) => !alreadyApplied.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const filename of pending) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, filename), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`Applied migration: ${filename}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${filename} failed and was rolled back: ${err.message}`);
    } finally {
      client.release();
    }
  }
}

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
