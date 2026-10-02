// Tailored application packages as Career Reconciliation sources (2026-10-02).
//
// An imported package resume (document_blocks v1, see applicationPackages.js)
// is a source of claims about Career Master. Rather than silently adopting or
// ignoring them, each difference becomes a task in the existing review queue
// (career_reconciliation_tasks, the same table/routes/panel as source
// conflicts and ambiguous mappings - no parallel mechanism):
//
//   package_field_conflict - a matched job's title or dates differ
//                            (before -> after; target = the career_jobs row)
//   package_new_bullet     - a bullet that is not in that job's library
//   package_add_job        - a role with no matching Career Master job
//   package_new_skill      - a skill the package lists that Career Master lacks
//   package_new_tool       - a tool/technology the package lists that Career Master lacks
//                            (an approved tool has no proficiency category yet, so the
//                            finalization gate asks for one before any output is final)
//
// Approve applies the change through the same side effects as Career Master
// CRUD (Career Atom sync + notifyCareerChanged); Reject leaves Career Master
// untouched and records the decision (status 'dismissed'). Decided items are
// never re-raised by a re-import of identical content: the task's atom_key
// embeds a hash of the claim, and any non-open task with that key suppresses
// detection.
//
// Atom sync is awaited, not fire-and-forget: if it fails the change itself
// stays applied but the task is stamped metadata.syncError and listed under
// "applied - sync failed, retry" until a retry succeeds.
import { db } from '../db.js';
import { recordRodEvent } from './journeyRods.js';
import { ensureCareerMasterRod } from './careerAtomMigration.js';
import { importApplicationPackage } from './applicationPackages.js';
import { notifyCareerChanged } from './careerChangeEvents.js';
import {
  CareerBoundError, norm, shortHash, splitDates, loadJobs, matchJob, rolesWithBullets, bulletsOf,
  addBulletVariant, syncJobAtoms, syncEntryAtoms, listGroupsFromDocument, loadMasterList,
} from './careerBound.js';

// Deciding a task never approves/publishes an output, so the finalization gate
// (finalizationGates.js) is not involved here; it guards the output approval paths.
export const PACKAGE_TASK_TYPES = ['package_field_conflict', 'package_new_bullet', 'package_add_job', 'package_new_skill', 'package_new_tool'];
const yearsOf = (s) => (String(s || '').match(/(?:19|20)\d{2}|present/gi) || []).map((y) => y.toLowerCase());
const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

async function insertTask(rod, { taskType, atomKey, targetId, evidenceRefs, reasoning, metadata, entryType = 'career_job_entry', targetTable = 'career_jobs' }) {
  // Already decided (or already open) for exactly this claim? Skip / merge.
  const prior = await db.prepare(`
    SELECT id, status, evidence_refs, metadata FROM career_reconciliation_tasks
     WHERE rod_id=$1 AND task_type=$2 AND entry_type=$4 AND atom_key=$3
     ORDER BY (status='open') DESC, id DESC LIMIT 1
  `).get(rod.id, taskType, atomKey, entryType);
  if (prior && prior.status !== 'open') return { skipped: 'decided', id: Number(prior.id) };
  const now = Date.now();
  if (prior) {
    // Same claim from another variant of the package: add the source, keep one task.
    const refs = parseJson(prior.evidence_refs) || [];
    const merged = [...refs];
    for (const r of evidenceRefs) if (!merged.some((m) => m.kind === r.kind && m.projectionId === r.projectionId)) merged.push(r);
    await db.prepare(`UPDATE career_reconciliation_tasks SET evidence_refs=$1::jsonb, updated_at=$2 WHERE id=$3`).run(merged, now, prior.id);
    return { skipped: 'merged', id: Number(prior.id) };
  }
  const row = await db.prepare(`
    INSERT INTO career_reconciliation_tasks
      (rod_id, task_type, entry_type, atom_key, target_table, target_id, evidence_refs, reasoning, metadata, detected_at, created_at, updated_at)
    VALUES ($1,$2,$9,$3,$10,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$8,$8) RETURNING id
  `).get(rod.id, taskType, atomKey, targetId || null, evidenceRefs, reasoning, metadata, now, entryType, targetTable);
  await recordRodEvent(rod.id, { eventType: 'career_package_task_raised', metadata: { taskId: Number(row.id), taskType } });
  return { created: true, id: Number(row.id) };
}

/** Detects differences between one imported resume projection and Career Master. */
export async function detectPackageTasks(userId, projection) {
  const content = parseJson(projection.generated_content);
  const m = /^application_package:([^:]+):(.+)$/.exec(projection.preset_id || '');
  if (!m || content?.format !== 'document_blocks' || (projection.output_type || 'resume') !== 'resume') return { created: 0, skipped: 0, tasks: [] };
  const [, packageKey, variant] = m;
  const rod = await ensureCareerMasterRod(userId);
  const jobs = await loadJobs(userId);
  const source = { kind: 'package', packageKey, variant, projectionId: Number(projection.id), label: projection.preset_name || variant };
  const meta = { packageKey };
  const tasks = [];
  const record = (r) => tasks.push(r);

  for (const role of rolesWithBullets(content)) {
    const job = matchJob(role, jobs);
    if (!job) {
      const key = `pkg:${packageKey}:job:${shortHash(`${norm(role.company)}|${norm(role.title)}|${yearsOf(role.dates).join('-')}`)}`;
      const { startDate, endDate } = splitDates(role.dates);
      record(await insertTask(rod, {
        taskType: 'package_add_job', atomKey: key, targetId: null,
        evidenceRefs: [{ ...source, value: `${role.company} | ${role.title} (${role.dates})` }],
        reasoning: { company: role.company, title: role.title, startDate, endDate, bullets: role.bullets, summary: 'This role is in the package but not in Career Master.' },
        metadata: meta,
      }));
      continue;
    }
    const jobRef = { jobId: Number(job.id), company: job.company };
    // title
    const pkgTitle = norm(String(role.title).split('|')[0]);
    const jt = norm(job.title);
    if (pkgTitle && !(jt.includes(pkgTitle) || pkgTitle.includes(jt))) {
      record(await insertTask(rod, {
        taskType: 'package_field_conflict', atomKey: `pkg:${packageKey}:job:${job.id}:title:${shortHash(norm(role.title))}`, targetId: Number(job.id),
        evidenceRefs: [{ ...source, value: role.title }],
        reasoning: { ...jobRef, field: 'title', before: job.title, after: role.title },
        metadata: meta,
      }));
    }
    // dates (compared by year, as packageRoleCheck.js does)
    const cmDates = [job.start_date, job.end_date].filter(Boolean).join(' – ');
    if (role.dates && yearsOf(role.dates).join('-') !== yearsOf(cmDates).join('-')) {
      const { startDate, endDate } = splitDates(role.dates);
      record(await insertTask(rod, {
        taskType: 'package_field_conflict', atomKey: `pkg:${packageKey}:job:${job.id}:dates:${shortHash(yearsOf(role.dates).join('-'))}`, targetId: Number(job.id),
        evidenceRefs: [{ ...source, value: role.dates }],
        reasoning: { ...jobRef, field: 'dates', before: cmDates, after: role.dates, afterStartDate: startDate, afterEndDate: endDate },
        metadata: meta,
      }));
    }
    // bullets not in the job's library
    const library = bulletsOf(job);
    for (const text of role.bullets) {
      if (library.some((v) => norm(v.text) === norm(text))) continue;
      record(await insertTask(rod, {
        taskType: 'package_new_bullet', atomKey: `pkg:${packageKey}:bullet:${job.id}:${shortHash(norm(text))}`, targetId: Number(job.id),
        evidenceRefs: [{ ...source, value: text }],
        reasoning: { ...jobRef, text, jobTitle: job.title },
        metadata: meta,
      }));
    }
  }
  // skills / tools the package lists that Career Master does not have
  for (const group of listGroupsFromDocument(content)) {
    if (group.entity !== 'skills' && group.entity !== 'tools') continue;
    const isSkill = group.entity === 'skills';
    const known = new Set((await loadMasterList(userId, group.entity)).map((r) => norm(r.label)));
    for (const item of group.items) {
      if (known.has(norm(item))) continue;
      record(await insertTask(rod, {
        taskType: isSkill ? 'package_new_skill' : 'package_new_tool',
        entryType: isSkill ? 'career_skill_entry' : 'career_tool_entry',
        targetTable: isSkill ? 'career_skills' : 'career_tools',
        atomKey: `pkg:${packageKey}:${isSkill ? 'skill' : 'tool'}:${shortHash(norm(item))}`, targetId: null,
        evidenceRefs: [{ ...source, value: item }],
        reasoning: { name: item, listTitle: group.title },
        metadata: meta,
      }));
    }
  }
  return { created: tasks.filter((t) => t.created).length, skipped: tasks.filter((t) => t.skipped).length, tasks };
}

/**
 * Files a package (same import as the existing route: nothing is approved)
 * and raises reconciliation tasks for every resume in it.
 */
export async function importPackageAsSource(userId, pkg) {
  const results = await importApplicationPackage(userId, pkg);
  const summary = { outputs: results, created: 0, alreadyDecidedOrMerged: 0, byOutput: [] };
  for (const r of results) {
    const projection = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(r.id, userId);
    // Unchanged outputs are re-scanned too: a task decided as "reject" stays suppressed, a
    // previously failed detection gets another chance.
    const detected = await detectPackageTasks(userId, projection);
    summary.created += detected.created;
    summary.alreadyDecidedOrMerged += detected.skipped;
    summary.byOutput.push({ variant: r.variant, id: r.id, status: r.status, tasksCreated: detected.created });
  }
  return summary;
}

// ── resolution ────────────────────────────────────────────────────────────

async function loadOwnedTask(userId, taskId) {
  const task = await db.prepare(`
    SELECT t.*, r.user_id AS rod_user_id FROM career_reconciliation_tasks t
      JOIN journey_data_rods r ON r.id = t.rod_id WHERE t.id=$1
  `).get(taskId);
  if (!task || Number(task.rod_user_id) !== Number(userId)) throw new CareerBoundError('Task not found', 404);
  return task;
}

async function applyApproval(userId, task) {
  const reasoning = parseJson(task.reasoning) || {};
  const now = Date.now();
  if (task.task_type === 'package_field_conflict') {
    const jobId = Number(task.target_id);
    const job = await db.prepare(`SELECT id FROM career_jobs WHERE id=$1 AND user_id=$2`).get(jobId, userId);
    if (!job) throw new CareerBoundError('The Career Master job this task targets no longer exists.', 409);
    if (reasoning.field === 'title') {
      await db.prepare(`UPDATE career_jobs SET title=$1, updated_at=$2 WHERE id=$3 AND user_id=$4`).run(String(reasoning.after), now, jobId, userId);
    } else if (reasoning.field === 'dates') {
      await db.prepare(`UPDATE career_jobs SET start_date=$1, end_date=$2, updated_at=$3 WHERE id=$4 AND user_id=$5`)
        .run(reasoning.afterStartDate || null, reasoning.afterEndDate || null, now, jobId, userId);
    } else {
      throw new CareerBoundError(`Unknown field: ${reasoning.field}`);
    }
    return { jobId, syncError: await syncJobAtoms(userId, jobId) };
  }
  if (task.task_type === 'package_new_bullet') {
    const ref = (parseJson(task.evidence_refs) || [])[0] || {};
    const { syncError } = await addBulletVariant(userId, Number(task.target_id), { text: reasoning.text, source: { kind: 'package', ref: ref.packageKey || null } });
    return { jobId: Number(task.target_id), syncError };
  }
  if (task.task_type === 'package_add_job') {
    const ref = (parseJson(task.evidence_refs) || [])[0] || {};
    const max = await db.prepare(`SELECT COALESCE(MAX(order_index), 0) AS m FROM career_jobs WHERE user_id=$1`).get(userId);
    const variants = (reasoning.bullets || []).map((text, i) => ({
      id: `b_${shortHash(`${task.id}:${i}:${text}`).slice(0, 8)}`, text, source: { kind: 'package', ref: ref.packageKey || null }, createdAt: now, tags: [],
    }));
    const res = await db.prepare(`
      INSERT INTO career_jobs (user_id, company, title, start_date, end_date, bullet_variants, order_index, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$8) RETURNING id
    `).run(userId, reasoning.company, reasoning.title || 'Untitled role', reasoning.startDate || null, reasoning.endDate || null, variants, Number(max?.m || 0) + 1, now);
    const jobId = Number(res.lastInsertRowid);
    return { jobId, syncError: await syncJobAtoms(userId, jobId) };
  }
  if (task.task_type === 'package_new_skill' || task.task_type === 'package_new_tool') {
    const isSkill = task.task_type === 'package_new_skill';
    const table = isSkill ? 'career_skills' : 'career_tools';
    const name = String(reasoning.name || '').trim();
    if (!name) throw new CareerBoundError('The task has no name to add.');
    // Already added meanwhile (e.g. typed in by hand)? Don't duplicate.
    const rows = await loadMasterList(userId, isSkill ? 'skills' : 'tools');
    const dup = rows.find((r) => norm(r.label) === norm(name));
    if (dup) return { jobId: null, entryId: dup.id, table, existed: true, syncError: null };
    const max = await db.prepare(`SELECT COALESCE(MAX(order_index), 0) AS m FROM ${table} WHERE user_id=$1`).get(userId);
    const res = isSkill
      ? await db.prepare(`INSERT INTO career_skills (user_id, skill, order_index, created_at, updated_at) VALUES ($1,$2,$3,$4,$4) RETURNING id`).run(userId, name, Number(max?.m || 0) + 1, now)
      : await db.prepare(`INSERT INTO career_tools (user_id, name_used, current_name, order_index, created_at, updated_at) VALUES ($1,$2,$2,$3,$4,$4) RETURNING id`).run(userId, name, Number(max?.m || 0) + 1, now);
    const entryId = Number(res.lastInsertRowid);
    return { jobId: null, entryId, table, syncError: await syncEntryAtoms(userId, table, entryId) };
  }
  throw new CareerBoundError(`Not a package task: ${task.task_type}`);
}

/** method: 'approve' | 'reject'. Reject changes nothing in Career Master. */
export async function resolvePackageTask(userId, taskId, { method }) {
  const task = await loadOwnedTask(userId, taskId);
  if (!PACKAGE_TASK_TYPES.includes(task.task_type)) throw new CareerBoundError('Not a package task.');
  if (task.status !== 'open') throw new CareerBoundError('Task is already decided.', 409);
  if (method !== 'approve' && method !== 'reject') throw new CareerBoundError('method must be approve or reject.');
  const now = Date.now();
  let applied = null;
  const metadata = parseJson(task.metadata) || {};
  if (method === 'approve') {
    applied = await applyApproval(userId, task);
    notifyCareerChanged(userId);
    if (applied.syncError) metadata.syncError = { at: now, message: applied.syncError, jobId: applied.jobId, table: applied.table || 'career_jobs', entryId: applied.entryId ?? applied.jobId };
    metadata.appliedJobId = applied.jobId;
    if (applied.entryId != null) { metadata.appliedEntryId = applied.entryId; metadata.appliedTable = applied.table; }
  }
  const status = method === 'approve' ? 'resolved' : 'dismissed';
  await db.prepare(`
    UPDATE career_reconciliation_tasks SET status=$1, resolution=$2::jsonb, metadata=$3::jsonb, resolved_by=$4, resolved_at=$5, updated_at=$5 WHERE id=$6
  `).run(status, { method, decision: method === 'approve' ? 'approved' : 'rejected', appliedJobId: applied?.jobId ?? null, appliedEntryId: applied?.entryId ?? null }, metadata, userId, now, taskId);
  await recordRodEvent(task.rod_id, { eventType: 'career_package_task_decided', metadata: { taskId: Number(taskId), taskType: task.task_type, method } });
  return { taskId: Number(taskId), status, method, syncFailed: !!applied?.syncError, syncError: applied?.syncError || null, jobId: applied?.jobId ?? null };
}

/** Re-runs the atom sync for a task that was applied but whose sync failed. */
export async function retryTaskSync(userId, taskId) {
  const task = await loadOwnedTask(userId, taskId);
  const metadata = parseJson(task.metadata) || {};
  if (!metadata.syncError) throw new CareerBoundError('This task has no failed sync to retry.', 409);
  const se = metadata.syncError;
  const err = await syncEntryAtoms(userId, se.table || 'career_jobs', Number(se.entryId || se.jobId || metadata.appliedJobId));
  if (err) {
    metadata.syncError = { ...metadata.syncError, at: Date.now(), message: err };
  } else {
    delete metadata.syncError;
  }
  await db.prepare(`UPDATE career_reconciliation_tasks SET metadata=$1::jsonb, updated_at=$2 WHERE id=$3`).run(metadata, Date.now(), taskId);
  return { taskId: Number(taskId), syncFailed: !!err, syncError: err };
}
