-- 1718208000-add-login-tracking.sql
-- Adds columns needed to tell a first-time login from a returning one, for
-- the personalized greeting on the account page. Additive ALTER only — no
-- existing column is touched or dropped.

ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
