import { Router } from 'express';
import { db, getJSON } from '../db.js';
import { requireUser } from '../auth.js';
import { defaultMemberSite } from '../data/defaultMemberSite.js';
import { defaultMemberConfig } from '../data/defaultMemberConfig.js';
import { consentDefinition, recordConsent } from '../lib/consentRegistry.js';
import { hasCapability } from '../lib/customerEntitlements.js';
import { listOrgDocuments, getOrgDocument } from '../lib/orgDocumentProjection.js';
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
router.get('/:orgId/auth-policy', async (req, res) => {
  const ctx = await access(req, res); if (!ctx) return;
  const policy = await db.prepare(`SELECT allowed_routes,preferred_route,sso_provider_key,authenticator_label,require_one_route,updated_at FROM organization_authentication_policies WHERE org_id=$1`).get(ctx.orgId);
  res.json(policy || { allowed_routes: ['password','totp'], preferred_route: null, sso_provider_key: null, authenticator_label: null, require_one_route: true });
});
router.put('/:orgId/auth-policy', async (req, res) => {
  const ctx = await access(req, res); if (!ctx) return; if (!ctx.canEdit) return res.status(403).json({ error: 'organization admin required' });
  const allowed = [...new Set((req.body?.allowedRoutes || []).filter((item) => ['password','totp','sso','organization_authenticator'].includes(item)))];
  if (!allowed.length) return res.status(400).json({ error: 'at least one authentication route is required' });
  const preferred = allowed.includes(req.body?.preferredRoute) ? req.body.preferredRoute : allowed[0];
  await db.prepare(`INSERT INTO organization_authentication_policies (org_id,allowed_routes,preferred_route,sso_provider_key,authenticator_label,require_one_route,updated_by,updated_at) VALUES ($1,$2,$3,$4,$5,true,$6,$7) ON CONFLICT (org_id) DO UPDATE SET allowed_routes=EXCLUDED.allowed_routes,preferred_route=EXCLUDED.preferred_route,sso_provider_key=EXCLUDED.sso_provider_key,authenticator_label=EXCLUDED.authenticator_label,require_one_route=true,updated_by=EXCLUDED.updated_by,updated_at=EXCLUDED.updated_at`).run(ctx.orgId, allowed, preferred, req.body?.ssoProviderKey || null, req.body?.authenticatorLabel || null, req.user.id, Date.now());
  res.json({ ok: true, allowedRoutes: allowed, preferredRoute: preferred, requireOneRoute: true });
});
router.put('/:orgId/members/:userId/capabilities/:capabilityKey', async (req, res) => {
  const ctx = await access(req, res); if (!ctx) return; if (!ctx.canEdit) return res.status(403).json({ error: 'organization admin required' });
  if (!['view','collaborate','configure','admin'].includes(req.body?.permissionLevel)) return res.status(400).json({ error: 'invalid permissionLevel' });
  const member = await db.prepare(`SELECT 1 FROM org_memberships WHERE org_id=$1 AND user_id=$2`).get(ctx.orgId, Number(req.params.userId));
  if (!member) return res.status(404).json({ error: 'organization member not found' });
  await db.prepare(`INSERT INTO member_capability_allocations (org_id,user_id,capability_key,permission_level,allocated_by,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$6) ON CONFLICT (org_id,user_id,capability_key) DO UPDATE SET permission_level=EXCLUDED.permission_level,allocated_by=EXCLUDED.allocated_by,updated_at=EXCLUDED.updated_at`).run(ctx.orgId, Number(req.params.userId), req.params.capabilityKey, req.body.permissionLevel, req.user.id, Date.now());
  res.json({ ok: true });
});
router.get('/:orgId/page-types', async (req,res) => { if(await access(req,res)) res.json((await getJSON('config_state','page_type_definitions'))||{types:[]}); });
for (const r of [{path:'site',table:'org_sites',key:'version'},{path:'config',table:'org_configs',key:'schemaVersion'}]) {
  router.get(`/:orgId/${r.path}`, async (req,res) => { const ctx=await access(req,res); if(!ctx)return; const kind=ctx.canEdit?'draft':'published'; let data=await read(r.table,ctx.orgId,kind); if(!data&&ctx.canEdit){data=r.path==='site'?defaultMemberSite({displayName:ctx.name,slug:ctx.slug}):defaultMemberConfig({displayName:ctx.name});await write(r.table,ctx.orgId,'draft',data,r.key);} if(!data)return res.status(404).json({error:'organization portal is not published'});res.json(data); });
  router.put(`/:orgId/${r.path}`, async (req,res) => { const ctx=await access(req,res);if(!ctx)return;if(!ctx.canEdit)return res.status(403).json({error:'organization portal is read-only'});if(!req.body||typeof req.body!=='object')return res.status(400).json({error:'expected JSON object'});await write(r.table,ctx.orgId,'draft',req.body,r.key);res.json({ok:true}); });
}
// GET /:orgId/documents — gated proposal + product-resource documents
// (org_document_projections), delivered via the 'view_proposal' /
// 'view_product_resources' capabilities granted by grantCustomerViewEntitlement
// (server/lib/customerEntitlements.js) when the member's work email resolved
// this organization. Membership + org consent alone (access()) is not
// enough — the entitlement is the actual gate for document content.
router.get('/:orgId/documents', async (req, res) => {
  const ctx = await access(req, res);
  if (!ctx) return;
  const allowed = (await hasCapability(req.user.id, ctx.orgId, 'view_proposal')) || (await hasCapability(req.user.id, ctx.orgId, 'view_product_resources'));
  if (!allowed) return res.status(403).json({ error: 'entitlement_required' });
  res.json({ documents: await listOrgDocuments(ctx.orgId) });
});

router.get('/:orgId/documents/:id', async (req, res) => {
  const ctx = await access(req, res);
  if (!ctx) return;
  const doc = await getOrgDocument(ctx.orgId, req.params.id);
  if (!doc) return res.status(404).json({ error: 'not found' });
  const capability = doc.document_type === 'proposal' ? 'view_proposal' : 'view_product_resources';
  if (!(await hasCapability(req.user.id, ctx.orgId, capability))) return res.status(403).json({ error: 'entitlement_required' });
  res.json(doc);
});

router.post('/:orgId/publish', async (req,res) => { const ctx=await access(req,res);if(!ctx)return;if(!ctx.canEdit)return res.status(403).json({error:'organization portal is read-only'});for(const [table,key] of [['org_sites','version'],['org_configs','schemaVersion']]){const draft=await read(table,ctx.orgId,'draft');if(!draft)return res.status(404).json({error:`no ${table} draft`});await write(table,ctx.orgId,'published',draft,key);}res.json({ok:true}); });
export default router;
