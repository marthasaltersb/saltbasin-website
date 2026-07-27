import { createHash } from 'node:crypto';

export function canonicalizeAtomAssignments(assignments) {
  const normalized = assignments.map((item) => Array.isArray(item) ? { path: item[0], value: item[1] } : item)
    .map(({ path, value }) => ({ path: String(path).trim().toLowerCase(), value: String(value).trim() }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const seen = new Set();
  for (const item of normalized) {
    if (!item.path || !item.value) throw new Error('Atom path and value are required');
    if (seen.has(item.path)) throw new Error(`Duplicate atom path: ${item.path}`);
    seen.add(item.path);
  }
  return normalized;
}

export function createScenarioSignature(assignments) {
  const atoms = canonicalizeAtomAssignments(assignments);
  const canonical = atoms.map(({ path, value }) => `${path}=${value}`).join('|');
  return { id: `SBSIG-${createHash('sha256').update(canonical).digest('hex')}`, canonical, atoms };
}
