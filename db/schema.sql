-- FUT Club schema
-- NOTE: this file is the INITIAL schema only. It is only ever run once, against
-- a fresh database (see db/init.js). Once a database exists, ALL further schema
-- changes go into db/migrations/ as new, additive files — this file is never
-- edited again. See db/migrations/README.md for the pattern.
DROP TABLE IF EXISTS user_players;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, -- plaintext for now, homework note: not secure yet
    favorite_club VARCHAR(100)
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    league VARCHAR(100),
    country VARCHAR(100)
);

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INT REFERENCES teams(id) ON DELETE SET NULL,
    position VARCHAR(20) NOT NULL,
    rating INT NOT NULL,
    image_url VARCHAR(255)
);

CREATE TABLE user_players (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    acquired_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, player_id)
);
