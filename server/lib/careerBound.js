// Career-bound outputs (2026-10-02) — a tailored resume whose content is a
// SELECTION over the member's Career Master, not a frozen copy of its text.
//
// Career Master holds facts (company / title / dates) and a per-job library
// of bullet variants (career_jobs.bullet_variants). An output stores only
// which jobs appear, which library bullets (in what order), and any wording
// the member overrode FOR THAT OUTPUT ONLY. It is resolved against Career
// Master every time it is rendered, so a fact edited in Career Master flows
// into every output.
//
// generated_content shape ("career_bound", v1):
//   { format: 'career_bound', version: 1,
//     header: { name, headline, contact },
//     sections: [ <document_blocks block: heading|paragraph|bullet|table|role|figure>
//               | { type: 'job', jobId } ],          // ordered; 'job' = a resolved Career Master job
//     jobs: [ { jobId, bulletIds: [id, ...],         // ordered; library ids or extra ids
//               extraBullets?: [{ id: 'x_1', text }], // output-only bullets with no library entry
//               overrides?: { [bulletId]: text },     // output-only rewording of a library bullet
//               titleOverride?, datesOverride? } ],   // output-only fact wording
//     source?: { kind: 'package', packageKey, variant, projectionId } }
//
// resolveCareerBound() turns it into a document_blocks v1 content (bullet
// blocks additionally carry `outputOnly: true` when their wording is not the
// library's), so the existing view / PDF / QR renderers need only that one
// extra flag. Nothing here finalizes an output (no approve/publish path);
// approval stays in applicationPackages.js / resumeProjection.js, both of
// which call assertReadyToFinalize().
import crypto from 'node:crypto';
import { db } from '../db.js';
import { syncSingleEntry } from './careerAtomMigration.js';
import { notifyCareerChanged } from './careerChangeEvents.js';
import { createResumeOutputProjection } from './resumeProjection.js';

export const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const yearsOf = (s) => (String(s || '').match(/(?:19|20)\d{2}|present/gi) || []).map((y) => y.toLowerCase());
const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
export const shortHash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 10);

export class CareerBoundError extends Error {
  constructor(message, status = 400, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function isCareerBound(content) {
  return content?.format === 'career_bound' && Number(content.version) === 1;
}

/** "Aug 2013 – Present" -> { startDate: 'Aug 2013', endDate: 'Present' } */
export function splitDates(text) {
  const parts = String(text || '').split(/\s*[–—]\s*|\s+-\s+|\s+to\s+/i).map((p) => p.trim()).filter(Boolean);
  return { startDate: parts[0] || null, endDate: parts[1] || null };
}

export function formatJobDates(job) {
  const start = job.start_date ?? job.startDate;
  const end = job.end_date ?? job.endDate;
  return [start, end].filter(Boolean).join(' – ');
}

export function bulletsOf(job) {
  const v = parseJson(job.bullet_variants ?? job.bulletVariants);
  return Array.isArray(v) ? v : [];
}

export async function loadJobs(userId) {
  return db.prepare(`SELECT * FROM career_jobs WHERE user_id=$1 ORDER BY order_index, id`).all(userId);
}

/**
 * Which Career Master job does a package role describe? Company first-word
 * (as packageRoleCheck.js), then title / start-year / end-year scoring so two
 * roles at one company are told apart. Returns null when nothing is both
 * unique and plausible - the caller turns that into an "add job" task.
 */
export function matchJob(role, jobs) {
  const key = norm(role.company).split(' ')[0];
  const candidates = (jobs || []).filter((j) => norm(j.company).split(' ')[0] === key);
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  const pkgTitle = norm(role.title);
  const rYears = yearsOf(role.dates);
  const scored = candidates.map((j) => {
    const jt = norm(j.title);
    const jy = yearsOf(`${j.start_date ?? j.startDate} ${j.end_date ?? j.endDate}`);
    let score = 0;
    if (pkgTitle && jt === pkgTitle) score += 3;
    else if (pkgTitle && (jt.includes(pkgTitle) || pkgTitle.includes(jt))) score += 2;
    if (rYears[0] && jy[0] === rYears[0]) score += 2;
    if (rYears[1] && jy[1] === rYears[1]) score += 1;
    return { j, score };
  }).sort((a, b) => b.score - a.score);
  if (scored[0].score < 2 || (scored[1] && scored[1].score === scored[0].score)) return null;
  return scored[0].j;
}

/** Roles of a document_blocks resume with the bullets listed under each. */
export function rolesWithBullets(content) {
  const blocks = content?.blocks || [];
  const roles = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.type !== 'role') continue;
    const [company, ...rest] = String(b.title || '').split('|').map((s) => s.trim());
    let title = rest.join(' | ');
    let j = i + 1;
    if (!title && blocks[j]?.type === 'paragraph' && blocks[j].emphasis === 'italic') { title = blocks[j].text; j += 1; }
    const bullets = [];
    for (; j < blocks.length && blocks[j].type === 'bullet'; j += 1) bullets.push(blocks[j].text);
    roles.push({ index: i, company, title, dates: b.dates || '', bullets });
  }
  return roles;
}

const LIST_HEADINGS = [
  ['certifications', /certif|licen[cs]/i],
  ['tools', /\btools?\b|technolog|platforms?|systems/i],
  ['skills', /skill|expertise|competenc|capabilit/i],
];

/**
 * Skills / tools / certifications groups of a document_blocks resume: a
 * heading whose text names one of them, then the paragraphs/bullets/table
 * cells until the next heading or role. Items are split on , ; | and bullets.
 */
export function listGroupsFromDocument(content) {
  const blocks = content?.blocks || [];
  const groups = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.type !== 'heading') continue;
    const hit = LIST_HEADINGS.find(([, re]) => re.test(String(b.text || '')));
    if (!hit) continue;
    const items = [];
    let j = i + 1;
    const push = (text) => {
      let t = String(text || '');
      const colon = t.indexOf(':');
      if (colon > 0 && colon < 32) t = t.slice(colon + 1);
      for (const part of t.split(/[,;|•·\n]/)) { const v = part.trim().replace(/\.$/, ''); if (v) items.push(v); }
    };
    for (; j < blocks.length && blocks[j].type !== 'heading' && blocks[j].type !== 'role'; j += 1) {
      const x = blocks[j];
      if (x.type === 'paragraph' || x.type === 'bullet') push(x.text);
      else if (x.type === 'table') (x.rows || []).forEach((row) => (Array.isArray(row) ? row : []).forEach((c) => push(typeof c === 'string' ? c : c?.text)));
    }
    groups.push({ entity: hit[0], headingIndex: i, endIndex: j, title: b.text, items: [...new Set(items)] });
  }
  return groups;
}

// ── bullet library (Career Master) ─────────────────────────────────────────

function newBulletId() {
  return `b_${crypto.randomBytes(5).toString('hex')}`;
}

/** Runs the Career Atom sync for a changed job; returns an error message or null (never swallows). */
export async function syncEntryAtoms(userId, table, id) {
  try {
    await syncSingleEntry(userId, table, id);
    return null;
  } catch (e) {
    console.error('[careerBound] atom sync failed:', e.message);
    return e.message || 'Career Atom sync failed';
  }
}
export const syncJobAtoms = (userId, jobId) => syncEntryAtoms(userId, 'career_jobs', jobId);

/** Adds a bullet to a job's library (no-op when the same wording is already there). Same side effects as Career Master CRUD. */
export async function addBulletVariant(userId, jobId, { text, source = { kind: 'manual', ref: null }, tags = [] }) {
  const clean = String(text || '').trim();
  if (!clean) throw new CareerBoundError('Bullet text is required.');
  const job = await db.prepare(`SELECT * FROM career_jobs WHERE id=$1 AND user_id=$2`).get(jobId, userId);
  if (!job) throw new CareerBoundError('Career Master job not found.', 404);
  const existing = bulletsOf(job);
  const dup = existing.find((v) => norm(v.text) === norm(clean));
  if (dup) return { bullet: dup, created: false, syncError: null };
  const bullet = { id: newBulletId(), text: clean, source, createdAt: Date.now(), tags };
  await db.prepare(`UPDATE career_jobs SET bullet_variants=$1::jsonb, updated_at=$2 WHERE id=$3 AND user_id=$4`)
    .run([...existing, bullet], Date.now(), jobId, userId);
  const syncError = await syncJobAtoms(userId, jobId);
  notifyCareerChanged(userId);
  return { bullet, created: true, syncError };
}

export async function updateBulletVariant(userId, jobId, bulletId, { text, tags }) {
  const job = await db.prepare(`SELECT * FROM career_jobs WHERE id=$1 AND user_id=$2`).get(jobId, userId);
  if (!job) throw new CareerBoundError('Career Master job not found.', 404);
  const list = bulletsOf(job);
  const idx = list.findIndex((v) => v.id === bulletId);
  if (idx < 0) throw new CareerBoundError('Bullet not found.', 404);
  const next = { ...list[idx] };
  if (text !== undefined) {
    if (!String(text).trim()) throw new CareerBoundError('Bullet text is required.');
    next.text = String(text).trim();
  }
  if (tags !== undefined) next.tags = Array.isArray(tags) ? tags : [];
  next.updatedAt = Date.now();
  list[idx] = next;
  await db.prepare(`UPDATE career_jobs SET bullet_variants=$1::jsonb, updated_at=$2 WHERE id=$3 AND user_id=$4`).run(list, Date.now(), jobId, userId);
  const syncError = await syncJobAtoms(userId, jobId);
  notifyCareerChanged(userId);
  return { bullet: next, syncError };
}

export async function deleteBulletVariant(userId, jobId, bulletId) {
  const job = await db.prepare(`SELECT * FROM career_jobs WHERE id=$1 AND user_id=$2`).get(jobId, userId);
  if (!job) throw new CareerBoundError('Career Master job not found.', 404);
  const list = bulletsOf(job);
  if (!list.some((v) => v.id === bulletId)) throw new CareerBoundError('Bullet not found.', 404);
  await db.prepare(`UPDATE career_jobs SET bullet_variants=$1::jsonb, updated_at=$2 WHERE id=$3 AND user_id=$4`)
    .run(list.filter((v) => v.id !== bulletId), Date.now(), jobId, userId);
  const syncError = await syncJobAtoms(userId, jobId);
  notifyCareerChanged(userId);
  return { ok: true, syncError };
}

// ── content validation + resolution ───────────────────────────────────────

const SECTION_BLOCKS = new Set(['heading', 'paragraph', 'bullet', 'role', 'table', 'figure']);

// Career Master lists a section can bind to. `ids` pick (and order) the rows;
// `overrides[id]` rewords one row for this output only; `extras` are
// output-only entries with no Career Master row. Read from Career Master on
// every resolve, so renaming a skill there flows into every bound output.
export const MASTER_LISTS = {
  skills: { table: 'career_skills', defaultTitle: 'SKILLS', label: (r) => r.skill },
  tools: { table: 'career_tools', defaultTitle: 'TOOLS & TECHNOLOGIES', label: (r) => r.current_name || r.name_used },
  certifications: { table: 'career_certifications', defaultTitle: 'CERTIFICATIONS', label: (r) => r.name },
};

export async function loadMasterList(userId, entity) {
  const def = MASTER_LISTS[entity];
  if (!def) throw new CareerBoundError(`Unknown Career Master list: ${entity}.`);
  const rows = await db.prepare(`SELECT * FROM ${def.table} WHERE user_id=$1 ORDER BY order_index, id`).all(userId);
  return rows.map((r) => ({ id: Number(r.id), label: def.label(r) }));
}

export function validateCareerBound(content) {
  if (!isCareerBound(content)) throw new CareerBoundError('Output content must be career_bound v1.');
  if (!Array.isArray(content.sections)) throw new CareerBoundError('sections must be an array.');
  if (!Array.isArray(content.jobs)) throw new CareerBoundError('jobs must be an array.');
  const configs = new Map();
  for (const j of content.jobs) {
    if (!Number.isInteger(Number(j?.jobId))) throw new CareerBoundError('Every job needs a numeric jobId.');
    if (!Array.isArray(j.bulletIds) || !j.bulletIds.every((b) => typeof b === 'string')) throw new CareerBoundError('bulletIds must be a list of ids.');
    if (j.overrides != null && (typeof j.overrides !== 'object' || Array.isArray(j.overrides))) throw new CareerBoundError('overrides must be an object.');
    for (const x of j.extraBullets || []) if (!x?.id || typeof x.text !== 'string') throw new CareerBoundError('extraBullets need id and text.');
    configs.set(Number(j.jobId), j);
  }
  for (const s of content.sections) {
    if (s?.type === 'job') {
      if (!configs.has(Number(s.jobId))) throw new CareerBoundError(`Section references job ${s.jobId} with no jobs[] entry.`);
    } else if (s?.type === 'master_list') {
      if (!MASTER_LISTS[s.entity]) throw new CareerBoundError('master_list needs entity skills, tools or certifications.');
      if (!Array.isArray(s.ids) || !s.ids.every((x) => Number.isInteger(Number(x)))) throw new CareerBoundError('master_list ids must be Career Master row ids.');
      if (s.overrides != null && (typeof s.overrides !== 'object' || Array.isArray(s.overrides))) throw new CareerBoundError('master_list overrides must be an object.');
      for (const x of s.extras || []) if (!x?.id || typeof x.text !== 'string') throw new CareerBoundError('master_list extras need id and text.');
    } else if (!SECTION_BLOCKS.has(s?.type)) {
      throw new CareerBoundError('sections has an unrecognized block type.');
    }
  }
  return true;
}

/**
 * Resolves career_bound content against the member's current Career Master.
 * Returns { content: document_blocks v1 (+ outputOnly flags), warnings: [] }.
 * A job or bullet that no longer exists is reported in `warnings` (and left
 * out of the blocks) - never silently replaced.
 */
export async function resolveCareerBound(userId, content) {
  validateCareerBound(content);
  const jobs = await loadJobs(userId);
  const byId = new Map(jobs.map((j) => [Number(j.id), j]));
  const configByJob = new Map(content.jobs.map((j) => [Number(j.jobId), j]));
  const blocks = [];
  const warnings = [];
  const listCache = new Map();
  for (const s of content.sections) {
    if (s.type === 'master_list') {
      if (!listCache.has(s.entity)) listCache.set(s.entity, new Map((await loadMasterList(userId, s.entity)).map((r) => [r.id, r.label])));
      const rows = listCache.get(s.entity);
      const parts = [];
      let outputOnly = false;
      for (const id of s.ids.map(Number)) {
        const label = rows.get(id);
        if (label == null) { warnings.push({ kind: 'list_item_missing', entity: s.entity, id, message: `A ${s.entity.slice(0, -1)} selected for this output (#${id}) was removed from Career Master; it is left out.` }); continue; }
        const o = s.overrides?.[id] ?? s.overrides?.[String(id)];
        const text = typeof o === 'string' && o.trim() ? o.trim() : label;
        if (text !== label) outputOnly = true;
        parts.push(text);
      }
      for (const x of s.extras || []) { parts.push(x.text); outputOnly = true; }
      blocks.push({ type: 'heading', text: s.title || MASTER_LISTS[s.entity].defaultTitle });
      if (parts.length) blocks.push({ type: 'paragraph', text: parts.join(', '), ...(outputOnly ? { outputOnly: true } : {}) });
      continue;
    }
    if (s.type !== 'job') { blocks.push(s); continue; }
    const cfg = configByJob.get(Number(s.jobId));
    const job = byId.get(Number(s.jobId));
    if (!job) { warnings.push({ kind: 'job_missing', jobId: Number(s.jobId), message: `Career Master job #${s.jobId} no longer exists; it is left out of this output.` }); continue; }
    const titleOverridden = !!(cfg.titleOverride && cfg.titleOverride !== job.title);
    blocks.push({
      type: 'role',
      title: `${job.company} | ${cfg.titleOverride || job.title}`,
      dates: cfg.datesOverride || formatJobDates(job),
      ...(titleOverridden || cfg.datesOverride ? { outputOnly: true } : {}),
    });
    if (cfg.showKeyMetrics) {
      const km = typeof cfg.keyMetricsOverride === 'string' && cfg.keyMetricsOverride.trim() ? cfg.keyMetricsOverride.trim() : String(job.key_metrics || '').trim();
      if (km) blocks.push({ type: 'paragraph', text: km, emphasis: 'italic', ...(km !== String(job.key_metrics || '').trim() ? { outputOnly: true } : {}) });
    }
    const library = new Map(bulletsOf(job).map((v) => [v.id, v]));
    const extras = new Map((cfg.extraBullets || []).map((x) => [x.id, x]));
    for (const id of cfg.bulletIds) {
      const lib = library.get(id);
      const extra = extras.get(id);
      const override = cfg.overrides && typeof cfg.overrides[id] === 'string' && cfg.overrides[id].trim() ? cfg.overrides[id] : null;
      if (lib) {
        blocks.push({ type: 'bullet', text: override || lib.text, bulletId: id, ...(override && override !== lib.text ? { outputOnly: true } : {}) });
      } else if (extra) {
        blocks.push({ type: 'bullet', text: override || extra.text, bulletId: id, outputOnly: true });
      } else {
        warnings.push({ kind: 'bullet_missing', jobId: Number(job.id), bulletId: id, message: `A bullet selected for ${job.company} (${id}) was removed from Career Master; it is left out of this output.` });
      }
    }
  }
  return { content: { format: 'document_blocks', version: 1, header: content.header || {}, blocks, resolvedFrom: 'career_bound' }, warnings };
}

/** For renderers: the content to draw (resolved when career_bound, else as stored). */
export async function contentForRendering(userId, content) {
  if (!isCareerBound(content)) return { content, warnings: [] };
  return resolveCareerBound(userId, content);
}

/** Strips owner-only markers for public/PDF output. */
export function publicBlocks(content) {
  if (!content?.blocks) return content;
  return { ...content, blocks: content.blocks.map((b) => { const { outputOnly, bulletId, ...rest } = b; return rest; }) };
}

export async function openPackageTaskCount(userId) {
  const r = await db.prepare(`
    SELECT COUNT(*) AS n FROM career_reconciliation_tasks t JOIN journey_data_rods d ON d.id = t.rod_id
     WHERE d.user_id=$1 AND t.status='open'
  `).get(userId);
  return Number(r?.n || 0);
}

/** Starting content for a new output: every Career Master job (with its whole bullet library) and all three lists. */
export async function defaultCareerBoundContent(userId, { name = '' } = {}) {
  const jobs = await loadJobs(userId);
  const sections = [];
  const cfgs = [];
  if (jobs.length) sections.push({ type: 'heading', text: 'EXPERIENCE' });
  for (const j of jobs) {
    sections.push({ type: 'job', jobId: Number(j.id) });
    cfgs.push({ jobId: Number(j.id), bulletIds: bulletsOf(j).map((b) => b.id) });
  }
  for (const entity of Object.keys(MASTER_LISTS)) {
    const rows = await loadMasterList(userId, entity);
    if (rows.length) sections.push({ type: 'master_list', entity, ids: rows.map((r) => r.id), overrides: {}, extras: [] });
  }
  return { format: 'career_bound', version: 1, header: { name, headline: '', contact: '' }, sections, jobs: cfgs };
}

// ── create / update ───────────────────────────────────────────────────────

const CAREER_BOUND_OUTPUT_TYPES = new Set(['resume']);

export async function createCareerBoundOutput(userId, { name, content, presetKey = null, regenerateFromId = null, authors = null, sourceCreatedAt = null }) {
  validateCareerBound(content);
  await assertJobsOwned(userId, content);
  const key = presetKey || `career_bound:${shortHash(`${name}|${Date.now()}|${Math.random()}`)}`;
  const projection = await createResumeOutputProjection(userId, {
    presetId: key.startsWith('career_bound:') || key.startsWith('application_package:') ? key : `career_bound:${key}`,
    presetName: name || 'Career-bound resume',
    generatedContent: content,
    outputType: 'resume',
    source: 'imported',
    regenerateFromId,
    authors,
    sourceCreatedAt,
  });
  return projection;
}

async function assertJobsOwned(userId, content) {
  const ids = [...new Set(content.jobs.map((j) => Number(j.jobId)))];
  if (!ids.length) return;
  const rows = await db.prepare(`SELECT id FROM career_jobs WHERE user_id=$1 AND id = ANY($2::bigint[])`).all(userId, ids);
  const have = new Set(rows.map((r) => Number(r.id)));
  const missing = ids.filter((i) => !have.has(i));
  if (missing.length) throw new CareerBoundError(`Career Master job(s) not found: ${missing.join(', ')}.`, 404);
}

/**
 * Saves new selection/overrides. A draft is edited in place; an approved or
 * published version is never altered (its QR and approval record must keep
 * meaning what was approved) - instead the edit becomes a new draft version
 * in the same lineage.
 */
export async function updateCareerBoundOutput(userId, projectionId, { name, content }) {
  const row = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
  if (!row) throw new CareerBoundError('Output not found.', 404);
  const current = parseJson(row.generated_content);
  if (!isCareerBound(current)) throw new CareerBoundError('This output is not career-bound.', 409);
  validateCareerBound(content);
  await assertJobsOwned(userId, content);
  if (row.output_status === 'draft') {
    await db.prepare(`UPDATE resume_output_projections SET generated_content=$1::jsonb, preset_name=COALESCE($2, preset_name), updated_at=$3 WHERE id=$4 AND user_id=$5`)
      .run(content, name || null, Date.now(), projectionId, userId);
    return { id: Number(projectionId), newVersion: false };
  }
  const created = await createResumeOutputProjection(userId, {
    presetId: row.preset_id,
    presetName: name || row.preset_name,
    generatedContent: content,
    outputType: row.output_type || 'resume',
    source: 'imported',
    regenerateFromId: Number(projectionId),
    targetJobDescription: row.target_job_description,
    authors: parseJson(row.authors),
    sourceCreatedAt: row.source_created_at != null ? Number(row.source_created_at) : null,
  });
  return { id: Number(created.id), newVersion: true, supersedes: Number(projectionId) };
}

/** Editor payload: the stored content, the member's jobs with libraries, and the resolved preview. */
export async function getCareerBoundEditorState(userId, projectionId) {
  const row = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
  if (!row) throw new CareerBoundError('Output not found.', 404);
  const content = parseJson(row.generated_content);
  if (!isCareerBound(content)) throw new CareerBoundError('This output is not career-bound.', 409);
  const jobs = await loadJobs(userId);
  const { content: resolved, warnings } = await resolveCareerBound(userId, content);
  const lists = {};
  for (const entity of Object.keys(MASTER_LISTS)) lists[entity] = await loadMasterList(userId, entity);
  const open = await openPackageTaskCount(userId);
  return {
    id: Number(row.id),
    lists,
    openReviewTasks: open,
    name: row.preset_name,
    outputStatus: row.output_status,
    content,
    resolved,
    warnings,
    jobs: jobs.map((j) => ({
      id: Number(j.id), company: j.company, title: j.title, startDate: j.start_date, endDate: j.end_date,
      keyMetrics: j.key_metrics, bullets: bulletsOf(j),
    })),
  };
}

// ── conversion of an imported package resume ──────────────────────────────

export function packageKeyOf(presetId) {
  const m = /^application_package:([^:]+):(.+)$/.exec(presetId || '');
  return m ? { packageKey: m[1], variant: m[2] } : null;
}

/**
 * Builds career_bound content from an imported document_blocks resume.
 * Requires every reconciliation task of that package to be decided first -
 * otherwise Career Master would not yet reflect what the package says.
 * Wording the member declined to adopt stays in THIS output only (override /
 * extra bullet), visibly badged, and Career Master is untouched.
 */
export async function buildCareerBoundFromPackage(userId, projectionId) {
  const row = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
  if (!row) throw new CareerBoundError('Output not found.', 404);
  const doc = parseJson(row.generated_content);
  if (doc?.format !== 'document_blocks') throw new CareerBoundError('Only an imported document_blocks resume can be converted.', 409);
  if ((row.output_type || 'resume') !== 'resume') throw new CareerBoundError('Only resumes can be career-bound.', 409);
  const pk = packageKeyOf(row.preset_id);
  if (pk) {
    const open = await db.prepare(`
      SELECT t.id, t.task_type FROM career_reconciliation_tasks t
        JOIN journey_data_rods r ON r.id = t.rod_id
       WHERE r.user_id=$1 AND t.status='open' AND t.task_type LIKE 'package\\_%' AND t.metadata->>'packageKey'=$2
    `).all(userId, pk.packageKey);
    if (open.length) {
      throw new CareerBoundError(`${open.length} reconciliation task${open.length === 1 ? '' : 's'} for this package still need a decision (approve or reject) before it can be converted.`, 409, { openTasks: open.map((t) => Number(t.id)) });
    }
  }

  const jobs = await loadJobs(userId);
  const warnings = [];
  const usedJobs = new Map();
  const sections = [];
  const blocks = doc.blocks || [];
  const roleAt = new Map(rolesWithBullets(doc).map((r) => [r.index, r]));
  const groupAt = new Map(listGroupsFromDocument(doc).map((g) => [g.headingIndex, g]));
  const masterRows = {};
  for (const entity of Object.keys(MASTER_LISTS)) masterRows[entity] = await loadMasterList(userId, entity);
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    const role = roleAt.get(i);
    const group = groupAt.get(i);
    if (group) {
      const rows = masterRows[group.entity];
      const section = { type: 'master_list', entity: group.entity, title: group.title, ids: [], overrides: {}, extras: [] };
      for (const item of group.items) {
        const hit = rows.find((r) => norm(r.label) === norm(item));
        if (hit) { if (!section.ids.includes(hit.id)) section.ids.push(hit.id); }
        else section.extras.push({ id: `x_${section.extras.length + 1}`, text: item });
      }
      if (section.extras.length) warnings.push(`${section.extras.length} ${group.entity} in the package (${section.extras.slice(0, 3).map((x) => x.text).join(', ')}${section.extras.length > 3 ? ', ...' : ''}) are not in Career Master (declined or never raised); they are kept in this output only.`);
      sections.push(section);
      i = group.endIndex;
      continue;
    }
    if (!role) { sections.push(b); i += 1; continue; }
    // consume the role block, the optional italic title line, and its bullets
    let next = i + 1;
    if (!String(b.title || '').includes('|') && blocks[next]?.type === 'paragraph' && blocks[next].emphasis === 'italic') next += 1;
    const bulletStart = next;
    next += role.bullets.length;
    const job = matchJob(role, jobs);
    if (!job) {
      warnings.push(`"${role.company}${role.title ? ` | ${role.title}` : ''}" is not in Career Master (add-job was declined or never raised); it is kept in this output as plain text.`);
      for (let k = i; k < next; k += 1) sections.push(blocks[k]);
      i = next;
      continue;
    }
    const library = bulletsOf(job);
    const cfg = usedJobs.get(Number(job.id)) || { jobId: Number(job.id), bulletIds: [], extraBullets: [] };
    role.bullets.forEach((text) => {
      const hit = library.find((v) => norm(v.text) === norm(text));
      if (hit) { if (!cfg.bulletIds.includes(hit.id)) cfg.bulletIds.push(hit.id); return; }
      const id = `x_${cfg.extraBullets.length + 1}`;
      cfg.extraBullets.push({ id, text });
      cfg.bulletIds.push(id);
    });
    const pkgTitle = norm(String(role.title).split('|')[0]);
    const jt = norm(job.title);
    if (pkgTitle && !(jt.includes(pkgTitle) || pkgTitle.includes(jt))) cfg.titleOverride = String(role.title);
    if (yearsOf(role.dates).join('-') !== yearsOf(formatJobDates(job)).join('-')) cfg.datesOverride = role.dates;
    if (!cfg.extraBullets.length) delete cfg.extraBullets;
    if (!usedJobs.has(Number(job.id))) {
      usedJobs.set(Number(job.id), cfg);
      sections.push({ type: 'job', jobId: Number(job.id) });
    }
    i = next;
    void bulletStart;
  }
  const content = {
    format: 'career_bound', version: 1,
    header: doc.header || {},
    sections,
    jobs: [...usedJobs.values()],
    ...(pk ? { source: { kind: 'package', packageKey: pk.packageKey, variant: pk.variant, projectionId: Number(projectionId) } } : {}),
  };
  return { content, warnings, name: row.preset_name, authors: parseJson(row.authors), sourceCreatedAt: row.source_created_at != null ? Number(row.source_created_at) : null, presetId: row.preset_id };
}

export async function convertPackageToCareerBound(userId, projectionId) {
  const built = await buildCareerBoundFromPackage(userId, projectionId);
  validateCareerBound(built.content);
  const key = built.presetId ? built.presetId.replace(/^application_package:/, 'career_bound:') : null;
  const projection = await createCareerBoundOutput(userId, {
    name: `${built.name || 'Resume'} (career-bound)`,
    content: built.content,
    presetKey: key,
    authors: built.authors,
    sourceCreatedAt: built.sourceCreatedAt,
  });
  return { id: Number(projection.id), warnings: built.warnings, jobs: built.content.jobs.length };
}
