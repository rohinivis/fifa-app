-- 1718380800-add-admin-role.sql
-- Adds a real is_admin flag so the /admin screen can be gated by role
-- instead of just "logged in" (see the NOTE that used to be at the top of
-- routes/admin.js). Additive ALTER only — no existing column touched.
--
-- Also seeds one dedicated admin account. This is intentionally separate
-- from the regular fan accounts (messi_fan, etc.) rather than promoting one
-- of them, so "log in as a fan" and "log in as an admin" stay two distinct
-- flows with their own credentials — see routes/admin.js's /admin/login.
--
-- Password below is a bcrypt hash of 'admin123' (see README.md for the
-- plaintext you actually log in with).
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

INSERT INTO users (username, password, is_admin)
VALUES ('admin', '$2b$10$6z/5UfX4wKdBBACM4ojJ9eE9p7CbSaQDs0yY1/6TsPu7ZcIdFxzK2', true)
ON CONFLICT (username) DO NOTHING;
