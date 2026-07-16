import express from 'express';
const router = express.Router();

/************************************* USAGE *************************************************
INPUTS: N/A (SESSION: user)
OUTPUTS: JSON { user: { id, username } } OR { user: null }
FUNCTION: LETS CLIENT-SIDE JS (public/js/nav.js) ASK "WHO'S LOGGED IN?" WITHOUT THE PAGE
          ITSELF HAVING TO SERVER-RENDER THAT STATE INTO THE NAV. nav.js CALLS THIS ON
          EVERY PAGE LOAD AND BUILDS ITS OWN MARKUP FROM THE RESULT — THAT'S WHAT MAKES
          THE NAV AN INDEPENDENTLY-LOADED COMPONENT INSTEAD OF AN EJS PARTIAL.
************************************* USAGE **************************************************/
router.get('/api/session', (req, res) => {
  if (!req.session.user) {
    return res.json({ user: null });
  }

  const { id, username, is_admin } = req.session.user;
  res.json({ user: { id, username, is_admin: !!is_admin } });
});

export default router;
