import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import router from '../website/routes/router.js';

// __dirname isn't available in ES Modules, so it's derived from import.meta.url instead
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true })); // for HTML <form> submissions
app.use(express.json()); // for JSON bodies sent by the API client (website/public/js/api-client.js)
app.use(express.static(path.join(__dirname, '..', 'website', 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Routes — server.js only ever talks to the single master router. Every
app.use(router);

// 404 for anything that doesn't match a known route
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`FUT Club app running at http://localhost:${PORT}`);
});
