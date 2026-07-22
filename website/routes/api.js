import express from 'express';
const router = express.Router();
import { getTeams, createTeam, updateTeam, deleteTeam } from '../functions/teamTableHelper.js';
import {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from '../functions/playerTableHelper.js';

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required for this action' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required for this action' });
  }
  if (!req.session.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required for this action' });
  }
  next();
}

router.get('/api/teams', async (req, res) => {
  try {
    const teams = await getTeams();
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load teams' });
  }
});

router.post('/api/teams', requireLogin, async (req, res) => {
  const { name, league, country } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const team = await createTeam({ name, league, country });
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A team with that name already exists' });
    }
    res.status(500).json({ error: 'Failed to create team' });
  }
});

router.put('/api/teams/:id', requireLogin, async (req, res) => {
  const { name, league, country } = req.body;
  try {
    const team = await updateTeam(req.params.id, { name, league, country });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A team with that name already exists' });
    }
    res.status(500).json({ error: 'Failed to update team' });
  }
});

router.delete('/api/teams/:id', requireLogin, async (req, res) => {
  try {
    const team = await deleteTeam(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ deleted: true, team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

router.get('/api/players', async (req, res) => {
  try {
    const players = await getPlayers();
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load players' });
  }
});

router.get('/api/players/:id', async (req, res) => {
  try {
    const player = await getPlayerById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load player' });
  }
});

router.post('/api/players', requireLogin, async (req, res) => {
  const { name, team_id, position, rating, image_url } = req.body;
  if (!name || !position || rating === undefined) {
    return res.status(400).json({ error: 'name, position, and rating are required' });
  }
  try {
    const player = await createPlayer({ name, team_id, position, rating, image_url });
    res.status(201).json(player);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A player with that name already exists on that team' });
    }
    res.status(500).json({ error: 'Failed to create player' });
  }
});

router.put('/api/players/:id', requireAdmin, async (req, res) => {
  const { name, position, rating, image_url } = req.body;
  const hasTeamId = Object.prototype.hasOwnProperty.call(req.body, 'team_id');
  const team_id = hasTeamId ? (req.body.team_id || null) : null;
  try {
    const player = await updatePlayer(req.params.id, {
      name,
      team_id,
      hasTeamId,
      position,
      rating,
      image_url,
    });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

router.delete('/api/players/:id', requireLogin, async (req, res) => {
  try {
    const player = await deletePlayer(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json({ deleted: true, player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;
