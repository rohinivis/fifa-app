import express from 'express';
const router = express.Router();
import { getTeams } from '../functions/teamTableHelper.js';
import { getAccountByUsername, createAccount, loginAccount } from '../functions/accountsTableHelper.js';
import { getOwnedPlayersForUser } from '../functions/playerTableHelper.js';
import { renderLogin } from '../views/login.js';
import { renderSignup } from '../views/signup.js';
import { renderAccount } from '../views/account.js';

router.get('/login', (req, res) => {
  res.send(renderLogin({ user: req.session.user }));
});

router.get('/signup', async (req, res) => {
  try {
    const teams = await getTeams();
    res.send(renderSignup({ user: req.session.user, teams }));
  } catch (err) {
    console.error(err);
    res.send(renderSignup({ user: req.session.user, teams: [] }));
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const account = await loginAccount(username, password);
    if (!account) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    req.session.user = account;
    res.json({ redirect: '/account' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

router.post('/signup', async (req, res) => {
  const { username, password, favorite_club } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const existing = await getAccountByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'That username is already taken' });
    }

    const account = await createAccount({ username, password, favorite_club });

    req.session.user = account;
    res.json({ redirect: '/account' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
});

router.get('/account', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const players = await getOwnedPlayersForUser(req.session.user.id);

    res.send(renderAccount({
      user: req.session.user,
      players,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading account');
  }
});

export default router;
