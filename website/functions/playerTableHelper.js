import pool from '../../init/pool.js';

export async function getPlayers() {
  const result = await pool.query(
    `SELECT p.*, t.name AS club FROM players p
     LEFT JOIN teams t ON p.team_id = t.id
     ORDER BY p.rating DESC`
  );
  return result.rows;
}

export async function getPlayerById(id) {
  const result = await pool.query(
    `SELECT p.*, t.name AS club FROM players p
     LEFT JOIN teams t ON p.team_id = t.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createPlayer({ name, team_id, position, rating, image_url }) {
  const result = await pool.query(
    `INSERT INTO players (name, team_id, position, rating, image_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, team_id || null, position, rating, image_url || null]
  );
  return result.rows[0];
}

export async function updatePlayer(id, { name, position, rating, image_url, hasTeamId, team_id }) {
  const result = await pool.query(
    `UPDATE players SET
       name = COALESCE($1, name),
       team_id = CASE WHEN $2 THEN $3 ELSE team_id END,
       position = COALESCE($4, position),
       rating = COALESCE($5, rating),
       image_url = COALESCE($6, image_url)
     WHERE id = $7
     RETURNING *`,
    [name, hasTeamId, team_id, position, rating, image_url, id]
  );
  return result.rows[0] || null;
}

export async function deletePlayer(id) {
  const result = await pool.query('DELETE FROM players WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
}

export async function getAvailablePlayersForUser(userId) {
  const result = await pool.query(
    `SELECT p.*, t.name AS club FROM players p
     LEFT JOIN teams t ON p.team_id = t.id
     WHERE p.id NOT IN (
       SELECT player_id FROM user_players WHERE user_id = $1
     )
     ORDER BY p.rating DESC`,
    [userId]
  );
  return result.rows;
}

export async function getOwnedPlayersForUser(userId) {
  const result = await pool.query(
    `SELECT p.*, t.name AS club FROM players p
     JOIN user_players up ON p.id = up.player_id
     LEFT JOIN teams t ON p.team_id = t.id
     WHERE up.user_id = $1`,
    [userId]
  );
  return result.rows;
}
