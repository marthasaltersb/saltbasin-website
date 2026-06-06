// JIRA Cloud integration — Phase A (read-only).
//
// Auth: HTTP Basic with the admin's atlassian email + an API token.
//   - Tokens come from https://id.atlassian.com/manage-profile/security/api-tokens
//   - The base URL is the admin's atlassian.net subdomain
//     (e.g. https://salt-basin.atlassian.net)
//
// Endpoints (all admin-only):
//   GET  /api/jira/config        → current config (api_token stripped)
//   PUT  /api/jira/config        → save base_url + email + token + project
//   POST /api/jira/test          → verify the token + project key against JIRA
//   POST /api/jira/import        → pull issues, create/update backlog rows
//   GET  /api/jira/projects      → list projects available with current creds

import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';

const router = Router();
router.use(requireAdmin);

const SINGLETON = 'singleton';
const JIRA_MIRROR_GROUP_SLUG = 'jira-mirror';

// ── Config CRUD ──
function rowToConfig(r) {
  if (!r) return null;
  return {
    baseUrl: r.base_url,
    email: r.email,
    // Never echo the token back to the client.
    apiTokenSet: !!r.api_token,
    apiTokenPreview: r.api_token ? r.api_token.slice(0, 4) + '…' + r.api_token.slice(-4) : null,
    projectKey: r.project_key,
    fieldMap: r.field_map ? safeJSON(r.field_map) : null,
    lastPullAt: r.last_pull_at ? Number(r.last_pull_at) : null,
    updatedAt: Number(r.updated_at),
  };
}
function safeJSON(s) { try { return JSON.parse(s); } catch { return null; } }

async function readConfig() {
  return db.prepare(`SELECT * FROM jira_config WHERE id = $1`).get(SINGLETON);
}
async function writeConfig({ baseUrl, email, apiToken, projectKey, fieldMap }) {
  const existing = await readConfig();
  const token = apiToken !== undefined ? apiToken : existing?.api_token;
  const map = fieldMap !== undefined ? (fieldMap ? JSON.stringify(fieldMap) : null) : existing?.field_map;
  await db
    .prepare(
      `INSERT INTO jira_config (id, base_url, email, api_token, project_key, field_map, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         base_url = excluded.base_url,
         email = excluded.email,
         api_token = excluded.api_token,
         project_key = excluded.project_key,
         field_map = excluded.field_map,
         updated_at = excluded.updated_at`
    )
    .run(SINGLETON, baseUrl, email, token, projectKey, map, Date.now());
}

router.get('/config', async (req, res) => {
  res.json(rowToConfig(await readConfig()));
});

router.put('/config', async (req, res) => {
  const { baseUrl, email, apiToken, projectKey, fieldMap } = req.body || {};
  if (baseUrl && !/^https?:\/\//.test(baseUrl)) {
    return res.status(400).json({ error: 'baseUrl must start with https://' });
  }
  await writeConfig({ baseUrl, email, apiToken, projectKey, fieldMap });
  res.json({ ok: true, config: rowToConfig(await readConfig()) });
});

// ── JIRA API client (basic auth) ──
function authHeader(cfg) {
  const creds = `${cfg.email}:${cfg.api_token}`;
  return 'Basic ' + Buffer.from(creds, 'utf8').toString('base64');
}
async function jiraGET(cfg, path) {
  const url = `${cfg.base_url.replace(/\/$/, '')}/rest/api/3${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(cfg),
      Accept: 'application/json',
    },
  });
  const body = await res.text();
  let data; try { data = JSON.parse(body); } catch { data = body; }
  if (!res.ok) {
    const msg = (data && data.errorMessages?.[0]) || (typeof data === 'string' ? data.slice(0, 200) : `JIRA ${res.status}`);
    const err = new Error(msg); err.status = res.status; err.body = data; throw err;
  }
  return data;
}

router.post('/test', async (req, res) => {
  const cfg = await readConfig();
  if (!cfg?.base_url || !cfg?.email || !cfg?.api_token) {
    return res.status(400).json({ error: 'baseUrl, email, and apiToken must all be set' });
  }
  try {
    const me = await jiraGET(cfg, '/myself');
    let projectOk = null;
    if (cfg.project_key) {
      try {
        const project = await jiraGET(cfg, `/project/${encodeURIComponent(cfg.project_key)}`);
        projectOk = { id: project.id, key: project.key, name: project.name };
      } catch (e) {
        projectOk = { error: e.message };
      }
    }
    res.json({
      ok: true,
      me: { accountId: me.accountId, email: me.emailAddress, displayName: me.displayName },
      project: projectOk,
    });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message });
  }
});

router.get('/projects', async (req, res) => {
  const cfg = await readConfig();
  if (!cfg?.api_token) return res.status(400).json({ error: 'token not configured' });
  try {
    const list = await jiraGET(cfg, '/project/search?maxResults=50');
    res.json({ projects: (list.values || []).map((p) => ({ id: p.id, key: p.key, name: p.name })) });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// ── Import (read-only pull) ──
// Maps JIRA issues → backlog_items. Idempotent: if jira_issue_key already
// matches, we UPDATE; otherwise INSERT.
router.post('/import', async (req, res) => {
  const cfg = await readConfig();
  if (!cfg?.api_token || !cfg?.project_key) {
    return res.status(400).json({ error: 'apiToken and projectKey required' });
  }

  // Ensure a capability group exists to house imported issues.
  let mirror = await db.prepare(`SELECT id FROM capability_groups WHERE slug = $1`).get(JIRA_MIRROR_GROUP_SLUG);
  if (!mirror) {
    const r = await db
      .prepare(
        `INSERT INTO capability_groups (slug, name, description, color, sort_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`
      )
      .run(JIRA_MIRROR_GROUP_SLUG, 'JIRA Mirror', 'Issues imported from JIRA. Will be replaced by per-project mapping once bidirectional sync ships.', '#0052CC', 999);
    mirror = { id: Number(r.lastInsertRowid) };
  }
  const capabilityId = Number(mirror.id);

  // Search JIRA issues for the configured project.
  let issues = [];
  let startAt = 0;
  const max = 100;
  try {
    while (true) {
      const jql = encodeURIComponent(`project = "${cfg.project_key}" ORDER BY created DESC`);
      const page = await jiraGET(cfg, `/search?jql=${jql}&startAt=${startAt}&maxResults=${max}&fields=summary,description,status,priority,issuetype,assignee,labels,created,updated`);
      issues = issues.concat(page.issues || []);
      if (issues.length >= (page.total || 0) || (page.issues || []).length === 0) break;
      startAt += max;
      if (startAt > 500) break; // safety cap on first cut
    }
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }

  let created = 0, updated = 0;
  for (const it of issues) {
    const key = it.key;
    const f = it.fields || {};
    const title = f.summary || key;
    const summary = title;
    const requirementDetail = adfToPlain(f.description) || null;
    const status = jiraStatusToBacklog(f.status?.statusCategory?.key, f.status?.name);
    const priority = jiraPriorityToBacklog(f.priority?.name);
    const kind = jiraIssueTypeToKind(f.issuetype?.name);
    const tags = JSON.stringify([
      'jira',
      ...(f.labels || []).slice(0, 8),
    ]);

    const existing = await db.prepare(`SELECT id FROM backlog_items WHERE jira_issue_key = $1`).get(key);
    if (existing) {
      await db
        .prepare(
          `UPDATE backlog_items
              SET title = $1, summary = $2, requirement_detail = $3,
                  status = $4, priority = $5, kind = $6, tags = $7,
                  capability_id = COALESCE(capability_id, $8),
                  updated_at = $9
            WHERE id = $10`
        )
        .run(title, summary, requirementDetail, status, priority, kind, tags, capabilityId, Date.now(), Number(existing.id));
      updated += 1;
    } else {
      await db
        .prepare(
          `INSERT INTO backlog_items
            (jira_issue_key, capability_id, kind, title, summary, requirement_detail,
             status, priority, tags, external_ref)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
        )
        .run(key, capabilityId, kind, title, summary, requirementDetail, status, priority, tags, `JIRA:${key}`);
      created += 1;
    }
  }

  await db.prepare(`UPDATE jira_config SET last_pull_at = $1, updated_at = $1 WHERE id = $2`).run(Date.now(), SINGLETON);

  res.json({ ok: true, totalFromJira: issues.length, created, updated });
});

// ── Mappers ──
// JIRA status categories: 'new' | 'indeterminate' | 'done'
function jiraStatusToBacklog(category, name) {
  if (category === 'done') return 'completed';
  if (category === 'indeterminate') return 'in_progress';
  if (category === 'new') return 'pending';
  // Fallback: try to read the human name
  const n = (name || '').toLowerCase();
  if (n.includes('done') || n.includes('closed') || n.includes('resolved')) return 'completed';
  if (n.includes('progress') || n.includes('review')) return 'in_progress';
  if (n.includes('block')) return 'blocked';
  return 'pending';
}
function jiraPriorityToBacklog(p) {
  if (!p) return null;
  const n = p.toLowerCase();
  if (n.includes('highest') || n.includes('critical') || n === 'p0') return 'p0';
  if (n.includes('high') || n === 'p1') return 'p1';
  if (n.includes('medium') || n === 'p2') return 'p2';
  if (n.includes('low') || n === 'p3') return 'p3';
  return null;
}
function jiraIssueTypeToKind(t) {
  if (!t) return 'feature';
  const n = t.toLowerCase();
  if (n.includes('bug') || n.includes('defect')) return 'defect';
  if (n.includes('task') || n.includes('chore')) return 'chore';
  if (n.includes('spike') || n.includes('research')) return 'spike';
  return 'feature';
}

// JIRA Cloud's description field uses Atlassian Document Format (ADF), a
// nested JSON structure. For Phase A we extract just plain text — good
// enough to populate requirement_detail. A future phase can render full ADF
// or convert to markdown.
function adfToPlain(node) {
  if (!node) return null;
  if (typeof node === 'string') return node;
  if (node.type === 'text' && typeof node.text === 'string') return node.text;
  const children = (node.content || []).map(adfToPlain).filter(Boolean);
  // Insert newlines between block-level nodes.
  const blockTypes = new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'codeBlock', 'blockquote']);
  if (blockTypes.has(node.type)) return children.join(' ') + '\n';
  return children.join('');
}

export default router;
