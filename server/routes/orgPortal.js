import { Router } from 'express';
import { db, getJSON } from '../db.js';
import { requireUser } from '../auth.js';
import { defaultMemberSite } from '../data/defaultMemberSite.js';
import { defaultMemberConfig } from '../data/defaultMemberConfig.js';
const router = Router();
router.use(requireUser);
async function access(req, res) {
  const orgId = Number(req.params.orgId);
  const row = Number.isInteger(orgId) && await db.prepare(`SELECT om.role, op.name, op.slug FROM org_memberships om JOIN organization_profiles op ON op.id=om.org_id WHERE om.user_id=$1 AND om.org_id=$2`).get(req.user.id, orgId);
  if (!row) { res.status(403).json({ error: 'organization access denied' }); return null; }
  return { orgId, ...row, canEdit: row.role === 'admin' };
}
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
