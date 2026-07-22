import pool from '../../init/pool.js';
import { hashPassword, comparePassword } from './cryptographicHelper.js';

export async function getAccountByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
}

export async function createAccount({ username, password, favorite_club }) {
  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    'INSERT INTO users (username, password, favorite_club) VALUES ($1, $2, $3) RETURNING *',
    [username, passwordHash, favorite_club || null]
  );
  return result.rows[0];
}

export async function loginAccount(username, password) {
  const account = await getAccountByUsername(username);
  if (!account) return null;

  const passwordMatches = await comparePassword(password, account.password);
  if (!passwordMatches) return null;

  const updated = await pool.query(
    `UPDATE users SET login_count = login_count + 1, last_login_at = now()
     WHERE id = $1
     RETURNING *`,
    [account.id]
  );
  return updated.rows[0];
}

export async function getAdminAccountByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1 AND is_admin = true', [
    username,
  ]);
  return result.rows[0] || null;
}

export async function loginAdminAccount(username, password) {
  const account = await getAdminAccountByUsername(username);
  if (!account) return null;

  const passwordMatches = await comparePassword(password, account.password);
  if (!passwordMatches) return null;

  return account;
}

