-- 1718467200-add-player-duplicate-check.sql
-- Adam's feedback: "Teams already reject duplicates by name — mirror that for
-- players." Teams get this for free from `teams.name UNIQUE` (see
-- db/schema.sql), so routes/api.js's POST /api/teams just catches the
-- resulting 23505 error code and turns it into a 409.
--
-- Players don't have a single unique column to hang that off of — the same
-- player name can legitimately show up on two different teams (or as two
-- different free agents), so a bare UNIQUE(name) would be wrong. What's
-- actually a duplicate is the same name on the *same* team, so the
-- constraint is composite: UNIQUE(name, team_id).
--
-- One wrinkle: team_id is nullable (free agents, see ON DELETE SET NULL in
-- db/schema.sql), and Postgres treats every NULL as distinct from every
-- other NULL in a UNIQUE constraint — so two free agents named the same
-- thing would NOT collide here. That's the deliberate, narrower scope Adam
-- asked for ("mirror that for players" = same shape as the teams check);
-- free-agent name collisions can be revisited later if it ever matters.
ALTER TABLE players
  ADD CONSTRAINT players_name_team_id_key UNIQUE (name, team_id);
