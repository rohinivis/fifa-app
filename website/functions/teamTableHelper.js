import pool from '../../init/pool.js';

export async function getTeams() {
  const result = await pool.query('SELECT * FROM teams ORDER BY name');
  return result.rows;
}

export async function getTeamsWithPlayerCounts() {
  const result = await pool.query(
    `SELECT t.*, COUNT(p.id)::int AS player_count
     FROM teams t
     LEFT JOIN players p ON p.team_id = t.id
     GROUP BY t.id
     ORDER BY t.name`
  );
  return result.rows;
}

export async function createTeam({ name, league, country }) {
  const result = await pool.query(
    'INSERT INTO teams (name, league, country) VALUES ($1, $2, $3) RETURNING *',
    [name, league || null, country || null]
  );
  return result.rows[0];
}

export async function updateTeam(id, { name, league, country }) {
  const result = await pool.query(
    `UPDATE teams SET
       name = COALESCE($1, name),
       league = COALESCE($2, league),
       country = COALESCE($3, country)
     WHERE id = $4
     RETURNING *`,
    [name, league, country, id]
  );
  return result.rows[0] || null;
}

export async function deleteTeam(id) {
  const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
}
