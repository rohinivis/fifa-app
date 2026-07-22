import express from 'express';
const router = express.Router();
import { removePlayerFromSquad, tradePlayerCard } from '../functions/squadTableHelper.js';

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required for this action' });
  }
  next();
}

const TRADE_FAILURE_STATUS = {
  not_owned: 404,
  no_recipient: 404,
  already_owned: 409,
};

router.delete('/api/squad/:playerId', requireLogin, async (req, res) => {
  try {
    const removed = await removePlayerFromSquad(req.session.user.id, req.params.playerId);

    if (!removed) {
      return res.status(404).json({ error: "You don't own that card" });
    }

    res.json({ removed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove player from squad' });
  }
});

router.post('/api/squad/:playerId/trade', requireLogin, async (req, res) => {
  const { toUsername } = req.body;
  const { playerId } = req.params;

  if (!toUsername) {
    return res.status(400).json({ error: 'toUsername is required' });
  }
  if (toUsername === req.session.user.username) {
    return res.status(400).json({ error: "You can't trade a card to yourself" });
  }

  try {
    const result = await tradePlayerCard({ fromUserId: req.session.user.id, toUsername, playerId });

    if (!result.ok) {
      const status = TRADE_FAILURE_STATUS[result.reason] || 400;
      return res.status(status).json({ error: result.message });
    }

    res.json({ traded: true, player: result.player, toUsername: result.toUsername });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Trade failed' });
  }
});

export default router;
