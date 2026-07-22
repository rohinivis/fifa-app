import express from 'express';
const router = express.Router();

router.get('/api/session', (req, res) => {
  if (!req.session.user) {
    return res.json({ user: null });
  }

  const { id, username, is_admin } = req.session.user;
  res.json({ user: { id, username, is_admin: !!is_admin } });
});

export default router;
