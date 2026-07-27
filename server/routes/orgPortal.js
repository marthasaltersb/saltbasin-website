import { Router } from 'express';
import { db, getJSON } from '../db.js';
import { requireUser } from '../auth.js';
import { defaultMemberSite } from '../data/defaultMemberSite.js';
import { defaultMemberConfig } from '../data/defaultMemberConfig.js';
import { consentDefinition, recordConsent } from '../lib/consentRegistry.js';
const router = Router();
router.use(requireUser);

// Org-scoped consent check — hasCurrentConsent() in consentRegistry.js is
// global per (user, consentType) and can't distinguish "consented for org A"
// from "consented for org B", so this queries consent_actions directly and
// matches on context.orgId, which recordConsent() below always stamps.
async function hasOrgConsent(userId, orgId) {
  const def = consentDefinition('organization_data_scope');
  const latest = await db.prepare(`
    SELECT action, consent_version FROM consent_actions
    WHERE user_id=$1 AND consent_type='organization_data_scope' AND (context->>'orgId')::int = $2
    ORDER BY created_at DESC, id DESC LIMIT 1
  `).get(userId, orgId);
  return !!latest && latest.action === 'granted' && latest.consent_version === def.consentVersion;
}

async function access(req, res) {
  const orgId = Number(req.params.orgId);
  const row = Number.isInteger(orgId) && await db.prepare(`SELECT om.role, op.name, op.slug FROM org_memberships om JOIN organization_profiles op ON op.id=om.org_id WHERE om.user_id=$1 AND om.org_id=$2`).get(req.user.id, orgId);
  if (!row) { res.status(403).json({ error: 'organization access denied' }); return null; }
  if (!(await hasOrgConsent(req.user.id, orgId))) {
    res.status(403).json({ error: 'org_consent_required', orgId });
    return null;
  }
  return { orgId, ...row, canEdit: row.role === 'admin' };
}

// GET /:orgId/consent-status — membership-gated (not full access-gated,
// since its whole purpose is to report on the very consent that gates
// access) status + acknowledgement wording, mirroring the career-consent
// gate pattern (career/consent-status) so the client never hardcodes copy.
router.get('/:orgId/consent-status', async (req, res) => {
  const orgId = Number(req.params.orgId);
  if (!Number.isInteger(orgId)) return res.status(400).json({ error: 'invalid orgId' });
  const membership = await db.prepare(`SELECT 1 FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(req.user.id, orgId);
  if (!membership) return res.status(403).json({ error: 'organization access denied' });
  const def = consentDefinition('organization_data_scope');
  const granted = await hasOrgConsent(req.user.id, orgId);
  res.json({ consentType: 'organization_data_scope', consentVersion: def.consentVersion, granted, acknowledgements: def.acknowledgements });
});

// POST /:orgId/consent — records the organization_data_scope consent for
// this member+org, designating which of their verified emails represents
// their identity in this organization's context. Must be an existing org
// member (any role) — this doesn't grant membership, only unblocks the
// data-access gate above once granted.
router.post('/:orgId/consent', async (req, res) => {
  const orgId = Number(req.params.orgId);
  if (!Number.isInteger(orgId)) return res.status(400).json({ error: 'invalid orgId' });
  const membership = await db.prepare(`SELECT 1 FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(req.user.id, orgId);
  if (!membership) return res.status(403).json({ error: 'organization access denied' });

  const { designatedEmail, granted } = req.body || {};
  if (granted !== true) return res.status(400).json({ error: 'granted (true) is required' });
  if (!designatedEmail) return res.status(400).json({ error: 'designatedEmail is required' });
  const owned = await db.prepare(`SELECT 1 FROM user_emails WHERE user_id=$1 AND email=$2 AND verified=true`).get(req.user.id, designatedEmail);
  if (!owned) return res.status(400).json({ error: 'designatedEmail must be one of your verified emails' });

  const result = await recordConsent(req.user.id, 'organization_data_scope', true, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    context: { orgId, designatedEmail },
  });
  res.json({ ok: true, ...result });
});
async function read(table, orgId, kind) { const row = await db.prepare(`SELECT data FROM ${table} WHERE org_id=$1 AND kind=$2`).get(orgId, kind); return row ? JSON.parse(row.data) : null; }
async function write(table, orgId, kind, data, key) {
  if (data[key] === undefined) data[key] = 1;
  await db.prepare(`INSERT INTO ${table} (org_id,kind,data,updated_at) VALUES ($1,$2,$3,$4) ON CONFLICT (org_id,kind) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`).run(orgId, kind, JSON.stringify(data), Date.now());
}
router.get('/:orgId/context', async (req,res) => { const ctx=await access(req,res); if(ctx) res.json(ctx); });
router.get('/:orgId/page-types', async (req,res) => { if(await access(req,res)) res.json((await getJSON('config_state','page_type_definitions'))||{types:[]}); });
for (const r of [{path:'site',table:'org_sites',key:'version'},{path:'config',table:'org_configs',key:'schemaVersion'}]) {
  router.get(`/:orgId/${r.path}`, async (req,res) => { const ctx=await access(req,res); if(!ctx)return; const kind=ctx.canEdit?'draft':'published'; let data=await read(r.table,ctx.orgId,kind); if(!data&&ctx.canEdit){data=r.path==='site'?defaultMemberSite({displayName:ctx.name,slug:ctx.slug}):defaultMemberConfig({displayName:ctx.name});await write(r.table,ctx.orgId,'draft',data,r.key);} if(!data)return res.status(404).json({error:'organization portal is not published'});res.json(data); });
  router.put(`/:orgId/${r.path}`, async (req,res) => { const ctx=await access(req,res);if(!ctx)return;if(!ctx.canEdit)return res.status(403).json({error:'organization portal is read-only'});if(!req.body||typeof req.body!=='object')return res.status(400).json({error:'expected JSON object'});await write(r.table,ctx.orgId,'draft',req.body,r.key);res.json({ok:true}); });
}
router.post('/:orgId/publish', async (req,res) => { const ctx=await access(req,res);if(!ctx)return;if(!ctx.canEdit)return res.status(403).json({error:'organization portal is read-only'});for(const [table,key] of [['org_sites','version'],['org_configs','schemaVersion']]){const draft=await read(table,ctx.orgId,'draft');if(!draft)return res.status(404).json({error:`no ${table} draft`});await write(table,ctx.orgId,'published',draft,key);}res.json({ok:true}); });
export default router;
