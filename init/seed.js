import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function applyInitialSchemaAndSeed() {
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
