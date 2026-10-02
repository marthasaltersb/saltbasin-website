// Career proficiency resolution (2026-10-02) — turns Career Master facts into
// a proficiency level per skill/tool, and records WHY each level is what it
// is, so every output can say whether a number is Salt Basin methodology or
// the member's own definition.
//
// Pure (no DB): server/routes/careerMaster.js loads the rows and calls
// resolveProficiencies(). All rules live in career_experience_definitions
// rows (member-scoped config), never in this file:
//
//   proficiency_formula    — weighted terms over measured inputs + point
//                            thresholds → level keys. 'salt_basin_methodology'
//                            is seeded per member and locked (read-only); a
//                            member duplicates it into their own formula and
//                            marks that one `selected` to use it instead.
//   certification_mapping  — a certification adds bonus points to specific
//                            skills/tools (the "certification maps to a
//                            skill or technology" rule).
//   career_proficiency_assertions with a user source — a level the member
//                            set by hand for one skill/tool.
//
// Resolution order per entity: member override → selected member formula →
// Salt Basin methodology. `basis` on every result names which one won.

export const METHODOLOGY_FORMULA_KEY = 'salt_basin_methodology';
export const BASIS = Object.freeze({
  METHODOLOGY: 'salt_basin_methodology',
  MEMBER_FORMULA: 'member_formula',
  MEMBER_OVERRIDE: 'member_override',
});
export const USER_DEFINED_BASES = new Set([BASIS.MEMBER_FORMULA, BASIS.MEMBER_OVERRIDE]);

// Assessment sources that mean "the member set this level themselves".
// Anything else on an assertion (e.g. an agent's proposal) is evidence, not
// an override, and does not beat the formula.
export const USER_ASSESSMENT_SOURCES = new Set(['user_confirmed', 'user_defined', 'member_override']);

// The inputs a formula term may reference — the only measurements this
// engine computes. Adding one is a code change here plus a label in the
// configurator; formulas themselves stay data.
export const FORMULA_INPUTS = Object.freeze({
  yearsPerformed: 'Years performed',
  engagementCount: 'Engagements / roles applied in',
  certificationBonus: 'Certification bonus points',
  recencyYears: 'Years since last used (0 = current)',
});

export const METHODOLOGY_FORMULA = Object.freeze({
  terms: [
    { input: 'yearsPerformed', weight: 1, cap: 15 },
    { input: 'engagementCount', weight: 0.5, cap: 10 },
    { input: 'certificationBonus', weight: 1, cap: null },
  ],
  // minPoints per level key; the highest threshold met wins.
  thresholds: [
    { levelKey: 'exposure', minPoints: 0 },
    { levelKey: 'foundational', minPoints: 2 },
    { levelKey: 'proficient', minPoints: 4 },
    { levelKey: 'advanced', minPoints: 7 },
    { levelKey: 'expert', minPoints: 10 },
  ],
});

// null/blank stay null — Number(null) is 0, which would read an empty
// years_exp as a recorded zero and hide the first-used fallback.
function num(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Measured inputs for one skill/tool row — only from recorded Career Master facts. */
export function measureInputs(entity, { currentYear, certificationBonus = 0 }) {
  const firstUsed = num(entity.firstUsed);
  const lastUsed = num(entity.lastUsed);
  const recordedYears = num(entity.yearsExp);
  // Elapsed years, not calendar years touched: first used in 2013 is ~13
  // years by 2026, not 14. A skill first used this year counts as 1.
  const derivedYears = firstUsed ? Math.max(1, (lastUsed || currentYear) - firstUsed) : null;
  return {
    yearsPerformed: recordedYears ?? derivedYears ?? 0,
    engagementCount: num(entity.engagementCount) ?? 0,
    certificationBonus,
    recencyYears: lastUsed ? Math.max(0, currentYear - lastUsed) : 0,
    yearsSource: recordedYears != null ? 'recorded' : derivedYears != null ? 'first_used' : 'none',
  };
}

/** Points for one formula over one entity's inputs, with the per-term breakdown. */
export function scoreFormula(formula, inputs) {
  const terms = Array.isArray(formula?.terms) ? formula.terms : [];
  const breakdown = terms
    .filter((t) => Object.prototype.hasOwnProperty.call(FORMULA_INPUTS, t.input))
    .map((t) => {
      const raw = Number(inputs[t.input]) || 0;
      const capped = t.cap != null && Number.isFinite(Number(t.cap)) ? Math.min(raw, Number(t.cap)) : raw;
      return { input: t.input, value: raw, weight: Number(t.weight) || 0, points: Number((capped * (Number(t.weight) || 0)).toFixed(3)) };
    });
  return { points: Number(breakdown.reduce((sum, b) => sum + b.points, 0).toFixed(3)), breakdown };
}

export function levelForPoints(formula, points, levelsByKey) {
  const thresholds = (Array.isArray(formula?.thresholds) ? formula.thresholds : [])
    .filter((t) => levelsByKey.has(t.levelKey))
    .sort((a, b) => Number(a.minPoints) - Number(b.minPoints));
  let chosen = null;
  for (const t of thresholds) if (points >= Number(t.minPoints)) chosen = t.levelKey;
  return chosen;
}

/** Bonus points per `${type}:${id}` from certification_mapping definitions. */
export function certificationBonuses(mappings, certifications) {
  const certById = new Map((certifications || []).map((c) => [Number(c.id), c]));
  const bonuses = new Map();
  for (const m of mappings || []) {
    const d = m.definition || {};
    const cert = certById.get(Number(d.certificationId));
    if (!cert) continue;
    const lapsed = /expired|lapsed|previously|inactive/i.test(String(cert.status || ''));
    if (lapsed && d.countIfLapsed === false) continue;
    const bonus = Number(d.bonusPoints) || 0;
    for (const t of d.targets || []) {
      const key = `${t.entityType}:${Number(t.entityId)}`;
      const entry = bonuses.get(key) || { points: 0, certifications: [] };
      entry.points += bonus;
      entry.certifications.push({ id: Number(cert.id), name: cert.name, bonusPoints: bonus, lapsed });
      bonuses.set(key, entry);
    }
  }
  return bonuses;
}

/**
 * Resolves one level per skill/tool for `periodKey`.
 * definitions: rows shaped { type, key, label, definition, isActive, sortOrder }.
 * entities: { type:'skill'|'tool', id, label, category, yearsExp, firstUsed, lastUsed, engagementCount }.
 * assertions: { entityType, entityId, periodKey, levelKey, assessmentSource, ... }.
 */
export function resolveProficiencies({ definitions, entities, assertions = [], certifications = [], periodKey = 'current', currentYear = new Date().getFullYear() }) {
  const levels = definitions.filter((d) => d.type === 'proficiency_level' && d.isActive !== false);
  const levelsByKey = new Map(levels.map((l) => [l.key, l]));
  const formulas = definitions.filter((d) => d.type === 'proficiency_formula' && d.isActive !== false);
  const methodology = formulas.find((f) => f.key === METHODOLOGY_FORMULA_KEY);
  const methodologyFormula = methodology?.definition?.terms ? methodology.definition : METHODOLOGY_FORMULA;
  const selected = formulas
    .filter((f) => f.key !== METHODOLOGY_FORMULA_KEY && f.definition?.selected === true)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0] || null;
  const bonuses = certificationBonuses(definitions.filter((d) => d.type === 'certification_mapping' && d.isActive !== false), certifications);
  const overrides = new Map(assertions
    .filter((a) => a.periodKey === periodKey && USER_ASSESSMENT_SOURCES.has(a.assessmentSource) && levelsByKey.has(a.levelKey))
    .map((a) => [`${a.entityType}:${Number(a.entityId)}`, a]));

  const resolved = entities.map((entity) => {
    const key = `${entity.type}:${Number(entity.id)}`;
    const bonus = bonuses.get(key) || { points: 0, certifications: [] };
    const inputs = measureInputs(entity, { currentYear, certificationBonus: bonus.points });
    const methodologyScore = scoreFormula(methodologyFormula, inputs);
    const methodologyLevel = levelForPoints(methodologyFormula, methodologyScore.points, levelsByKey);
    let basis = BASIS.METHODOLOGY;
    let levelKey = methodologyLevel;
    let score = methodologyScore;
    let formulaKey = METHODOLOGY_FORMULA_KEY;
    if (selected) {
      score = scoreFormula(selected.definition, inputs);
      levelKey = levelForPoints(selected.definition, score.points, levelsByKey);
      basis = BASIS.MEMBER_FORMULA;
      formulaKey = selected.key;
    }
    const override = overrides.get(key);
    if (override) {
      levelKey = override.levelKey;
      basis = BASIS.MEMBER_OVERRIDE;
      formulaKey = null;
    }
    const level = levelKey ? levelsByKey.get(levelKey) : null;
    return {
      entityType: entity.type,
      entityId: Number(entity.id),
      label: entity.label,
      category: entity.category || null,
      levelKey: levelKey || null,
      levelLabel: level?.label || null,
      ordinal: level ? Number(level.definition?.ordinal) || 0 : 0,
      points: score.points,
      basis,
      formulaKey,
      inputs,
      breakdown: score.breakdown,
      certifications: bonus.certifications,
      // Always reported, so a member can see what the methodology would
      // have said before choosing to override it.
      methodologyLevelKey: methodologyLevel,
      methodologyPoints: methodologyScore.points,
    };
  });

  return {
    periodKey,
    activeFormula: selected ? { key: selected.key, label: selected.label } : { key: METHODOLOGY_FORMULA_KEY, label: methodology?.label || 'Salt Basin methodology' },
    proficiencies: resolved,
    userDefinedCount: resolved.filter((r) => USER_DEFINED_BASES.has(r.basis)).length,
  };
}

/** Synthesized assertions for calculateCareerProficiencyRollup — one per resolved entity. */
export function assertionsFromResolved(resolved, periodKey) {
  return resolved
    .filter((r) => r.levelKey)
    .map((r) => ({
      entityType: r.entityType,
      entityId: r.entityId,
      periodKey,
      levelKey: r.levelKey,
      confidence: 1,
      evidenceCount: Math.max(Number(r.inputs.engagementCount) || 0, r.points > 0 ? 1 : 0),
      lastPracticedAt: null,
      basis: r.basis,
    }));
}

/**
 * The footnote an output must carry when any displayed proficiency is not
 * methodology-driven. Returns null when everything shown is methodology.
 */
export function proficiencyFootnote(resolvedShown) {
  const userDefined = (resolvedShown || []).filter((r) => USER_DEFINED_BASES.has(r.basis));
  if (!userDefined.length) return null;
  const overrides = userDefined.filter((r) => r.basis === BASIS.MEMBER_OVERRIDE).length;
  const formula = userDefined.length - overrides;
  const parts = [];
  if (overrides) parts.push(`${overrides} set directly by the member`);
  if (formula) parts.push(`${formula} calculated with the member's own weighted formula`);
  return `Proficiency levels marked † are user-defined (${parts.join('; ')}), not Salt Basin methodology-driven.`;
}
