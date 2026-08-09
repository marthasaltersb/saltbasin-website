function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function recencyScore(lastPracticedAt, now = Date.now()) {
  if (!lastPracticedAt) return 0.5;
  const years = Math.max(0, (now - Number(lastPracticedAt)) / (365.25 * 24 * 60 * 60 * 1000));
  return clamp(1 - years / 10);
}

function groupLabel(entity, groupBy) {
  if (groupBy === 'skill' || groupBy === 'tool') return entity.label;
  if (groupBy === 'capability' || groupBy === 'category') return entity.category || 'Uncategorized';
  if (groupBy === 'domain') return entity.domain || entity.category || 'Uncategorized';
  if (groupBy === 'industry') return entity.industry || 'Unspecified';
  return entity.category || entity.label;
}

export function calculateCareerProficiencyRollup({ assertions, levels, periods = [], entities, rollup }) {
  const config = rollup.definition || {};
  const levelByKey = new Map(levels.filter((x) => x.isActive !== false).map((x) => [x.key, x]));
  const entityByKey = new Map(entities.map((x) => [`${x.type}:${x.id}`, x]));
  const periodByKey = new Map(periods.map((x) => [x.key, x]));
  const periodKeys = new Set(config.periodKeys || []);
  const eligible = assertions.filter((a) => {
    if (periodKeys.size && !periodKeys.has(a.periodKey)) return false;
    if (Number(a.evidenceCount || 0) < Number(config.minimumEvidenceCount || 0)) return false;
    return levelByKey.has(a.levelKey) && entityByKey.has(`${a.entityType}:${a.entityId}`);
  });
  const maxOrdinal = Math.max(...levels.map((x) => Number(x.definition?.ordinal) || 0), 1);
  const weights = { proficiency: 0.5, recency: 0.2, engagementBreadth: 0.15, evidenceConfidence: 0.15, ...(config.weights || {}) };
  const weightTotal = Object.values(weights).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) || 1;
  const groups = new Map();

  for (const assertion of eligible) {
    const entity = entityByKey.get(`${assertion.entityType}:${assertion.entityId}`);
    const level = levelByKey.get(assertion.levelKey);
    const ordinal = Number(level.definition?.ordinal) || 0;
    const normalized = ordinal / maxOrdinal;
    const parts = {
      proficiency: normalized,
      recency: recencyScore(assertion.lastPracticedAt),
      engagementBreadth: clamp(Number(assertion.evidenceCount || 0) / 10),
      evidenceConfidence: clamp(assertion.confidence),
    };
    let score;
    if (config.measure === 'evidence_count') score = Number(assertion.evidenceCount || 0);
    else if (config.measure === 'experience_duration') {
      const period = periodByKey.get(assertion.periodKey)?.definition || {};
      const start = Number(period.startYear);
      const end = Number(period.endYear) || new Date().getFullYear();
      score = Number.isFinite(start) && start > 0 ? Math.max(0, end - start + 1) : 0;
    }
    else if (config.measure === 'current_level' || config.measure === 'peak_level' || config.measure === 'sustained_level') score = ordinal;
    else score = Object.entries(weights).reduce((sum, [key, weight]) => sum + (parts[key] || 0) * Math.max(0, Number(weight) || 0), 0) / weightTotal * maxOrdinal;
    const group = groupLabel(entity, config.groupBy || 'capability');
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ score, ordinal, assertion, entity, level });
  }

  const results = [...groups.entries()].map(([label, rows]) => {
    const values = rows.map((r) => r.score);
    let value;
    if (config.measure === 'peak_level') value = Math.max(...values);
    else if (config.measure === 'sustained_level') value = Math.min(...values);
    else if (config.measure === 'evidence_count' || config.measure === 'experience_duration') value = values.reduce((sum, v) => sum + v, 0);
    else value = values.reduce((sum, v) => sum + v, 0) / values.length;
    return {
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      label,
      value: Number(value.toFixed(2)),
      maxValue: ['evidence_count','experience_duration'].includes(config.measure) ? null : maxOrdinal,
      assertionCount: rows.length,
      evidenceCount: rows.reduce((sum, r) => sum + Number(r.assertion.evidenceCount || 0), 0),
      entities: rows.map((r) => ({ type: r.entity.type, id: r.entity.id, label: r.entity.label, level: r.level.label, periodKey: r.assertion.periodKey })),
    };
  }).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  return {
    rollupKey: rollup.key,
    label: rollup.label,
    groupBy: config.groupBy || 'capability',
    measure: config.measure || 'weighted_proficiency',
    maxValue: ['evidence_count','experience_duration'].includes(config.measure) ? null : maxOrdinal,
    groups: results,
    inputs: { assertionCount: eligible.length, entityCount: new Set(eligible.map((a) => `${a.entityType}:${a.entityId}`)).size },
  };
}
