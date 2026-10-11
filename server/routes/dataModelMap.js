// Data model map API (docs/changes/graphify-data-model-map.md). Administrators only: it describes the platform's
// own schema (names and relations, never row data). Every route calls a function in server/lib/dataModelMap.js,
// the same function the MCP tools call.
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import * as DM from '../lib/dataModelMap.js';

const router = Router();
router.use(requireAdmin);

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (e) { res.status(e.status || 500).json({ error: e.message, code: e.code }); }
};

router.get('/catalog', wrap(async (_req, res) => { res.json(await DM.catalogSummary()); }));
router.get('/search', wrap(async (req, res) => { res.json(await DM.searchCatalog(req.query.q)); }));
router.get('/picker', wrap(async (req, res) => { res.json(await DM.dataObjectPicker({ domain: req.query.domain, q: req.query.q, object: req.query.object })); }));
router.get('/tables/:name', wrap(async (req, res) => { res.json({ table: await DM.tableDetail(req.params.name) }); }));
router.get('/rules', wrap(async (_req, res) => { res.json(await DM.getRules()); }));
router.put('/rules', wrap(async (req, res) => { res.json(await DM.saveRules(req.user, req.body || {})); }));
router.delete('/rules', wrap(async (_req, res) => { res.json(await DM.resetRules()); }));

export default router;
