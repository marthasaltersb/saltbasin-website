// Backlog seeds (docs/changes/platform-agent-runner.md, "Backlog seeds"): a stage before an item becomes a
// feature, seed -> shaped -> ready -> promoted, with its full history of questions and answers.
//
// Reuse: a seed IS a backlog item (backlog_items, kind 'seed'), so the existing backlog stays the one list.
// Three additive columns carry the stage: seed_stage, seed_data (JSONB: the owner's words, problem, open
// questions and answers, acceptance criteria, draft change spec, draft journeys, size) and seed_history
// (JSONB array). Pass raw JS values for JSONB params (never JSON.stringify) per CLAUDE.md.
//
// Rules (server-side, whichever interface calls them):
//   seed -> shaped    needs a problem and at least one acceptance criterion
//   shaped -> ready   needs every open question answered, a size, a draft change spec and one draft journey
//   ready -> promoted only a person, through assertReadyToFinalize; the item becomes a 'feature' in the
//                     backlog. Nothing is built by promoting.
//   ready -> shaped   a person may send it back (note required)
import { db } from '../db.js';
import { assertReadyToFinalize } from './finalizationGates.js';
import { SEED_STAGES, seedGaps } from './backlogSeedRules.js';

export { SEED_STAGES, seedGaps };

const err = (m, status = 400, extra) => Object.assign(new Error(m), { status }, extra || {});
const text = (v) => String(v ?? '').trim();
const n = (v) => (v == null ? null : Number(v));

let ready;
export function ensureSeedSchema() {
  if (ready) return ready;
  ready = db.exec(`
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS seed_stage   TEXT;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS seed_data    JSONB;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS seed_history JSONB;
    CREATE INDEX IF NOT EXISTS idx_backlog_seed_stage ON backlog_items (seed_stage) WHERE seed_stage IS NOT NULL;
  `).catch((e) => { ready = null; throw e; });
  return ready;
}

const emptyData = (words) => ({ words, problem: '', openQuestions: [], acceptanceCriteria: [], draftChangeSpec: '', draftJourneys: [], size: null });
const mapSeed = (r) => ({
  id: Number(r.id), title: r.title, stage: r.seed_stage, kind: r.kind, status: r.status, data: { ...emptyData(''), ...(r.seed_data || {}) }, history: r.seed_history || [],
  createdAt: n(r.created_at), updatedAt: n(r.updated_at),
});
const hist = (row, entry) => [...(row.seed_history || []), { at: Date.now(), ...entry }];

async function getRow(id) {
  await ensureSeedSchema();
  const row = await db.prepare(`SELECT * FROM backlog_items WHERE id=$1 AND seed_stage IS NOT NULL`).get(Number(id));
  if (!row) throw err('Backlog seed not found', 404);
  return row;
}

export async function listSeeds({ stage } = {}) {
  await ensureSeedSchema();
  const rows = stage
    ? await db.prepare(`SELECT * FROM backlog_items WHERE seed_stage=$1 ORDER BY updated_at DESC, id DESC`).all(stage)
    : await db.prepare(`SELECT * FROM backlog_items WHERE seed_stage IS NOT NULL ORDER BY updated_at DESC, id DESC`).all();
  return rows.map(mapSeed);
}
export async function getSeed(id) { return mapSeed(await getRow(id)); }

export async function createSeed({ title, words }, actor) {
  await ensureSeedSchema();
  const t = text(title);
  const w = text(words);
  if (!t) throw err('Give the seed a short title');
  if (t.length > 160) throw err('The title is limited to 160 characters');
  if (!w) throw err('Write the idea in your own words');
  const now = Date.now();
  const row = await db.prepare(
    `INSERT INTO backlog_items (kind, title, summary, status, seed_stage, seed_data, seed_history, created_at, updated_at)
     VALUES ('seed',$1,$2,'pending','seed',$3::jsonb,$4::jsonb,$5,$5) RETURNING *`,
  ).get(t, w.slice(0, 300), emptyData(w), [{ at: now, by: actor?.label || 'admin', event: 'created', to: 'seed', note: 'Seed created in the owner\'s words' }], now);
  return mapSeed(row);
}

/** The gardener agent (or a person) writes the shaped fields. Moves a plain seed to shaped when its gaps are filled. */
export async function applyShaping(seedId, shaped, { by = 'admin', runId = null } = {}) {
  const row = await getRow(seedId);
  if (!['seed', 'shaped'].includes(row.seed_stage)) throw err(`A seed that is ${row.seed_stage} is no longer shaped by the gardener`, 409);
  const prev = { ...emptyData(''), ...(row.seed_data || {}) };
  const asks = (shaped.openQuestions || []).map((q) => (typeof q === 'string' ? { q: text(q), answer: null, askedBy: by } : q)).filter((q) => text(q.q));
  // Keep every earlier question and its answer; add only questions not asked yet.
  const known = new Set((prev.openQuestions || []).map((q) => text(q.q).toLowerCase()));
  const questions = [...(prev.openQuestions || []), ...asks.filter((q) => !known.has(text(q.q).toLowerCase()))];
  const data = {
    ...prev,
    problem: text(shaped.problem) || prev.problem,
    openQuestions: questions,
    acceptanceCriteria: (shaped.acceptanceCriteria || prev.acceptanceCriteria || []).map(text).filter(Boolean),
    draftChangeSpec: text(shaped.draftChangeSpec) || prev.draftChangeSpec,
    draftJourneys: (shaped.draftJourneys || prev.draftJourneys || []).map(text).filter(Boolean),
    size: shaped.size || prev.size,
  };
  const seed = { data };
  const gaps = seedGaps(seed, 'shaped');
  const to = row.seed_stage === 'seed' && !gaps.length ? 'shaped' : row.seed_stage;
  const history = hist(row, { by, runId, event: 'shaped', from: row.seed_stage, to, note: `Problem, ${questions.length} question${questions.length === 1 ? '' : 's'}, ${data.acceptanceCriteria.length} acceptance criteri${data.acceptanceCriteria.length === 1 ? 'on' : 'a'} written${gaps.length ? `; stays a seed because ${gaps.join(' and ')}` : ''}` });
  const out = await db.prepare(`UPDATE backlog_items SET seed_stage=$1, seed_data=$2::jsonb, seed_history=$3::jsonb, updated_at=$4 WHERE id=$5 RETURNING *`).get(to, data, history, Date.now(), row.id);
  return mapSeed(out);
}

export async function answerQuestion(seedId, index, answer, actor) {
  const row = await getRow(seedId);
  if (row.seed_stage === 'promoted') throw err('A promoted seed is closed', 409);
  const data = { ...emptyData(''), ...(row.seed_data || {}) };
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= data.openQuestions.length) throw err('That question does not exist', 404);
  const a = text(answer);
  if (!a) throw err('Type your answer');
  data.openQuestions = data.openQuestions.map((q, k) => (k === i ? { ...q, answer: a, answeredBy: actor?.label || 'admin', answeredAt: Date.now() } : q));
  const history = hist(row, { by: actor?.label || 'admin', event: 'answered', note: `Q${i + 1}: ${data.openQuestions[i].q} -> ${a}` });
  return mapSeed(await db.prepare(`UPDATE backlog_items SET seed_data=$1::jsonb, seed_history=$2::jsonb, updated_at=$3 WHERE id=$4 RETURNING *`).get(data, history, Date.now(), row.id));
}

export async function moveSeed(seedId, to, { note, actor, userId } = {}) {
  const row = await getRow(seedId);
  const from = row.seed_stage;
  if (!SEED_STAGES.includes(to)) throw err(`Stage must be one of: ${SEED_STAGES.join(', ')}`);
  const allowed = { seed: ['shaped'], shaped: ['ready'], ready: ['promoted', 'shaped'], promoted: [] }[from];
  if (!allowed.includes(to)) throw err(`A ${from} seed can only move to: ${allowed.join(', ') || 'nowhere (it is promoted)'}`, 409);
  const seed = mapSeed(row);
  const gaps = seedGaps(seed, to);
  if (gaps.length) throw err(`This seed cannot become ${to}: ${gaps.join('; ')}`, 409, { gaps });
  if (to === 'shaped' && from === 'ready' && !text(note)) throw err('Say why it goes back to shaped');
  if (to === 'promoted') {
    // Promotion is a finalize path: same server-side gate as every other.
    if (userId != null) await assertReadyToFinalize(userId);
  }
  const history = hist(row, { by: actor?.label || 'admin', event: 'moved', from, to, note: text(note) || null });
  const out = to === 'promoted'
    ? await db.prepare(`UPDATE backlog_items SET seed_stage='promoted', kind='feature', seed_history=$1::jsonb, updated_at=$2 WHERE id=$3 RETURNING *`).get(history, Date.now(), row.id)
    : await db.prepare(`UPDATE backlog_items SET seed_stage=$1, seed_history=$2::jsonb, updated_at=$3 WHERE id=$4 RETURNING *`).get(to, history, Date.now(), row.id);
  return mapSeed(out);
}
