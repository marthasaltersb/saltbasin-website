// Backlog / Requirements Management API.
//
// Admin-only. Members never see this. Surface area:
//
//   GET    /api/backlog/                 → { groups, items }       (full snapshot)
//   GET    /api/backlog/items/:id        → one item (incl. children)
//   POST   /api/backlog/items            → create item
//   PATCH  /api/backlog/items/:id        → partial update
//   DELETE /api/backlog/items/:id        → archive (soft delete via status)
//
//   GET    /api/backlog/groups           → just the capability groups
//   POST   /api/backlog/groups           → create group
//   PATCH  /api/backlog/groups/:id       → rename / recolor / reorder
//
//   POST   /api/backlog/seed             → idempotent: populate from
//                                          server/data/backlog/seed.js if
//                                          tables are empty
//
// The seed endpoint is the trick that lets the admin land on the Backlog tab
// for the first time with everything already populated.

import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { backlogSeed } from '../data/backlog/seed.js';

const router = Router();
router.use(requireAdmin);

// ── helpers ──
function rowToItem(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    capabilityId: r.capability_id ? Number(r.capability_id) : null,
    parentId: r.parent_id ? Number(r.parent_id) : null,
    kind: r.kind,
    title: r.title,
    summary: r.summary,
    userStory: r.user_story,
    requirementDetail: r.requirement_detail,
    businessRules: r.business_rules,
    designSpec: r.design_spec,
    acceptanceCriteria: r.acceptance_criteria,
    processSteps: r.process_steps,
    status: r.status,
    priority: r.priority,
    workSplitClaude: r.work_split_claude == null ? null : Number(r.work_split_claude),
    timeMinutes: r.time_minutes == null ? null : Number(r.time_minutes),
    deployedGithub: !!r.deployed_github,
    deployedRender: !!r.deployed_render,
    deployedNetlify: !!r.deployed_netlify,
    deployRelevance: r.deploy_relevance ? safeJSON(r.deploy_relevance) : null,
    tags: r.tags ? safeJSON(r.tags) : [],
    externalRef: r.external_ref,
    sortOrder: Number(r.sort_order || 0),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}
function rowToGroup(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    slug: r.slug,
    name: r.name,
    description: r.description,
    color: r.color,
    sortOrder: Number(r.sort_order || 0),
    createdAt: Number(r.created_at),
  };
}
function safeJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}

// Map camelCase → snake_case for the writable item columns.
const ITEM_FIELD_MAP = {
  capabilityId: 'capability_id',
  parentId: 'parent_id',
  kind: 'kind',
  title: 'title',
  summary: 'summary',
  userStory: 'user_story',
  requirementDetail: 'requirement_detail',
  businessRules: 'business_rules',
  designSpec: 'design_spec',
  acceptanceCriteria: 'acceptance_criteria',
  processSteps: 'process_steps',
  status: 'status',
  priority: 'priority',
  workSplitClaude: 'work_split_claude',
  timeMinutes: 'time_minutes',
  deployedGithub: 'deployed_github',
  deployedRender: 'deployed_render',
  deployedNetlify: 'deployed_netlify',
  deployRelevance: 'deploy_relevance',
  tags: 'tags',
  externalRef: 'external_ref',
  sortOrder: 'sort_order',
};

function serializeForDb(key, value) {
  if (value === undefined) return undefined;
  if (key === 'deployRelevance' || key === 'tags') {
    return value == null ? null : JSON.stringify(value);
  }
  return value;
}

// ── snapshot ──
router.get('/', async (req, res) => {
  const groups = await db
    .prepare(`SELECT * FROM capability_groups ORDER BY sort_order, name`)
    .all();
  const items = await db
    .prepare(`SELECT * FROM backlog_items ORDER BY sort_order, id`)
    .all();
  res.json({
    groups: groups.map(rowToGroup),
    items: items.map(rowToItem),
  });
});

// ── groups ──
router.get('/groups', async (req, res) => {
  const rows = await db
    .prepare(`SELECT * FROM capability_groups ORDER BY sort_order, name`)
    .all();
  res.json({ groups: rows.map(rowToGroup) });
});

router.post('/groups', async (req, res) => {
  const { slug, name, description, color, sortOrder } = req.body || {};
  if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
  const result = await db
    .prepare(
      `INSERT INTO capability_groups (slug, name, description, color, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`
    )
    .run(slug, name, description || null, color || null, sortOrder ?? 0);
  res.json({ id: Number(result.lastInsertRowid) });
});

router.patch('/groups/:id', async (req, res) => {
  const id = Number(req.params.id);
  const fields = ['name', 'description', 'color', 'sortOrder', 'slug'];
  const sets = [];
  const vals = [];
  let i = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      const col = f === 'sortOrder' ? 'sort_order' : f;
      sets.push(`${col} = $${i++}`);
      vals.push(req.body[f]);
    }
  }
  if (!sets.length) return res.json({ ok: true, noop: true });
  vals.push(id);
  await db.prepare(`UPDATE capability_groups SET ${sets.join(', ')} WHERE id = $${i}`).run(...vals);
  res.json({ ok: true });
});

// ── items ──
router.get('/items/:id', async (req, res) => {
  const row = await db
    .prepare(`SELECT * FROM backlog_items WHERE id = $1`)
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not found' });
  const children = await db
    .prepare(`SELECT * FROM backlog_items WHERE parent_id = $1 ORDER BY sort_order, id`)
    .all(Number(req.params.id));
  res.json({ item: rowToItem(row), children: children.map(rowToItem) });
});

router.post('/items', async (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const cols = ['title'];
  const placeholders = ['$1'];
  const vals = [title];
  let i = 2;
  for (const [camel, snake] of Object.entries(ITEM_FIELD_MAP)) {
    if (camel === 'title') continue;
    if (req.body[camel] !== undefined) {
      cols.push(snake);
      placeholders.push(`$${i++}`);
      vals.push(serializeForDb(camel, req.body[camel]));
    }
  }
  const result = await db
    .prepare(
      `INSERT INTO backlog_items (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`
    )
    .run(...vals);
  res.json({ id: Number(result.lastInsertRowid) });
});

router.patch('/items/:id', async (req, res) => {
  const id = Number(req.params.id);
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [camel, snake] of Object.entries(ITEM_FIELD_MAP)) {
    if (req.body[camel] !== undefined) {
      sets.push(`${snake} = $${i++}`);
      vals.push(serializeForDb(camel, req.body[camel]));
    }
  }
  if (!sets.length) return res.json({ ok: true, noop: true });
  // bump updated_at
  sets.push(`updated_at = $${i++}`);
  vals.push(Date.now());
  vals.push(id);
  await db.prepare(`UPDATE backlog_items SET ${sets.join(', ')} WHERE id = $${i}`).run(...vals);
  res.json({ ok: true });
});

router.delete('/items/:id', async (req, res) => {
  // Soft delete via status. Hard delete would lose context for future audits.
  const id = Number(req.params.id);
  await db
    .prepare(`UPDATE backlog_items SET status = 'archived', updated_at = $1 WHERE id = $2`)
    .run(Date.now(), id);
  res.json({ ok: true });
});

// ── seed ──
// Idempotent: only inserts if both tables are empty. Returns counts so the
// UI can show a "seeded N groups, M items" toast.
router.post('/seed', async (req, res) => {
  const existingGroups = await db.prepare(`SELECT COUNT(*)::int AS n FROM capability_groups`).get();
  const existingItems  = await db.prepare(`SELECT COUNT(*)::int AS n FROM backlog_items`).get();
  if (Number(existingGroups.n) > 0 || Number(existingItems.n) > 0) {
    return res.json({ ok: true, skipped: true, reason: 'already populated', existingGroups: Number(existingGroups.n), existingItems: Number(existingItems.n) });
  }

  const { groups, items } = backlogSeed();
  // Insert groups, capturing slug → new id mapping so items can reference.
  const slugToId = new Map();
  for (const g of groups) {
    const r = await db
      .prepare(
        `INSERT INTO capability_groups (slug, name, description, color, sort_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`
      )
      .run(g.slug, g.name, g.description || null, g.color || null, g.sortOrder ?? 0);
    slugToId.set(g.slug, Number(r.lastInsertRowid));
  }

  let insertedItems = 0;
  for (const item of items) {
    const capabilityId = item.capabilitySlug ? slugToId.get(item.capabilitySlug) || null : null;
    await db
      .prepare(
        `INSERT INTO backlog_items (
           capability_id, kind, title, summary, user_story, requirement_detail,
           business_rules, design_spec, acceptance_criteria, process_steps,
           status, priority, work_split_claude, time_minutes,
           deployed_github, deployed_render, deployed_netlify, deploy_relevance,
           tags, external_ref, sort_order
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
         )`
      )
      .run(
        capabilityId,
        item.kind || 'feature',
        item.title,
        item.summary || null,
        item.userStory || null,
        item.requirementDetail || null,
        item.businessRules || null,
        item.designSpec || null,
        item.acceptanceCriteria || null,
        item.processSteps || null,
        item.status || 'completed',
        item.priority || null,
        item.workSplitClaude ?? null,
        item.timeMinutes ?? null,
        item.deployedGithub ?? false,
        item.deployedRender ?? false,
        item.deployedNetlify ?? false,
        item.deployRelevance ? JSON.stringify(item.deployRelevance) : null,
        item.tags ? JSON.stringify(item.tags) : null,
        item.externalRef || null,
        item.sortOrder ?? 0
      );
    insertedItems += 1;
  }

  res.json({ ok: true, seededGroups: groups.length, seededItems: insertedItems });
});

export default router;
