// Definition Studio — server side (owner direction 2026-10-10; design in
// docs/salt-basin-seven-layer-theory-progress.md, "Definition Studio").
//
// The Studio is the Composer interface: Betsy's process flow builder prototype, served inside the
// platform. This module replaces the prototype's two browser-only dependencies:
//   1. `window.storage` (one browser, one person)  → versioned documents in the database, per workspace.
//   2. direct browser calls to api.anthropic.com  → a server-side draft call with usage recorded.
//
// Workspaces: one per Salt Basin module (`module:<moduleKey>`, from SALT_BASIN_MODULES) plus one per
// product a Composer creates in the Studio (`product:<apiName>`). Composing a product does not make it a
// grantable module — that stays a separate, governed change to SALT_BASIN_MODULES.
//
// Reuse-first note (salt-basin-channel-journey-architecture): the two tables below are new. The Studio's
// documents are opaque, versioned canvas state written by a browser page (templates, the working flow,
// vocabulary lists, client instances) — not a process (rod_type), not rules (Current), not a shared site
// setting (config_state, which has no history per key and no per-workspace scoping). Projecting composed
// flows into Notes, Currents and gate definitions is later phases of the seven-layer build.
import crypto from 'node:crypto';
import { SALT_BASIN_MODULES } from './provisioningPolicyRegistry.js';
import {
  assertValidStudioConfig, defaultStudioConfig, studioConfigProblems, toApiName,
} from './definitionStudioConfig.js';

const dbHelpers = () => import('../db.js');
// Audit from inside the shared functions, so the website and MCP tools record identical entries.
async function record(entry) { const { audit } = await import('./audit.js'); await audit(entry); }

export const STUDIO_CONFIG_ROW_ID = 'definition_studio_config';
export const DRAFTER_AGENT_KEY = 'definition_studio_drafter';
const PLATFORM_WORKSPACE = 'platform';
const COALESCE_WINDOW_MS = 10 * 60 * 1000;
// The server's JSON body limit is 4 MB (server/index.js); stay under it with room for the envelope.
const MAX_VALUE_BYTES = 3.5 * 1024 * 1024;
const KEY_RE = /^[A-Za-z0-9][A-Za-z0-9:_.\-]{0,199}$/;

function err(status, message, code) {
  const e = new Error(message); e.status = status; if (code) e.code = code; return e;
}

// ─── Schema (created lazily, never in bootstrap) ─────────────────────────────────────────────────
let ready;
export function ensureDefinitionStudioSchema() {
  if (ready) return ready;
  ready = (async () => {
    const { db } = await dbHelpers();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS definition_studio_documents (
        id               BIGSERIAL PRIMARY KEY,
        workspace_key    TEXT NOT NULL,
        doc_key          TEXT NOT NULL,
        kind             TEXT NOT NULL,
        current_version  INTEGER NOT NULL DEFAULT 0,
        created_by       BIGINT,
        created_at       BIGINT NOT NULL,
        updated_at       BIGINT NOT NULL,
        deleted_at       BIGINT,
        deleted_by       BIGINT,
        UNIQUE (workspace_key, doc_key)
      );
      CREATE TABLE IF NOT EXISTS definition_studio_document_versions (
        id            BIGSERIAL PRIMARY KEY,
        document_id   BIGINT NOT NULL REFERENCES definition_studio_documents(id) ON DELETE CASCADE,
        version       INTEGER NOT NULL,
        content       TEXT NOT NULL,
        content_hash  TEXT NOT NULL,
        note          TEXT,
        created_by    BIGINT,
        created_at    BIGINT NOT NULL,
        updated_at    BIGINT NOT NULL,
        UNIQUE (document_id, version)
      );
      CREATE INDEX IF NOT EXISTS idx_studio_docs_workspace ON definition_studio_documents (workspace_key) WHERE deleted_at IS NULL;
    `);
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

// ─── Document kinds (derived from the prototype's storage keys) ──────────────────────────────────
export function kindForKey(key) {
  if (key === 'flow:default') return 'working_flow';
  if (key === 'templates:index') return 'template_index';
  if (key.startsWith('template:')) return 'template';
  if (key.startsWith('product:')) return 'product';
  if (/client/i.test(key)) return 'client_instances';
  if (/goal/i.test(key)) return 'business_goals';
  if (/(classification|role|domain|l1)/i.test(key)) return 'vocabulary';
  return 'other';
}

// ─── Workspaces: every module, plus products composed in the Studio ─────────────────────────────
export function moduleWorkspaces() {
  return Object.values(SALT_BASIN_MODULES).map((m) => ({
    workspaceKey: `module:${m.moduleKey}`,
    kind: 'module',
    apiName: m.moduleKey,
    name: m.label,
    description: m.description,
  }));
}

export async function listWorkspaces() {
  await ensureDefinitionStudioSchema();
  const { db } = await dbHelpers();
  const rows = await db.prepare(
    `SELECT d.doc_key, v.content FROM definition_studio_documents d
       JOIN definition_studio_document_versions v ON v.document_id = d.id AND v.version = d.current_version
      WHERE d.workspace_key = $1 AND d.kind = 'product' AND d.deleted_at IS NULL ORDER BY d.created_at`,
  ).all(PLATFORM_WORKSPACE);
  const products = rows.map((r) => {
    let p = {}; try { p = JSON.parse(r.content); } catch { /* unreadable product record */ }
    return { workspaceKey: `product:${p.apiName}`, kind: 'product', apiName: p.apiName, name: p.name, id: p.id, description: p.description || '', status: p.status || 'draft' };
  }).filter((p) => p.apiName);
  return [...moduleWorkspaces(), ...products];
}

async function assertWorkspace(workspaceKey) {
  const ws = String(workspaceKey || '');
  if (ws.startsWith('module:')) {
    if (moduleWorkspaces().some((m) => m.workspaceKey === ws)) return ws;
    throw err(404, 'That module does not exist. Pick a module or product from the list.', 'WORKSPACE_NOT_FOUND');
  }
  if (ws.startsWith('product:')) {
    const all = await listWorkspaces();
    if (all.some((w) => w.workspaceKey === ws)) return ws;
    throw err(404, 'That product does not exist yet. Create it first with "New product".', 'WORKSPACE_NOT_FOUND');
  }
  throw err(400, 'Choose a module or a product to work in.', 'WORKSPACE_REQUIRED');
}

function assertKey(key) {
  const k = String(key || '');
  if (!KEY_RE.test(k)) throw err(400, 'That document name is not valid (letters, digits, colon, dot, dash or underscore, up to 200 characters).', 'KEY_INVALID');
  return k;
}

const hashOf = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ─── Product creation (Compose mode: a brand-new product gets its own workspace) ────────────────
export async function createProduct({ name, description = '' }, actor, { req = null } = {}) {
  const clean = String(name || '').trim();
  if (!clean) throw err(400, 'Give the new product a name.', 'NAME_REQUIRED');
  if (clean.length > 80) throw err(400, 'Keep the product name under 80 characters.', 'NAME_TOO_LONG');
  const apiName = toApiName(clean);
  const existing = await listWorkspaces();
  if (existing.some((w) => w.apiName === apiName)) {
    throw err(409, `A module or product with the API name "${apiName}" already exists. Choose a different name.`, 'API_NAME_TAKEN');
  }
  const seq = existing.filter((w) => w.kind === 'product').length + 1;
  // Identifier rule: plain name + hierarchy-qualified L-number id + immutable API name.
  const product = {
    id: `PRODUCT-L0-${String(seq).padStart(3, '0')}`, hierarchy: 'PRODUCT', level: 0,
    apiName, name: clean, description: String(description || '').slice(0, 500), status: 'draft',
    createdAt: Date.now(),
  };
  await writeDocument(PLATFORM_WORKSPACE, `product:${apiName}`, JSON.stringify(product), actor, { note: 'Product created', internal: true });
  await record({ req, actor, action: 'definition_studio.product.create', entityType: 'definition_studio_product', entityId: product.id, summary: `Created product "${product.name}" (${product.apiName})` });
  return { ...product, workspaceKey: `product:${apiName}` };
}

// ─── Documents (what the canvas page reads and writes through the storage bridge) ───────────────
export async function readDocument(workspaceKey, key, { version = null } = {}) {
  await ensureDefinitionStudioSchema();
  const ws = await assertWorkspace(workspaceKey);
  const k = assertKey(key);
  const { db } = await dbHelpers();
  const doc = await db.prepare(`SELECT * FROM definition_studio_documents WHERE workspace_key=$1 AND doc_key=$2`).get(ws, k);
  if (!doc || doc.deleted_at) return null;
  const v = Number(version) || Number(doc.current_version);
  const row = await db.prepare(`SELECT * FROM definition_studio_document_versions WHERE document_id=$1 AND version=$2`).get(doc.id, v);
  if (!row) return null;
  return {
    workspaceKey: ws, key: k, kind: doc.kind, value: row.content, version: Number(row.version),
    currentVersion: Number(doc.current_version), note: row.note || null, updatedAt: Number(row.updated_at),
  };
}
async function writeDocument(workspaceKey, key, value, actor, { note = null, internal = false } = {}) {
  await ensureDefinitionStudioSchema();
  const ws = internal ? workspaceKey : await assertWorkspace(workspaceKey);
  const k = assertKey(key);
  if (typeof value !== 'string') throw err(400, 'The document content must be text.', 'VALUE_INVALID');
  if (Buffer.byteLength(value, 'utf8') > MAX_VALUE_BYTES) throw err(413, 'That document is larger than 3.5 MB and was not saved. Split the flow into smaller templates.', 'VALUE_TOO_LARGE');
  const cleanNote = note ? String(note).trim().slice(0, 500) || null : null;
  const { db } = await dbHelpers();
  const now = Date.now();
  const hash = hashOf(value);
  const by = actor?.id ?? null;

  return db.raw.begin(async (tx) => {
    let [doc] = await tx`SELECT * FROM definition_studio_documents WHERE workspace_key=${ws} AND doc_key=${k} FOR UPDATE`;
    if (!doc) {
      [doc] = await tx`INSERT INTO definition_studio_documents (workspace_key, doc_key, kind, current_version, created_by, created_at, updated_at)
                       VALUES (${ws}, ${k}, ${kindForKey(k)}, 0, ${by}, ${now}, ${now}) RETURNING *`;
    } else if (doc.deleted_at) {
      [doc] = await tx`UPDATE definition_studio_documents SET deleted_at=NULL, deleted_by=NULL, updated_at=${now} WHERE id=${doc.id} RETURNING *`;
    }
    const [latest] = Number(doc.current_version) > 0
      ? await tx`SELECT * FROM definition_studio_document_versions WHERE document_id=${doc.id} AND version=${doc.current_version}`
      : [null];
    if (latest && latest.content_hash === hash && !cleanNote) {
      return { version: Number(latest.version), changed: false };
    }
    // Autosaves from the same person inside the window fold into one draft version, so history stays
    // readable. A note always starts a new version (a deliberate save point).
    const coalesce = latest && !cleanNote && !latest.note && Number(latest.created_by) === Number(by)
      && now - Number(latest.created_at) < COALESCE_WINDOW_MS;
    if (coalesce) {
      await tx`UPDATE definition_studio_document_versions SET content=${value}, content_hash=${hash}, updated_at=${now} WHERE id=${latest.id}`;
      await tx`UPDATE definition_studio_documents SET updated_at=${now} WHERE id=${doc.id}`;
      return { version: Number(latest.version), changed: true };
    }
    const nextVersion = Number(doc.current_version) + 1;
    await tx`INSERT INTO definition_studio_document_versions (document_id, version, content, content_hash, note, created_by, created_at, updated_at)
             VALUES (${doc.id}, ${nextVersion}, ${value}, ${hash}, ${cleanNote}, ${by}, ${now}, ${now})`;
    await tx`UPDATE definition_studio_documents SET current_version=${nextVersion}, updated_at=${now} WHERE id=${doc.id}`;
    return { version: nextVersion, changed: true };
  });
}

export async function saveDocument(workspaceKey, key, value, actor, opts = {}) {
  return writeDocument(workspaceKey, key, value, actor, { note: opts.note || null });
}

/** Soft delete: the document disappears from the canvas, every version stays for audit. */
export async function deleteDocument(workspaceKey, key, actor, { req = null } = {}) {
  await ensureDefinitionStudioSchema();
  const ws = await assertWorkspace(workspaceKey);
  const k = assertKey(key);
  const { db } = await dbHelpers();
  const res = await db.prepare(`UPDATE definition_studio_documents SET deleted_at=$1, deleted_by=$2, updated_at=$1 WHERE workspace_key=$3 AND doc_key=$4 AND deleted_at IS NULL`)
    .run(Date.now(), actor?.id ?? null, ws, k);
  const deleted = Number(res?.changes || 0) > 0;
  if (deleted) await record({ req, actor, action: 'definition_studio.document.delete', entityType: 'definition_studio_document', entityId: `${ws}/${k}`, summary: 'Removed from the Studio (all versions kept)' });
  return { deleted };
}

export async function listDocuments(workspaceKey) {
  await ensureDefinitionStudioSchema();
  const ws = await assertWorkspace(workspaceKey);
  const { db } = await dbHelpers();
  const rows = await db.prepare(
    `SELECT d.doc_key, d.kind, d.current_version, d.updated_at, u.email AS updated_by_email
       FROM definition_studio_documents d
       LEFT JOIN definition_studio_document_versions v ON v.document_id=d.id AND v.version=d.current_version
       LEFT JOIN users u ON u.id = v.created_by
      WHERE d.workspace_key=$1 AND d.deleted_at IS NULL ORDER BY d.updated_at DESC`,
  ).all(ws);
  return rows.map((r) => ({ key: r.doc_key, kind: r.kind, currentVersion: Number(r.current_version), updatedAt: Number(r.updated_at), updatedBy: r.updated_by_email || null }));
}

export async function listDocumentVersions(workspaceKey, key) {
  await ensureDefinitionStudioSchema();
  const ws = await assertWorkspace(workspaceKey);
  const k = assertKey(key);
  const { db } = await dbHelpers();
  const doc = await db.prepare(`SELECT id, current_version FROM definition_studio_documents WHERE workspace_key=$1 AND doc_key=$2`).get(ws, k);
  if (!doc) throw err(404, 'That document has never been saved in this workspace.', 'DOCUMENT_NOT_FOUND');
  const rows = await db.prepare(
    `SELECT v.version, v.note, v.created_at, v.updated_at, length(v.content) AS size, u.email AS created_by_email
       FROM definition_studio_document_versions v LEFT JOIN users u ON u.id=v.created_by
      WHERE v.document_id=$1 ORDER BY v.version DESC`,
  ).all(doc.id);
  return rows.map((r) => ({
    version: Number(r.version), note: r.note || null, createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
    size: Number(r.size), createdBy: r.created_by_email || null, current: Number(r.version) === Number(doc.current_version),
  }));
}

/** Restoring never rewrites history: the old content becomes a new version with a note. */
export async function restoreDocumentVersion(workspaceKey, key, version, actor, { req = null } = {}) {
  const old = await readDocument(workspaceKey, key, { version });
  if (!old || old.version !== Number(version)) throw err(404, `Version ${version} of that document does not exist.`, 'VERSION_NOT_FOUND');
  const result = await writeDocument(workspaceKey, key, old.value, actor, { note: `Restored version ${version}` });
  await record({ req, actor, action: 'definition_studio.document.restore', entityType: 'definition_studio_document', entityId: `${old.workspaceKey}/${old.key}`, summary: `Restored version ${version} as version ${result.version}` });
  return result;
}

// ─── Studio configuration (config_state row, version +1 per save, with a note) ──────────────────
export async function getStudioConfig() {
  const { getJSON } = await dbHelpers();
  const stored = await getJSON('config_state', STUDIO_CONFIG_ROW_ID).catch(() => null);
  if (!stored?.config) return { config: defaultStudioConfig(), history: [], overridden: false, problems: [] };
  const problems = studioConfigProblems(stored.config);
  if (problems.length) {
    return { config: defaultStudioConfig(), history: stored.history || [], overridden: false, problems };
  }
  return { config: stored.config, history: stored.history || [], overridden: true, problems: [] };
}

export async function saveStudioConfig(next, note, actor, { req = null } = {}) {
  const cleanNote = String(note || '').trim();
  if (!cleanNote) throw err(400, 'Add a change note saying what changed and why.', 'NOTE_REQUIRED');
  const current = await getStudioConfig();
  const candidate = { ...next, schemaVersion: current.config.schemaVersion, version: Number(current.config.version || 1) + 1 };
  assertValidStudioConfig(candidate, current.config);
  const history = [
    ...(current.history || []),
    { version: candidate.version, note: cleanNote.slice(0, 500), by: actor?.email || actor?.name || 'admin', at: Date.now() },
  ].slice(-50);
  const { setJSON } = await dbHelpers();
  await setJSON('config_state', STUDIO_CONFIG_ROW_ID, { config: candidate, history });
  await record({ req, actor, action: 'definition_studio.config.save', entityType: 'config_state', entityId: STUDIO_CONFIG_ROW_ID, summary: `Studio settings version ${candidate.version}: ${cleanNote.slice(0, 120)}` });
  return { config: candidate, history, overridden: true, problems: [] };
}

// ─── Server-side drafting (replaces the prototype's browser call to api.anthropic.com) ──────────
async function ensureDrafterAgent() {
  const { db } = await dbHelpers();
  const now = Date.now();
  await db.prepare(
    `INSERT INTO agent_definitions (org_id, owner_user_id, key, name, pipeline, role_description, objective, capabilities, boundaries, reports_to_agent_id, tier, is_active, created_at, updated_at)
     VALUES (NULL, NULL, $1, $2, 'definition_studio', $3, $4, $5::jsonb, $6::jsonb, NULL, 1, true, $7, $7)
     ON CONFLICT (key) WHERE org_id IS NULL AND owner_user_id IS NULL DO NOTHING`,
  ).run(
    DRAFTER_AGENT_KEY, 'Definition Studio drafter',
    'Drafts step and branch specifications in the Definition Studio when a Composer asks for a draft.',
    'Propose a first draft that a person reviews and edits before saving.',
    ['Draft step specifications', 'Draft branch labels and decision parameters'],
    ['Save anything on its own — every draft lands in the editor for a person to accept or change'],
    now,
  );
  const row = await db.prepare(`SELECT id FROM agent_definitions WHERE key=$1 AND org_id IS NULL AND owner_user_id IS NULL`).get(DRAFTER_AGENT_KEY);
  return Number(row.id);
}

/**
 * Accepts the same request shape the prototype sent to the Messages API ({ system, messages, max_tokens })
 * and returns `{ content }` in the same shape, so the canvas parsing code is unchanged.
 */
export async function draftWithAgent(body = {}) {
  const system = String(body.system || '').slice(0, 20000);
  const messages = Array.isArray(body.messages) ? body.messages.slice(-4) : [];
  const cleanMessages = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20000) }));
  if (!cleanMessages.length || cleanMessages[cleanMessages.length - 1].role !== 'user') {
    throw err(400, 'The draft request needs a question for the agent.', 'DRAFT_REQUEST_INVALID');
  }
  const maxTokens = Math.min(Math.max(Number(body.max_tokens) || 800, 50), 2000);
  const { anthropic, DRAFT_MODEL } = await import('./gtm/anthropicClient.js');
  if (!anthropic) throw err(503, 'AI drafting is not set up on this server yet (no ANTHROPIC_API_KEY). You can still fill in every field by hand.', 'DRAFTING_UNAVAILABLE');
  const { assertAgentLlmBudget, recordAgentLlmUsage } = await import('./agentLlmUsage.js');
  const definitionId = await ensureDrafterAgent();
  const policy = { provider: 'anthropic', model: DRAFT_MODEL, capPeriod: 'month', mode: 'none' };
  await assertAgentLlmBudget(definitionId, policy);
  const response = await anthropic.messages.create({ model: DRAFT_MODEL, max_tokens: maxTokens, system: system || undefined, messages: cleanMessages });
  await recordAgentLlmUsage(definitionId, policy, response.usage || {});
  return { content: response.content || [], model: DRAFT_MODEL };
}
