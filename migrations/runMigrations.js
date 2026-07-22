import { readFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../init/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
INPUTS: N/A (READS *.sql FILES FROM THIS DIRECTORY, READS schema_migrations TABLE)
OUTPUTS: N/A (APPLIES ANY MIGRATION NOT YET RECORDED, LOGS EACH ONE)
FUNCTION: THE APPEND-ONLY MIGRATION RUNNER. FILES IN migrations/ ARE APPLIED IN FILENAME
          ORDER (TIMESTAMP-PREFIXED, SEE README.md IN THIS DIRECTORY). EACH ONE RUNS INSIDE
          A TRANSACTION AND IS RECORDED IN schema_migrations SO IT NEVER RUNS TWICE — THIS
          IS WHAT LETS YOU SAFELY RE-RUN `npm run db:init` AGAINST A LIVE DATABASE AFTER
          ADDING A NEW MIGRATION FILE, WITHOUT TOUCHING ANY EXISTING DATA.
************************************* USAGE **************************************************/
export async function runMigrations() {
  await ensureMigrationsTable();

  let files;
  try {
    files = (await readdir(__dirname)).filter((f) => f.endsWith('.sql')).sort();
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
    const sql = await readFile(path.join(__dirname, filename), 'utf-8');
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
