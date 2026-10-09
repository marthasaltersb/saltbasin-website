// Per-output overrides over Career Master for template-driven outputs
// (2026-10-02, career-bound-outputs, fix round 1).
//
// A template-driven output reads Career Master live (ctx.master). Wording the
// member changes FOR THIS OUTPUT ONLY is kept in the template config under
// `masterOverrides` (additive; absent on every existing template):
//
//   { jobs: { [jobId]: { title?, startDate?, endDate?, keyMetrics? } },
//     skills: { [id]: { skill? } }, tools: { [id]: { currentName? } },
//     certifications: { [id]: { name? } } }
//
// A field with no entry follows Career Master, so a Career Master edit flows
// through. An entry equal to the Career Master value is not an override.
export const OVERRIDABLE_JOB_FIELDS = [
  ['title', 'Title'], ['startDate', 'Start date'], ['endDate', 'End date'], ['keyMetrics', 'Key metrics & achievements'],
];
const LISTS = ['jobs', 'skills', 'tools', 'certifications'];

export function applyMasterOverrides(master, overrides) {
  if (!master || !overrides || typeof overrides !== 'object') return master;
  const next = { ...master };
  for (const list of LISTS) {
    const byId = overrides[list];
    if (!byId || !Array.isArray(master[list])) continue;
    next[list] = master[list].map((row) => {
      const o = byId[String(row.id)];
      if (!o) return row;
      const patched = { ...row };
      for (const [k, v] of Object.entries(o)) if (typeof v === 'string') patched[k] = v;
      return patched;
    });
  }
  return next;
}

/** Returns a copy of `overrides` with one field set (or removed when value is null). */
export function withOverride(overrides, list, id, field, value) {
  const next = { ...(overrides || {}) };
  const byId = { ...(next[list] || {}) };
  const row = { ...(byId[String(id)] || {}) };
  if (value == null) delete row[field]; else row[field] = value;
  if (Object.keys(row).length) byId[String(id)] = row; else delete byId[String(id)];
  if (Object.keys(byId).length) next[list] = byId; else delete next[list];
  return next;
}
