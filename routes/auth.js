import express from 'express';
const router = express.Router();
import pool from '../db/pool.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW)
FUNCTION: SHOWS THE SIGN UP FORM (USERNAME, PASSWORD, FAVORITE CLUB)
************************************* USAGE **************************************************/
router.get('/signup', async (req, res) => {
  try {
    const teams = await pool.query('SELECT name FROM teams ORDER BY name');
    res.render('signup', { error: null, user: req.session.user, teams: teams.rows });
  } catch (err) {
    console.error(err);
    res.render('signup', { error: null, user: req.session.user, teams: [] });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (BODY: username, password, favorite_club), RES -> EXPRESS RESPONSE
OUTPUTS: N/A (REDIRECTS TO ACCOUNT OR RE-RENDERS VIEW WITH ERROR)
FUNCTION: CREATES A NEW ROW IN users IF THE USERNAME ISN'T ALREADY TAKEN, THEN LOGS THE
          NEW USER IN IMMEDIATELY (NO OWNED CARDS YET SINCE THEY'RE BRAND NEW)
************************************* USAGE **************************************************/
router.post('/signup', async (req, res) => {
  const { username, password, favorite_club } = req.body;

  // Fetched up front so any re-render below (validation error, taken
  // username, db error) still has the list for the favorite_club dropdown.
  const teamsResult = await pool.query('SELECT name FROM teams ORDER BY name').catch(() => ({ rows: [] }));
  const teams = teamsResult.rows;

  if (!username || !password) {
    return res.render('signup', { error: 'Username and password are required', user: null, teams });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.render('signup', { error: 'That username is already taken', user: null, teams });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO users (username, password, favorite_club) VALUES ($1, $2, $3) RETURNING *',
      [username, passwordHash, favorite_club || null]
    );

    req.session.user = result.rows[0];
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    res.render('signup', { error: 'Something went wrong. Try again.', user: null, teams });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW)
FUNCTION: STEP 1 OF LOGIN. RESETS ANY IN-PROGRESS LOGIN AND SHOWS THE USERNAME FORM
************************************* USAGE **************************************************/
router.get('/login', (req, res) => {
  req.session.pendingUsername = null; // starting over clears any in-progress login
  res.render('login-username', { error: null, user: req.session.user });
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (BODY: username), RES -> EXPRESS RESPONSE
OUTPUTS: N/A (REDIRECTS OR RE-RENDERS VIEW WITH ERROR)
FUNCTION: STEP 1 OF LOGIN. VALIDATES USERNAME EXISTS IN DB, STORES IT ON THE SESSION AS
          PENDING, AND ADVANCES TO THE PASSWORD STEP
************************************* USAGE **************************************************/
router.post('/login', async (req, res) => {
  const { username } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.render('login-username', { error: 'No account with that username', user: null });
    }

    req.session.pendingUsername = username;
    res.redirect('/login/password');
  } catch (err) {
    console.error(err);
    res.render('login-username', { error: 'Something went wrong. Try again.', user: null });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW OR REDIRECTS BACK TO STEP 1)
FUNCTION: STEP 2 OF LOGIN. SHOWS THE PASSWORD FORM, BUT ONLY IF A VALID USERNAME WAS
          ALREADY CONFIRMED IN STEP 1 (I.E. session.pendingUsername IS SET)
************************************* USAGE **************************************************/
router.get('/login/password', (req, res) => {
  if (!req.session.pendingUsername) {
    return res.redirect('/login');
  }
  res.render('login-password', {
    error: null,
    user: null,
    username: req.session.pendingUsername,
  });
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (BODY: password, SESSION: pendingUsername), RES -> EXPRESS RESPONSE
OUTPUTS: N/A (REDIRECTS TO ACCOUNT OR RE-RENDERS VIEW WITH ERROR)
FUNCTION: STEP 2 OF LOGIN. VERIFIES USERNAME + PASSWORD AGAINST THE DB. ON SUCCESS,
          INCREMENTS login_count AND STAMPS last_login_at (see db/migrations/0003_add_login_tracking.sql)
          — THIS IS WHAT LETS THE ACCOUNT PAGE GREET A FIRST-TIME LOGIN DIFFERENTLY FROM A
          RETURNING ONE — THEN STORES THE UPDATED USER RECORD ON THE SESSION AND CLEARS
          THE PENDING USERNAME
************************************* USAGE **************************************************/
router.post('/login/password', async (req, res) => {
  const username = req.session.pendingUsername;
  const { password } = req.body;

  if (!username) {
    return res.redirect('/login');
  }

  try {
    // Password can no longer be checked in the WHERE clause since it's now a
    // bcrypt hash — fetch the user by username, then compare the submitted
    // password against the stored hash with bcrypt.compare (which re-hashes
    // the candidate with the same salt embedded in the stored hash).
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.render('login-password', {
        error: 'Incorrect password',
        user: null,
        username,
      });
    }

    const passwordMatches = await bcrypt.compare(password, result.rows[0].password);
    if (!passwordMatches) {
      return res.render('login-password', {
        error: 'Incorrect password',
        user: null,
        username,
      });
    }

    const updated = await pool.query(
      `UPDATE users SET login_count = login_count + 1, last_login_at = now()
       WHERE id = $1
       RETURNING *`,
      [result.rows[0].id]
    );

    req.session.user = updated.rows[0];
    req.session.pendingUsername = null;
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    res.render('login-password', { error: 'Something went wrong. Try again.', user: null, username });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (SESSION: user), RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS DASHBOARD OR REDIRECTS TO LOGIN)
FUNCTION: PROTECTED ROUTE. IF NO USER IS LOGGED IN, REDIRECTS TO /login. OTHERWISE,
          JOINS players TO user_players TO GET THE CARDS OWNED BY THE LOGGED-IN USER
          AND RENDERS THE ACCOUNT DASHBOARD
************************************* USAGE **************************************************/
router.get('/account', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const result = await pool.query(
      `SELECT p.*, t.name AS club FROM players p
       JOIN user_players up ON p.id = up.player_id
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE up.user_id = $1`,
      [req.session.user.id]
    );

    res.render('account', {
      user: req.session.user,
      players: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading account');
  }
});

export default router;
