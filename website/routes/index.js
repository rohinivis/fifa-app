import express from 'express';
const router = express.Router();
import { renderHome } from '../views/home.js';
import { renderAbout } from '../views/about.js';

router.get('/', (req, res) => {
  res.send(renderHome({ user: req.session.user }));
});

router.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

router.get('/about', (req, res) => {
  res.send(renderAbout({ user: req.session.user }));
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default router;
