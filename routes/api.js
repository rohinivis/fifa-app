import express from 'express';
const router = express.Router();
import pool from '../db/pool.js';

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE, NEXT -> EXPRESS NEXT
OUTPUTS: N/A (CALLS next() IF LOGGED IN, OTHERWISE RESPONDS 401)
FUNCTION: GATES WRITE OPERATIONS (POST/PUT/DELETE) BEHIND A LOGIN CHECK. READS
          (GET) STAY PUBLIC SO ANY PAGE CAN DISPLAY DATA WITHOUT REQUIRING AUTH.
************************************* USAGE **************************************************/
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required for this action' });
  }
  next();
}

/* ---------------------------------- TEAMS ---------------------------------- */

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: JSON ARRAY OF ALL TEAMS
FUNCTION: PUBLIC READ. LISTS EVERY TEAM, USED E.G. TO POPULATE A TEAM DROPDOWN
          WHEN CREATING/EDITING A PLAYER.
************************************* USAGE **************************************************/
router.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load teams' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (BODY: name, league, country; SESSION: user), RES -> EXPRESS RESPONSE
OUTPUTS: JSON OF THE CREATED TEAM
FUNCTION: PROTECTED WRITE. CREATES A NEW TEAM.
************************************* USAGE **************************************************/
router.post('/api/teams', requireLogin, async (req, res) => {
  const { name, league, country } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO teams (name, league, country) VALUES ($1, $2, $3) RETURNING *',
      [name, league || null, country || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A team with that name already exists' });
    }
    res.status(500).json({ error: 'Failed to create team' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: id, BODY: any of name/league/country; SESSION: user)
OUTPUTS: JSON OF THE UPDATED TEAM, OR 404
FUNCTION: PROTECTED WRITE. PARTIAL UPDATE OF A TEAM — ONLY FIELDS PRESENT IN THE BODY
          ARE CHANGED (VIA COALESCE), SAME PATTERN AS PUT /api/players/:id BELOW.
************************************* USAGE **************************************************/
router.put('/api/teams/:id', requireLogin, async (req, res) => {
  const { name, league, country } = req.body;
  try {
    const result = await pool.query(
      `UPDATE teams SET
         name = COALESCE($1, name),
         league = COALESCE($2, league),
         country = COALESCE($3, country)
       WHERE id = $4
       RETURNING *`,
      [name, league, country, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A team with that name already exists' });
    }
    res.status(500).json({ error: 'Failed to update team' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: id, SESSION: user), RES -> EXPRESS RESPONSE
OUTPUTS: JSON CONFIRMATION, OR 404
FUNCTION: PROTECTED WRITE. DELETES A TEAM. PLAYERS ON THAT TEAM ARE NOT DELETED —
          THEIR team_id IS SET TO NULL VIA ON DELETE SET NULL (SEE db/schema.sql), SO
          THEY BECOME UNASSIGNED FREE AGENTS RATHER THAN BEING WIPED OUT.
************************************* USAGE **************************************************/
router.delete('/api/teams/:id', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ deleted: true, team: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

/* --------------------------------- PLAYERS --------------------------------- */

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: JSON ARRAY OF ALL PLAYERS, EACH WITH ITS TEAM NAME JOINED IN
FUNCTION: PUBLIC READ. THE GENERAL-PURPOSE PLAYER LIST THAT ANY PAGE CAN PULL FROM.
************************************* USAGE **************************************************/
router.get('/api/players', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, t.name AS club FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       ORDER BY p.rating DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load players' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: id), RES -> EXPRESS RESPONSE
OUTPUTS: JSON OF A SINGLE PLAYER, OR 404
FUNCTION: PUBLIC READ. FETCHES ONE PLAYER BY ID.
************************************* USAGE **************************************************/
router.get('/api/players/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, t.name AS club FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load player' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (BODY: name, team_id, position, rating, image_url; SESSION: user)
OUTPUTS: JSON OF THE CREATED PLAYER
FUNCTION: PROTECTED WRITE. CREATES A NEW PLAYER CARD.
************************************* USAGE **************************************************/
router.post('/api/players', requireLogin, async (req, res) => {
  const { name, team_id, position, rating, image_url } = req.body;
  if (!name || !position || rating === undefined) {
    return res.status(400).json({ error: 'name, position, and rating are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO players (name, team_id, position, rating, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, team_id || null, position, rating, image_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: id, BODY: any of name/team_id/position/rating/image_url;
        SESSION: user)
OUTPUTS: JSON OF THE UPDATED PLAYER, OR 404
FUNCTION: PROTECTED WRITE. PARTIAL UPDATE — ONLY FIELDS PRESENT IN THE BODY ARE CHANGED,
          EVERYTHING ELSE KEEPS ITS CURRENT VALUE (VIA COALESCE).
************************************* USAGE **************************************************/
router.put('/api/players/:id', requireLogin, async (req, res) => {
  const { name, position, rating, image_url } = req.body;
  // team_id needs to support being explicitly cleared (a player going back to
  // free agent), which COALESCE can't express — COALESCE($2, team_id) would
  // just keep the existing team whenever $2 is null, whether the caller meant
  // "don't touch this" or "set it to null". So it's handled with a CASE
  // instead: hasTeamId tells the query whether the key was sent at all.
  const hasTeamId = Object.prototype.hasOwnProperty.call(req.body, 'team_id');
  const team_id = hasTeamId ? (req.body.team_id || null) : null;
  try {
    const result = await pool.query(
      `UPDATE players SET
         name = COALESCE($1, name),
         team_id = CASE WHEN $2 THEN $3 ELSE team_id END,
         position = COALESCE($4, position),
         rating = COALESCE($5, rating),
         image_url = COALESCE($6, image_url)
       WHERE id = $7
       RETURNING *`,
      [name, hasTeamId, team_id, position, rating, image_url, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: id, SESSION: user), RES -> EXPRESS RESPONSE
OUTPUTS: JSON CONFIRMATION, OR 404
FUNCTION: PROTECTED WRITE. DELETES A PLAYER. user_players ROWS REFERENCING IT ARE
          REMOVED AUTOMATICALLY VIA ON DELETE CASCADE (SEE db/schema.sql).
************************************* USAGE **************************************************/
router.delete('/api/players/:id', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM players WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json({ deleted: true, player: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;
