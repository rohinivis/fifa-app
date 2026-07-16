-- 0004_hash_seed_passwords.sql
-- Rehashes the three seed accounts in place. db/seed.sql was updated at the
-- same time to insert bcrypt hashes for FRESH databases, but this migration
-- exists for anyone who already has a database seeded from the old
-- plaintext version — same append-only philosophy, just applied as an
-- UPDATE instead of an INSERT since the rows already exist.
--
-- Scoped to username, and guarded by the old plaintext value, so it's a
-- no-op (and safe to re-run) against a database that was seeded fresh with
-- the already-hashed seed.sql, or where a user has since changed their
-- password.
UPDATE users SET password = '$2b$10$9h/mRQ8N8VZMi01v/n29jugv9SXnFX9RTOoWY7XFf2dPpGRXHm1Ju'
  WHERE username = 'messi_fan' AND password = 'goat123';

UPDATE users SET password = '$2b$10$em5deINBSmj79R1U7e0ZM.uAViillOx.ZGjvrn9RIBllLnJKk/u3C'
  WHERE username = 'ronaldo_fan' AND password = 'siuuu2024';

UPDATE users SET password = '$2b$10$AxKGCdDGIOhFQIyUUrlOmOZWlvCWXb2q5nuwpXzrisTRe0UiLH1Ra'
  WHERE username = 'mbappe_fan' AND password = 'speedster';
