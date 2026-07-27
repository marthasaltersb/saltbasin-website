import { Router } from 'express';
import { dataSourceDefinition } from '../lib/dataSourceRegistry.js';
import { resolveOwnerUserId } from './careerMaster.js';

const router = Router();

// GET /api/data-sources/:key/rollup?owner=<slug>|me — generic rollup fetch
// for any registered data source. Same ?owner=<slug>|me resolution as
// /api/career/atom-rollups (resolveOwnerUserId), reused rather than
// duplicated.
router.get('/:key/rollup', async (req, res) => {
  const def = dataSourceDefinition(req.params.key);
  if (!def) return res.status(404).json({ error: `Unknown data source: ${req.params.key}` });
  try {
    const ownerUserId = await resolveOwnerUserId(req.query.owner, req);
    const catalog = await def.fetch(ownerUserId, req.query);
    res.json(catalog);
  } catch (e) {
    console.error('[dataSources] rollup failed:', e.message);
    res.status(500).json({ error: 'Failed to compute rollup' });
  }
});

export default router;
