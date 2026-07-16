import express from 'express';
const router = express.Router();
import pool from '../db/pool.js';

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW OR REDIRECTS TO LOGIN)
FUNCTION: PROTECTED ROUTE. SHOWS EVERY PLAYER CARD THE LOGGED-IN USER DOES NOT ALREADY
          OWN, SO THEY CAN PICK ONES TO ADD TO THEIR SQUAD
************************************* USAGE **************************************************/
router.get('/market', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const result = await pool.query(
      `SELECT p.*, t.name AS club FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id NOT IN (
         SELECT player_id FROM user_players WHERE user_id = $1
       )
       ORDER BY p.rating DESC`,
      [req.session.user.id]
    );

    res.render('market', {
      user: req.session.user,
      players: result.rows,
      added: req.query.added || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading market');
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: id, SESSION: user), RES -> EXPRESS RESPONSE
OUTPUTS: N/A (REDIRECTS BACK TO /market)
FUNCTION: PROTECTED ROUTE. ADDS THE GIVEN PLAYER TO THE LOGGED-IN USER'S SQUAD BY
          INSERTING A ROW INTO user_players. ON_CONFLICT DO NOTHING GUARDS AGAINST
          DOUBLE-ADDING A CARD THE USER ALREADY OWNS (E.G. DOUBLE SUBMIT)
************************************* USAGE **************************************************/
router.post('/market/add/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const playerId = req.params.id;

  try {
    const player = await pool.query('SELECT name FROM players WHERE id = $1', [playerId]);
    if (player.rows.length === 0) {
      return res.redirect('/market');
    }

    await pool.query(
      `INSERT INTO user_players (user_id, player_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, player_id) DO NOTHING`,
      [req.session.user.id, playerId]
    );

    res.redirect(`/market?added=${encodeURIComponent(player.rows[0].name)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding card');
  }
});

export default router;
