import express from 'express';
const router = express.Router();
import { getAvailablePlayersForUser, getPlayerById } from '../functions/playerTableHelper.js';
import { addPlayerToSquad } from '../functions/squadTableHelper.js';
import { renderMarket } from '../views/market.js';

router.get('/market', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const players = await getAvailablePlayersForUser(req.session.user.id);

    res.send(renderMarket({
      user: req.session.user,
      players,
      added: req.query.added || null,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading market');
  }
});

router.post('/market/add/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const playerId = req.params.id;

  try {
    const player = await getPlayerById(playerId);
    if (!player) {
      return res.redirect('/market');
    }

    await addPlayerToSquad(req.session.user.id, playerId);

    res.redirect(`/market?added=${encodeURIComponent(player.name)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding card');
  }
});

export default router;
