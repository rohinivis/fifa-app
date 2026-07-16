import express from 'express';
const router = express.Router();
import pool from '../db/pool.js';

// This is deliberately separate from routes/api.js's DELETE /api/players/:id.
// That endpoint deletes a player from the whole game (correct for the /admin
// screen, where it's used on purpose). This endpoint only removes the row
// linking ONE player to ONE user's squad (user_players) — it never touches
// the players table itself, so removing a card from your own squad can't
// affect anyone else's squad or the market.

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required for this action' });
  }
  next();
}

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: playerId, SESSION: user), RES -> EXPRESS RESPONSE
OUTPUTS: JSON { removed: true } OR 404 IF THE USER DIDN'T OWN THAT CARD
FUNCTION: PROTECTED WRITE. REMOVES ONE PLAYER FROM THE LOGGED-IN USER'S OWN SQUAD BY
          DELETING THEIR user_players ROW. THE players ROW ITSELF (AND THEREFORE EVERY
          OTHER USER'S COPY OF THAT CARD, AND THE MARKET LISTING) IS UNTOUCHED.
************************************* USAGE **************************************************/
router.delete('/api/squad/:playerId', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM user_players WHERE user_id = $1 AND player_id = $2 RETURNING id',
      [req.session.user.id, req.params.playerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "You don't own that card" });
    }

    res.json({ removed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove player from squad' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (PARAMS: playerId, BODY: toUsername, SESSION: user)
OUTPUTS: JSON { traded: true, player, toUsername } OR 400/404
FUNCTION: PROTECTED WRITE. TRADES A CARD FROM THE LOGGED-IN USER'S SQUAD TO ANOTHER
          USER'S SQUAD BY USERNAME. THIS IS THE "MULTI-RELATIONAL, TRADABLE BETWEEN
          USERS" EXTENSION ADAM FLOATED — user_players ROWS ARE MOVED (ONE DELETED,
          ONE INSERTED) INSIDE A SINGLE TRANSACTION SO A FAILURE HALFWAY THROUGH CAN'T
          LEAVE A CARD OWNED BY NOBODY OR OWNED BY BOTH USERS AT ONCE.
************************************* USAGE **************************************************/
router.post('/api/squad/:playerId/trade', requireLogin, async (req, res) => {
  const { toUsername } = req.body;
  const { playerId } = req.params;

  if (!toUsername) {
    return res.status(400).json({ error: 'toUsername is required' });
  }
  if (toUsername === req.session.user.username) {
    return res.status(400).json({ error: "You can't trade a card to yourself" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Confirm the sender actually owns this card before anything else moves.
    const owned = await client.query(
      'SELECT id FROM user_players WHERE user_id = $1 AND player_id = $2',
      [req.session.user.id, playerId]
    );
    if (owned.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "You don't own that card" });
    }

    const recipient = await client.query('SELECT id FROM users WHERE username = $1', [toUsername]);
    if (recipient.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `No user named ${toUsername}` });
    }
    const recipientId = recipient.rows[0].id;

    // Recipient might already own this exact card (UNIQUE(user_id, player_id)
    // would reject a duplicate insert) — treat that as "nothing to trade" for
    // the sender, but still surface it clearly rather than a raw 500.
    const alreadyOwned = await client.query(
      'SELECT id FROM user_players WHERE user_id = $1 AND player_id = $2',
      [recipientId, playerId]
    );
    if (alreadyOwned.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `${toUsername} already owns that card` });
    }

    await client.query('DELETE FROM user_players WHERE user_id = $1 AND player_id = $2', [
      req.session.user.id,
      playerId,
    ]);
    await client.query('INSERT INTO user_players (user_id, player_id) VALUES ($1, $2)', [
      recipientId,
      playerId,
    ]);

    const player = await client.query('SELECT * FROM players WHERE id = $1', [playerId]);

    await client.query('COMMIT');
    res.json({ traded: true, player: player.rows[0], toUsername });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Trade failed' });
  } finally {
    client.release();
  }
});

export default router;
