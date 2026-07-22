-- Test accounts (fake passwords, no real credentials)
INSERT INTO users (username, password, favorite_club) VALUES
  ('messi_fan', '$2b$10$9h/mRQ8N8VZMi01v/n29jugv9SXnFX9RTOoWY7XFf2dPpGRXHm1Ju', 'Inter Miami'),
  ('ronaldo_fan', '$2b$10$em5deINBSmj79R1U7e0ZM.uAViillOx.ZGjvrn9RIBllLnJKk/u3C', 'Al Nassr'),
  ('mbappe_fan', '$2b$10$AxKGCdDGIOhFQIyUUrlOmOZWlvCWXb2q5nuwpXzrisTRe0UiLH1Ra', 'Real Madrid');

-- Teams
INSERT INTO teams (name, league, country) VALUES
  ('Inter Miami', 'MLS', 'USA'),
  ('Al Nassr', 'Saudi Pro League', 'Saudi Arabia'),
  ('Man United', 'Premier League', 'England'),
  ('Real Madrid', 'La Liga', 'Spain'),
  ('Santos FC', 'Brasileirao', 'Brazil'),
  ('Al Arabi', 'Qatar Stars League', 'Qatar');

-- Player pool. team_id is looked up by team name rather than hardcoding an id,
INSERT INTO players (name, team_id, position, rating, image_url) VALUES
  ('Lionel Messi', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'RW', 90, '/images/messi.png'),
  ('Luis Suarez', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'ST', 82, '/images/suarez.png'),
  ('Sergio Busquets', (SELECT id FROM teams WHERE name = 'Inter Miami'), 'CDM', 79, '/images/busquets.png'),
  ('Cristiano Ronaldo', (SELECT id FROM teams WHERE name = 'Al Nassr'), 'ST', 86, '/images/ronaldo.png'),
  ('Bruno Fernandes', (SELECT id FROM teams WHERE name = 'Man United'), 'CAM', 87, '/images/bruno.png'),
  ('Casemiro', (SELECT id FROM teams WHERE name = 'Man United'), 'CDM', 84, '/images/casemiro.png'),
  ('Kylian Mbappe', (SELECT id FROM teams WHERE name = 'Real Madrid'), 'ST', 91, '/images/mbappe.png'),
  -- Corrected: Neymar left Al Hilal in Jan 2025 and is back at Santos FC (verified July 2026)
  ('Neymar Jr', (SELECT id FROM teams WHERE name = 'Santos FC'), 'LW', 87, '/images/neymar.png'),
  ('Marco Verratti', (SELECT id FROM teams WHERE name = 'Al Arabi'), 'CM', 85, '/images/verratti.png');

-- Assign cards to each user
INSERT INTO user_players (user_id, player_id)
SELECT u.id, p.id FROM users u, players p
WHERE (u.username = 'messi_fan' AND p.name IN ('Lionel Messi', 'Luis Suarez', 'Sergio Busquets'))
   OR (u.username = 'ronaldo_fan' AND p.name IN ('Cristiano Ronaldo', 'Bruno Fernandes', 'Casemiro'))
   OR (u.username = 'mbappe_fan' AND p.name IN ('Kylian Mbappe', 'Neymar Jr', 'Marco Verratti'));
