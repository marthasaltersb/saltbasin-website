import { Router } from 'express';
import { requireUser } from '../auth.js';
import { getMemberAccessSummary } from '../lib/memberAccess.js';

const router = Router();

router.get('/me', requireUser, async (req, res) => {
  try {
    res.json(await getMemberAccessSummary(req.user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
