import express from 'express';
const router = express.Router();

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW)
FUNCTION: RENDERS THE PUBLIC LANDING PAGE. PASSES session.user SO THE NAV CAN SHOW
          LOGGED-IN VS LOGGED-OUT LINKS
************************************* USAGE **************************************************/
router.get('/', (req, res) => {
  res.render('home', { user: req.session.user });
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RETURNS 200 OK)
FUNCTION: LIGHTWEIGHT HEALTH CHECK ENDPOINT FOR KUBERNETES LIVENESS/READINESS PROBES
************************************* USAGE **************************************************/
router.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (RENDERS VIEW)
FUNCTION: RENDERS THE ABOUT US PAGE
************************************* USAGE **************************************************/
router.get('/about', (req, res) => {
  res.render('about', { user: req.session.user });
});

/************************************* USAGE *************************************************
INPUTS: REQ -> EXPRESS REQUEST, RES -> EXPRESS RESPONSE
OUTPUTS: N/A (REDIRECTS TO HOME)
FUNCTION: DESTROYS THE CURRENT SESSION (LOGGING THE USER OUT) THEN REDIRECTS HOME
************************************* USAGE **************************************************/
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default router;
