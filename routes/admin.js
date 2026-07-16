import express from 'express';
const router = express.Router();
import pool from '../db/pool.js';
import bcrypt from 'bcryptjs';

// Admin now has its own login, separate from the regular two-step fan login
// in routes/auth.js. Being logged in as a fan (messi_fan, etc.) no longer
// gets you into /admin — you need an account with is_admin = true (see
// db/migrations/0005_add_admin_role.sql), reached only through /admin/login.

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE, NEXT -> EXPRESS NEXT
OUTPUTS: N/A (CALLS next() IF THE LOGGED-IN USER IS AN ADMIN, OTHERWISE REDIRECTS)
FUNCTION: GATES THE ADMIN SCREEN. UNLIKE requireLogin ELSEWHERE IN THE APP, THIS CHECKS
          is_admin, NOT JUST WHETHER SOMEONE IS LOGGED IN AT ALL — A REGULAR FAN ACCOUNT
          BEING LOGGED IN DOES NOT SATISFY THIS.
************************************* USAGE **************************************************/
function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/admin/login');
  }
  next();
}

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW)
FUNCTION: SHOWS THE DEDICATED ADMIN LOGIN FORM (SEPARATE FROM /login).
************************************* USAGE **************************************************/
router.get('/admin/login', (req, res) => {
  if (req.session.user && req.session.user.is_admin) {
    return res.redirect('/admin');
  }
  res.render('admin-login', { error: null });
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST (BODY: username, password), RES -> EXPRESS RESPONSE
OUTPUTS: N/A (REDIRECTS TO /admin OR RE-RENDERS WITH ERROR)
FUNCTION: VERIFIES THE SUBMITTED CREDENTIALS AGAINST A USER ROW WITH is_admin = true.
          A CORRECT USERNAME/PASSWORD FOR A NON-ADMIN ACCOUNT STILL FAILS HERE — THIS
          ISN'T JUST THE REGULAR LOGIN CHECK WITH A DIFFERENT REDIRECT.
************************************* USAGE **************************************************/
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('admin-login', { error: 'Username and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND is_admin = true', [
      username,
    ]);

    if (result.rows.length === 0) {
      return res.render('admin-login', { error: 'Not a valid admin login' });
    }

    const passwordMatches = await bcrypt.compare(password, result.rows[0].password);
    if (!passwordMatches) {
      return res.render('admin-login', { error: 'Not a valid admin login' });
    }

    req.session.user = result.rows[0];
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.render('admin-login', { error: 'Something went wrong. Try again.' });
  }
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW)
FUNCTION: PROTECTED ROUTE, ADMIN ONLY (SEE requireAdmin ABOVE). DATA-MANAGEMENT SCREEN
          FOR TEAMS AND PLAYERS — LETS AN ADMIN ADD A TEAM, RE-ASSIGN A PLAYER TO A
          DIFFERENT TEAM, OR DELETE EITHER, WITHOUT TOUCHING THE DATABASE DIRECTLY.
          SEPARATE FROM /account, WHICH ONLY LETS A USER MANAGE THEIR OWN SQUAD.
************************************* USAGE **************************************************/
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const teams = await pool.query(
      `SELECT t.*, COUNT(p.id)::int AS player_count
       FROM teams t
       LEFT JOIN players p ON p.team_id = t.id
       GROUP BY t.id
       ORDER BY t.name`
    );

    const players = await pool.query(
      `SELECT p.*, t.name AS club FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       ORDER BY p.rating DESC`
    );

    res.render('admin', {
      user: req.session.user,
      teams: teams.rows,
      players: players.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading admin screen');
  }
});

export default router;
