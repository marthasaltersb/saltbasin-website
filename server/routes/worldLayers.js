// World Shell layered navigation API (2026-10-09, docs/changes/world-shell-layers.md).
//   GET /api/world-layers/resolve?at=<serialised stack>
// Same permission checks as the UI: the stack is resolved against the signed-in
// user's own islands, opportunities and outputs; layers they may not open are
// dropped and explained, never revealed.
import { Router } from 'express';
import { requireUser } from '../auth.js';
import { resolveWorldLayers } from '../lib/worldLayersResolve.js';

const router = Router();

router.get('/resolve', requireUser, async (req, res) => {
  try {
    res.json(await resolveWorldLayers(req.user, String(req.query.at || '')));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
