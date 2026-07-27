// Career Bonding Engine (2026-07-27) — server-side port of the free-text
// matching half of src/lib/journeyEngine/bonding.js, scoped to the Career
// domain. Reuses that module's exact tagOverlapRatio math rather than
// re-deriving a second affinity calculation (bonding.js's own header already
// names this rule).
//
// Career Atoms are deterministically owned by exactly one Career Molecule
// (entryType) — careerAtomRegistry.js already encodes that membership, and
// journey_atom_affinity_rules' seeded rows (cluster_key=entryType,
// molecule_key=atomKey, minimum_affinity=1.0) are the durable record of it.
// What bonding rules earn their keep on here is the *fuzzy* problem: an
// uploaded Excel column header or an AI-proposed field label from a resume
// is free text that doesn't arrive pre-labeled with an atomKey — bonding
// this text to the closest real, governed atom (or correctly deciding no
// atom fits) is what this module does, using tag overlap over each atom's
// derived label/entryType tokens as the tag space.
import { tagOverlapRatio } from '../../src/lib/journeyEngine/bonding.js';
import { db } from '../db.js';
import { generateCareerAtomDefinitions } from './careerAtomRegistry.js';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'and', 'or', 'to', 'in', 'on', 'at', 'is',
  'as', 'by', 'with', 'this', 'that', 'career',
]);

function tokenize(text) {
  return String(text || '')
    // Split camelCase before lowercasing (e.g. AI-proposed field keys like
    // 'startDate', 'keyMetrics', 'yearsExp') — without this, those arrive as
    // one fused token and never overlap with a multi-word atom label like
    // "Career Job — Start Date", silently missing matches that should hit.
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[_/().,-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Every Career Atom's tag set, derived once from its own definition — the
// atom's label, entryType, and source column all contribute tokens, so
// "Job Title" and "career_job_title" both carry ['job','title'] regardless
// of which representation the incoming free text happens to use.
let cachedAtomTagIndex = null;
export function careerAtomTagIndex() {
  if (cachedAtomTagIndex) return cachedAtomTagIndex;
  cachedAtomTagIndex = generateCareerAtomDefinitions().map((atom) => ({
    ...atom,
    tags: [...new Set([
      ...tokenize(atom.label),
      ...tokenize(atom.entryType),
      ...tokenize(atom.sourceColumn),
    ])],
  }));
  return cachedAtomTagIndex;
}

// The seeded default (see server/db.js's Career Bonding Rules seed) — used
// when journey_atom_affinity_rules has no override for a given cluster.
const DEFAULT_MINIMUM_AFFINITY = 0.34;

let cachedMinimumAffinityByCluster = null;
export async function loadCareerBondingRules() {
  if (cachedMinimumAffinityByCluster) return cachedMinimumAffinityByCluster;
  const rows = await db.prepare(
    `SELECT cluster_key, molecule_key, minimum_affinity FROM journey_atom_affinity_rules WHERE org_id IS NULL`
  ).all();
  cachedMinimumAffinityByCluster = rows;
  return rows;
}

// Given one free-text label (an Excel column header, or an AI-proposed
// field name from a resume), find the best-matching Career Atom(s) by tag
// overlap. Returns candidates sorted by affinity, each above
// `minimumAffinity` (defaults to the fuzzy-match floor — deliberately looser
// than the 1.0 deterministic entryType-membership rules, since free text is
// never going to hit those exactly).
export function matchTextToCareerAtom(text, { minimumAffinity = DEFAULT_MINIMUM_AFFINITY, entryType = null } = {}) {
  const queryTags = tokenize(text);
  if (!queryTags.length) return [];
  const pool = entryType
    ? careerAtomTagIndex().filter((a) => a.entryType === entryType)
    : careerAtomTagIndex();
  const normalizedQuery = String(text).trim().toLowerCase();
  return pool
    .map((atom) => {
      // Exact-match short-circuit: an AI-proposed field key or a re-typed
      // Excel header that happens to equal the real sourceColumn/atomKey/
      // label exactly is affinity 1.0, not whatever the tag-overlap ratio
      // works out to (which can undershoot on short single-word labels).
      const isExact = normalizedQuery === atom.sourceColumn?.toLowerCase()
        || normalizedQuery === atom.atomKey.toLowerCase()
        || normalizedQuery === atom.label.toLowerCase();
      const affinity = isExact ? 1 : (tagOverlapRatio(queryTags, atom.tags) || tagOverlapRatio(atom.tags, queryTags));
      return { atom, affinity };
    })
    .filter((m) => m.affinity >= minimumAffinity)
    .sort((a, b) => b.affinity - a.affinity)
    .map((m) => ({ atomKey: m.atom.atomKey, label: m.atom.label, entryType: m.atom.entryType, dataType: m.atom.dataType, affinity: Math.round(m.affinity * 100) / 100 }));
}

// Bonds a whole set of free-text labels (e.g. one Excel sheet's header row,
// or every field name an AI extraction proposed) to their best Career Atom
// match in one pass. Each input keeps its own best candidate list — the
// caller (semantic-import / resume-analysis routes) decides how to present
// ties or zero-match cases in the preview, this module only proposes.
export function bondLabelsToCareerAtoms(labels, options = {}) {
  return labels.map((label) => ({
    inputLabel: label,
    candidates: matchTextToCareerAtom(label, options),
  }));
}
