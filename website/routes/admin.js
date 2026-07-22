import express from 'express';
const router = express.Router();
import { loginAdminAccount } from '../functions/accountsTableHelper.js';
import { getTeamsWithPlayerCounts } from '../functions/teamTableHelper.js';
import { getPlayers } from '../functions/playerTableHelper.js';
import { renderAdminLogin } from '../views/adminLogin.js';
import { renderAdmin } from '../views/admin.js';

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/admin/login');
  }
  next();
}

router.get('/admin/login', (req, res) => {
  if (req.session.user && req.session.user.is_admin) {
    return res.redirect('/admin');
  }
  res.send(renderAdminLogin({ error: null }));
});

router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send(renderAdminLogin({ error: 'Username and password are required' }));
  }

  try {
    const admin = await loginAdminAccount(username, password);
    if (!admin) {
      return res.send(renderAdminLogin({ error: 'Not a valid admin login' }));
    }

    req.session.user = admin;
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.send(renderAdminLogin({ error: 'Something went wrong. Try again.' }));
  }
});

router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const teams = await getTeamsWithPlayerCounts();
    const players = await getPlayers();

    res.send(renderAdmin({
      user: req.session.user,
      teams,
      players,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading admin screen');
  }
});

export default router;
