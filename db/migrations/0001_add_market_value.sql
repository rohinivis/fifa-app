-- Adds a market value estimate to players, derived from their rating.
-- Additive only: no existing column touched, no rows deleted.
ALTER TABLE players ADD COLUMN IF NOT EXISTS market_value INT DEFAULT 0;
UPDATE players SET market_value = rating * 1000000 WHERE market_value = 0;
