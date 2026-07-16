import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import indexRoutes from './routes/index.js';
import authRoutes from './routes/auth.js';
import marketRoutes from './routes/market.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import squadRoutes from './routes/squad.js';
import sessionRoutes from './routes/session.js';

// __dirname isn't available in ES Modules, so it's derived from import.meta.url instead
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true })); // for HTML <form> submissions
app.use(express.json()); // for JSON bodies sent by the API client (public/js/api-client.js)
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Routes — each router owns a distinct, fully-qualified set of paths.
// indexRoutes:  /            (landing page)
//               /healthz     (k8s probe)
//               /about
//               /logout
// authRoutes:   /signup, /login, /login/password, /account
// marketRoutes: /market, /market/add/:id
// apiRoutes:    /api/players, /api/players/:id, /api/teams — standalone CRUD
//               service, callable via fetch() from any page (see
//               public/js/api-client.js). GET is public, writes require login.
// adminRoutes:  /admin — manage teams/rosters directly (not just your own
//               squad). Login-gated like everything else for now; see the
//               note at the top of routes/admin.js about roles.
// squadRoutes:  /api/squad/:playerId (DELETE) — removes a card from the
//               CURRENT user's own squad only. Kept separate from apiRoutes'
//               DELETE /api/players/:id, which deletes a player globally.
// sessionRoutes: /api/session — tells client-side components (nav.js) who's
//                logged in, without the page having to server-render it.
app.use(indexRoutes);
app.use(authRoutes);
app.use(marketRoutes);
app.use(apiRoutes);
app.use(adminRoutes);
app.use(squadRoutes);
app.use(sessionRoutes);

// 404 for anything that doesn't match a known route
app.use((req, res) => {
  res.status(404).send('Page not found');
});

/************************************* USAGE *************************************************
INPUTS: N/A (READS process.env.PORT)
OUTPUTS: N/A (STARTS THE SERVER, LOGS THE URL)
FUNCTION: BOOTS THE EXPRESS APP AND STARTS LISTENING FOR REQUESTS
************************************* USAGE **************************************************/
app.listen(PORT, () => {
  console.log(`FUT Club app running at http://localhost:${PORT}`);
});
