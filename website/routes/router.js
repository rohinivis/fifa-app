import express from 'express';

import indexRoutes from './index.js';
import authRoutes from './auth.js';
import marketRoutes from './market.js';
import apiRoutes from './api.js';
import adminRoutes from './admin.js';
import squadRoutes from './squad.js';
import sessionRoutes from './session.js';

const router = express.Router();

router.use(indexRoutes);
router.use(authRoutes);
router.use(marketRoutes);
router.use(apiRoutes);
router.use(adminRoutes);
router.use(squadRoutes);
router.use(sessionRoutes);

export default router;
