// Production smoke test account (admin only). Same functions as the MCP tools production_smoke_account_status /
// production_smoke_account_ready and the World Shell -> Journeys -> Production smoke screen.
// The password is accepted in the request body, hashed, and never returned or logged.
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { audit } from '../lib/audit.js';
import { getSmokeAccountStatus, readySmokeAccount, SMOKE_ACCOUNT } from '../lib/smokeAccount.js';

const router = Router();
router.use(requireAdmin);

const fail = (res, e) => res.status(e.status || 500).json({ error: e.message, code: e.code, details: e.details });
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };

router.get('/account', wrap(async (req, res) => { res.json(await getSmokeAccountStatus()); }));

router.post('/account', wrap(async (req, res) => {
  const out = await readySmokeAccount({ password: req.body?.password, ctx: { ip: req.ip, userAgent: req.get('user-agent') } });
  await audit({ req, actor: req.user, action: 'production_smoke.account.ready', entityType: 'user', entityId: out.userId, summary: `${out.created ? 'Created' : 'Readied'} the fictional smoke test account ${SMOKE_ACCOUNT.email}` });
  res.json(out);
}));

export default router;
