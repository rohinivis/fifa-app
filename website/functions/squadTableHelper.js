import pool from '../../init/pool.js';

export async function addPlayerToSquad(userId, playerId) {
  await pool.query(
    `INSERT INTO user_players (user_id, player_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, player_id) DO NOTHING`,
    [userId, playerId]
  );
}

export async function removePlayerFromSquad(userId, playerId) {
  const result = await pool.query(
    'DELETE FROM user_players WHERE user_id = $1 AND player_id = $2 RETURNING id',
    [userId, playerId]
  );
  return result.rows[0] || null;
}

export async function tradePlayerCard({ fromUserId, toUsername, playerId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Confirm the sender actually owns this card before anything else moves.
    const owned = await client.query(
      'SELECT id FROM user_players WHERE user_id = $1 AND player_id = $2',
      [fromUserId, playerId]
    );
    if (owned.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_owned', message: "You don't own that card" };
    }

    const recipient = await client.query('SELECT id FROM users WHERE username = $1', [toUsername]);
    if (recipient.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'no_recipient', message: `No user named ${toUsername}` };
    }
    const recipientId = recipient.rows[0].id;
  
    const alreadyOwned = await client.query(
      'SELECT id FROM user_players WHERE user_id = $1 AND player_id = $2',
      [recipientId, playerId]
    );
    if (alreadyOwned.rows.length > 0) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'already_owned', message: `${toUsername} already owns that card` };
    }

    await client.query('DELETE FROM user_players WHERE user_id = $1 AND player_id = $2', [
      fromUserId,
      playerId,
    ]);
    await client.query('INSERT INTO user_players (user_id, player_id) VALUES ($1, $2)', [
      recipientId,
      playerId,
    ]);

    const player = await client.query('SELECT * FROM players WHERE id = $1', [playerId]);

    await client.query('COMMIT');
    return { ok: true, player: player.rows[0], toUsername };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
