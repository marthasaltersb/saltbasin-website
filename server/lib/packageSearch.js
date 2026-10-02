// Package-confined search for the cover-letter agent (2026-10-02).
//
// The agent's library is ONLY the content inside the output package the
// cover letter belongs to: the cover letter itself, the package's other
// outputs (resumes etc.) and the job-rec text attached to the package. It
// is never Career Master at large, never another member's data, never the
// web. The search is local and deterministic: tokenise every block, rank
// with BM25, return the matching blocks as the evidence shown to the user.
// db.js is imported lazily (see loadDb) so the pure search functions can be unit-tested without a database.
const loadDb = async () => (await import('../db.js')).db;

const STOPWORDS = new Set(('a an and are as at be but by for from has have i if in into is it its me my of on or our so such that the their then there these they this to was we were will with you your would could should can not no do does did about how what when where which who whom why also than them been being am')
  .split(' '));

// Light suffix stripping so "managing"/"managed"/"manages" meet. Deliberately simple and
// deterministic; the search is evidence for a human, not a ranking claim.
function stem(token) {
  let t = token;
  if (t.length > 5 && t.endsWith('ing')) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith('ed')) t = t.slice(0, -2);
  else if (t.length > 4 && t.endsWith('es')) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) t = t.slice(0, -1);
  return t;
}

export function tokenize(text) {
  return String(text || '').toLowerCase().match(/[a-z0-9][a-z0-9'+#.-]*[a-z0-9+#]|[a-z0-9]/g)?.map((t) => t.replace(/'s$/, ''))
    .filter((t) => t && !STOPWORDS.has(t)).map(stem) || [];
}

/** Text of one document block (headings, paragraphs, bullets, roles, table cells). */
export function blockText(block) {
  if (!block) return '';
  if (block.type === 'role') return [block.title, block.dates].filter(Boolean).join(' — ');
  if (block.type === 'table') return (block.rows || []).map((row) => row.map((cell) => (cell || []).join(' ')).join(' | ')).join('\n');
  return block.text || '';
}

/**
 * Splits an output's content into searchable units. `source` identifies where a hit came
 * from so the user can see it. Content shapes: document_blocks v1, a generated cover
 * letter (openingHook/bodyParagraphs/closing), a generated resume, or raw imported text.
 */
export function unitsFromContent(content, source) {
  const units = [];
  const add = (index, text, kind) => { if (String(text || '').trim()) units.push({ source: source.key, sourceLabel: source.label, index, kind, text: String(text).trim() }); };
  if (!content) return units;
  if (content.format === 'document_blocks') {
    (content.blocks || []).forEach((b, i) => add(i + 1, blockText(b), b.type));
  } else if (content.rawText) {
    String(content.rawText).split(/\n{2,}/).forEach((p, i) => add(i + 1, p, 'paragraph'));
  } else if (content.openingHook || content.bodyParagraphs) {
    add(1, content.openingHook, 'paragraph');
    (content.bodyParagraphs || []).forEach((p, i) => add(i + 2, p.text, 'paragraph'));
    add((content.bodyParagraphs || []).length + 2, content.closing, 'paragraph');
  } else {
    add(1, content.professionalSummary, 'paragraph');
    (content.selectedExperience || []).forEach((exp, i) => (exp.bullets || []).forEach((b, j) => add(100 + i * 100 + j, b, 'bullet')));
    if (content.emphasizedSkills?.length) add(9999, `Skills: ${content.emphasizedSkills.join(', ')}`, 'paragraph');
  }
  return units;
}

/** BM25 over the units. Returns hits sorted best-first with the matched query terms. */
export function searchUnits(units, query, { limit = 6, k1 = 1.4, b = 0.75 } = {}) {
  const qTerms = [...new Set(tokenize(query))];
  const docs = units.map((u) => ({ unit: u, terms: tokenize(u.text) }));
  const N = docs.length;
  if (!N || !qTerms.length) return { hits: [], queryTerms: qTerms, missingTerms: qTerms };
  const avgLen = docs.reduce((s, d) => s + d.terms.length, 0) / N || 1;
  const df = new Map();
  for (const d of docs) for (const t of new Set(d.terms)) df.set(t, (df.get(t) || 0) + 1);
  const scored = [];
  for (const d of docs) {
    const tf = new Map();
    for (const t of d.terms) tf.set(t, (tf.get(t) || 0) + 1);
    let score = 0;
    const matched = [];
    for (const q of qTerms) {
      const f = tf.get(q);
      if (!f) continue;
      const idf = Math.log(1 + (N - df.get(q) + 0.5) / (df.get(q) + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (d.terms.length / avgLen))));
      matched.push(q);
    }
    if (score > 0) scored.push({ ...d.unit, score: Math.round(score * 1000) / 1000, matchedTerms: matched });
  }
  scored.sort((x, y) => y.score - x.score || x.source.localeCompare(y.source) || x.index - y.index);
  const present = new Set(docs.flatMap((d) => d.terms));
  return { hits: scored.slice(0, limit), queryTerms: qTerms, missingTerms: qTerms.filter((q) => !present.has(q)) };
}

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

/**
 * Which outputs belong to the same package as this cover letter.
 *
 * INTEGRATION HOOK (opportunity link): today membership is
 *   (a) other outputs with the same career_opportunity_rod_id, and
 *   (b) siblings sharing the 'application_package:<packageKey>:' preset prefix.
 * When the World Shell branch lands a dedicated opportunity<->output link (table or column),
 * extend ONLY this function to also read that link. Nothing else in the agent decides
 * membership, so the confinement rule lives in exactly one place.
 */
export async function packageMemberRows(userId, row) {
  const params = [userId, Number(row.lineage_root_id || row.id)];
  const clauses = [];
  if (row.career_opportunity_rod_id != null) { params.push(row.career_opportunity_rod_id); clauses.push(`career_opportunity_rod_id=$${params.length}`); }
  const m = /^application_package:([^:]+):/.exec(row.preset_id || '');
  if (m) { params.push(`application_package:${m[1]}:%`); clauses.push(`preset_id LIKE $${params.length}`); }
  if (!clauses.length) return [];
  const db = await loadDb();
  const rows = await db.prepare(`
    SELECT * FROM resume_output_projections
     WHERE user_id=$1 AND COALESCE(lineage_root_id,id)<>$2
       AND output_status<>'archived' AND output_type IN ('resume','cover_letter')
       AND generated_content IS NOT NULL AND (${clauses.join(' OR ')})
     ORDER BY id DESC
  `).all(...params);
  // Latest version per lineage only.
  const seen = new Set();
  const latest = [];
  for (const r of rows) {
    const root = Number(r.lineage_root_id || r.id);
    if (seen.has(root)) continue;
    seen.add(root);
    latest.push(r);
  }
  return latest;
}

/** Job-rec text attached to the package (the opportunity's rod metadata + the letter's stored target text). */
export async function jobRecText(row) {
  const parts = [];
  if (row.target_job_description) parts.push(row.target_job_description);
  if (row.career_opportunity_rod_id != null) {
    const rod = await (await loadDb()).prepare(`SELECT metadata FROM journey_data_rods WHERE id=$1`).get(row.career_opportunity_rod_id);
    const md = rod ? parseJson(rod.metadata) || {} : {};
    for (const k of ['jobTitle', 'location', 'notes', 'url']) if (md[k] && !parts.includes(md[k])) parts.push(String(md[k]));
  }
  return parts.join('\n\n');
}

/**
 * The full searchable library for one cover letter. `letter` (the cover letter's own units)
 * is returned separately because the agent may edit it; everything else is read-only.
 */
export async function buildPackageLibrary(userId, row) {
  const letterUnits = unitsFromContent(parseJson(row.generated_content), { key: 'cover_letter', label: 'Cover letter' });
  const others = await packageMemberRows(userId, row);
  const memberUnits = others.flatMap((r) => unitsFromContent(parseJson(r.generated_content), {
    key: `${r.output_type}:${r.id}`, label: `${r.output_type === 'resume' ? 'Resume' : 'Cover letter (other)'}: ${r.preset_name || r.preset_id}`,
  }));
  const rec = await jobRecText(row);
  const recUnits = unitsFromContent({ rawText: rec }, { key: 'job_rec', label: 'Job rec text' });
  return {
    letterUnits,
    units: [...letterUnits, ...memberUnits, ...recUnits],
    members: others.map((r) => ({ id: Number(r.id), outputType: r.output_type, name: r.preset_name || r.preset_id })),
    hasJobRec: recUnits.length > 0,
  };
}
