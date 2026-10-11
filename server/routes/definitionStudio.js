// Definition Studio API (/api/definition-studio/*). Admin-only in this first slice: a Composer is a
// platform admin until the Composer / Arranger / end-user roles (DEC-SLT-16, -19) get their own
// permissions. Every route has a matching MCP tool (server/lib/mcpToolRegistry.js) calling the same
// function, per the interface-parity rule.
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAdmin } from '../auth.js';
import {
  createProduct, deleteDocument, draftWithAgent, getStudioConfig, listDocuments, listDocumentVersions,
  listWorkspaces, readDocument, restoreDocumentVersion, saveDocument, saveStudioConfig,
} from '../lib/definitionStudio.js';

const router = Router();
router.use(requireAdmin);

const here = path.dirname(fileURLToPath(import.meta.url));
const CANVAS_FILE = path.resolve(here, '..', '..', 'prototypes', 'definition-studio', 'definition-studio.html');
const BOOT_MARKER = '<!--STUDIO_BOOT-->';

const actorOf = (req) => ({ id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role });
const fail = (res, e) => res.status(e.status || 500).json({
  error: e.status ? e.message : 'Something went wrong in the Definition Studio. Try again; if it keeps happening, check the server log.',
  code: e.code, details: e.details,
});
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { if (!e.status) console.error('[definition-studio]', e); fail(res, e); } };

// The canvas page: the process flow builder prototype, with the Studio configuration and the chosen
// workspace injected so the page can build its shape bar and fields before it starts.
router.get('/canvas', wrap(async (req, res) => {
  const workspaceKey = String(req.query.workspace || '');
  const workspaces = await listWorkspaces();
  const workspace = workspaces.find((w) => w.workspaceKey === workspaceKey);
  if (!workspace) {
    res.status(404).type('text/plain').send('Pick a module or product in the Definition Studio first.');
    return;
  }
  const { config } = await getStudioConfig();
  const boot = { workspace, config, apiBase: '/api/definition-studio' };
  const json = JSON.stringify(boot).replace(/</g, '\\u003c');
  const html = fs.readFileSync(CANVAS_FILE, 'utf8').replace(BOOT_MARKER, `<script>window.__STUDIO_BOOT__ = ${json};</script>`);
  res.set('Cache-Control', 'no-store');
  res.type('html').send(html);
}));

router.get('/config', wrap(async (req, res) => { res.json(await getStudioConfig()); }));

router.put('/config', wrap(async (req, res) => {
  res.json(await saveStudioConfig(req.body?.config, req.body?.note, actorOf(req), { req }));
}));

router.get('/workspaces', wrap(async (req, res) => { res.json({ workspaces: await listWorkspaces() }); }));

router.post('/products', wrap(async (req, res) => {
  res.status(201).json({ product: await createProduct(req.body || {}, actorOf(req), { req }) });
}));

router.get('/documents', wrap(async (req, res) => {
  res.json({ documents: await listDocuments(req.query.workspace) });
}));

router.get('/document', wrap(async (req, res) => {
  const doc = await readDocument(req.query.workspace, req.query.key, { version: req.query.version || null });
  res.json({ document: doc });
}));

router.put('/document', wrap(async (req, res) => {
  const { workspace, key, value, note } = req.body || {};
  res.json(await saveDocument(workspace, key, value, actorOf(req), { note }));
}));

router.delete('/document', wrap(async (req, res) => {
  res.json(await deleteDocument(req.query.workspace, req.query.key, actorOf(req), { req }));
}));

router.get('/document/versions', wrap(async (req, res) => {
  res.json({ versions: await listDocumentVersions(req.query.workspace, req.query.key) });
}));

router.post('/document/restore', wrap(async (req, res) => {
  const { workspace, key, version } = req.body || {};
  res.json(await restoreDocumentVersion(workspace, key, version, actorOf(req), { req }));
}));

router.post('/agent-draft', wrap(async (req, res) => { res.json(await draftWithAgent(req.body || {})); }));

export default router;
