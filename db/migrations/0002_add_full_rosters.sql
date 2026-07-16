-- Expands Real Madrid and Inter Miami to full current rosters (2026 season).
-- Verified against Wikipedia's 2026-27 Real Madrid CF season page and the
-- 2026 Inter Miami CF season page, plus supporting news sources, as of July 2026.
--
-- Additive only: Real Madrid and Inter Miami teams already exist from the
-- initial seed (db/seed.sql), as do a few of their players (Mbappe, Messi,
-- Suarez). This migration adds the REST of each squad without touching
-- those existing rows — no DELETE, no UPDATE to existing players.
--
-- Note on Sergio Busquets: he's already seeded as an Inter Miami player and
-- owned by the messi_fan test account. He announced retirement at the end
-- of the 2025 season, so he's not part of the "current" 2026 roster below —
-- but per the append-only rule, his existing row is left untouched rather
-- than deleted. Ratings below are approximate (not official FIFA ratings).

-- Real Madrid — remaining 2026-27 squad members (Mbappe already seeded)
INSERT INTO players (name, team_id, position, rating, image_url) VALUES
  ('Thibaut Courtois', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'GK', 87, '/images/courtois.png'),
  ('Andriy Lunin', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'GK', 78, '/images/lunin.png'),
  ('Eder Militao', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CB', 83, '/images/militao.png'),
  ('Trent Alexander-Arnold', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'RB', 84, '/images/taa.png'),
  ('Raul Asencio', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CB', 77, '/images/asencio.png'),
  ('Alvaro Carreras', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'LB', 78, '/images/carreras.png'),
  ('Fran Garcia', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'LB', 76, '/images/frangarcia.png'),
  ('Ferland Mendy', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'LB', 78, '/images/mendy.png'),
  ('Dean Huijsen', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CB', 80, '/images/huijsen.png'),
  ('Jude Bellingham', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CAM', 90, '/images/bellingham.png'),
  ('Eduardo Camavinga', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CM', 85, '/images/camavinga.png'),
  ('Federico Valverde', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CM', 88, '/images/valverde.png'),
  ('Aurelien Tchouameni', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CDM', 85, '/images/tchouameni.png'),
  ('Arda Guler', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CAM', 82, '/images/guler.png'),
  ('Dani Ceballos', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CM', 81, '/images/ceballos.png'),
  ('Vinicius Junior', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'LW', 89, '/images/vinicius.png'),
  ('Rodrygo', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'RW', 85, '/images/rodrygo.png'),
  ('Endrick', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'ST', 78, '/images/endrick.png'),
  ('Gonzalo Garcia', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'ST', 75, '/images/gonzalogarcia.png'),
  ('Brahim Diaz', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'CAM', 80, '/images/brahim.png'),
  ('Franco Mastantuono', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'RW', 77, '/images/mastantuono.png');

-- Inter Miami — remaining 2026 squad members (Messi and Suarez already seeded)
INSERT INTO players (name, team_id, position, rating, image_url) VALUES
  ('Dayne St. Clair', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'GK', 80, '/images/stclair.png'),
  ('Rocco Rios Novo', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'GK', 74, '/images/riosnovo.png'),
  ('Sergio Reguilon', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'LB', 78, '/images/reguilon.png'),
  ('Facundo Mura', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'DF', 74, '/images/mura.png'),
  ('Noah Allen', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'DF', 72, '/images/noahallen.png'),
  ('Maximiliano Falcon', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CB', 76, '/images/falcon.png'),
  ('Ian Fray', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'DF', 71, '/images/fray.png'),
  ('Tyler Hall', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CB', 70, '/images/tylerhall.png'),
  ('Cesar Abadia-Reda', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'LB', 68, '/images/abadiareda.png'),
  ('Rodrigo De Paul', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CM', 85, '/images/depaul.png'),
  ('Telasco Segovia', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CM', 74, '/images/segovia.png'),
  ('David Ayala', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CDM', 73, '/images/ayala.png'),
  ('Yannick Bright', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CM', 73, '/images/bright.png'),
  ('Santiago Morales', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CAM', 72, '/images/morales.png'),
  ('Alexander Shaw', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CDM', 71, '/images/shaw.png'),
  ('David Ruiz', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CM', 72, '/images/davidruiz.png'),
  ('Fabian Ruiz', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'MF', 74, '/images/fabianruiz.png'),
  ('Tadeo Allende', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'RW', 80, '/images/allende.png'),
  ('German Berterame', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'ST', 79, '/images/berterame.png'),
  ('Mateo Silvetti', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'RM', 76, '/images/silvetti.png');
