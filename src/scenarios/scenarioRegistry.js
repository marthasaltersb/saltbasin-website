import fs from 'node:fs';
import { createScenarioSignature, canonicalizeAtomAssignments } from './scenarioSignature.js';

export const DEFAULT_ATOM_WEIGHTS = Object.freeze({
  'commercial.event': 3, 'product.model': 3, 'pricing.model': 3, 'customer.state': 2.5,
  'usage.state': 2.5, 'revenue.pattern': 2.5, 'billing.cadence': 1.25,
  'billing.timing': 1.25, 'payment.method': 1, 'invoice.state': 1, 'security.slice': 0.75,
});

const mapAtoms = (atoms) => new Map(canonicalizeAtomAssignments(atoms).map(a => [a.path, a.value]));

export function compareAtoms(queryAtoms, candidateAtoms, weights = DEFAULT_ATOM_WEIGHTS) {
  const query = mapAtoms(queryAtoms); const candidate = mapAtoms(candidateAtoms);
  const keys = new Set([...query.keys(), ...candidate.keys()]); let matched = 0; let total = 0;
  const matchingAtoms = [], differingAtoms = [], missingAtoms = [], novelAtoms = [];
  for (const path of [...keys].sort()) {
    const weight = weights[path] ?? 1; total += weight;
    const q = query.get(path); const c = candidate.get(path);
    if (q !== undefined && c !== undefined && q === c) { matched += weight; matchingAtoms.push({ path, value: q, weight }); }
    else if (q !== undefined && c !== undefined) differingAtoms.push({ path, expected: c, actual: q, weight });
    else if (q === undefined) missingAtoms.push({ path, expected: c, weight });
    else novelAtoms.push({ path, value: q, weight });
  }
  return { similarity: total ? matched / total : 0, matchingAtoms, differingAtoms, missingAtoms, novelAtoms };
}

export class ScenarioRegistry {
  constructor(data) {
    this.scenarios = data.scenarios || []; this.byId = new Map(); this.bySignature = new Map();
    for (const scenario of this.scenarios) { this.byId.set(scenario.scenarioId, scenario); const list = this.bySignature.get(scenario.signature.id) || []; list.push(scenario); this.bySignature.set(scenario.signature.id, list); }
  }
  static fromFile(path = 'generated/scenarios/scenario-registry.json') { return new ScenarioRegistry(JSON.parse(fs.readFileSync(path, 'utf8'))); }
  get(id) { return this.byId.get(id) || null; }
  findBySignature(signature) { return [...(this.bySignature.get(typeof signature === 'string' ? signature : signature.id) || [])]; }
  findByAtom(path, value) { return this.scenarios.filter(s => s.atoms.some(a => a.path === path && a.value === value)); }
  findByAtoms(assignments) { const wanted = mapAtoms(assignments); return this.scenarios.filter(s => { const have = mapAtoms(s.atoms); return [...wanted].every(([k,v]) => have.get(k) === v); }); }
  getMetricDependencies(id) { return this.get(id)?.expectations.metricDependencies || []; }
  getImpactedScenarios(metricIdOrName) { return this.scenarios.filter(s => s.expectations.metricDependencies.some(m => m.metricId === metricIdOrName || m.name === metricIdOrName)); }
  nearest(assignments, { limit = 5, weights } = {}) { return this.scenarios.map(s => ({ scenarioId: s.scenarioId, ...compareAtoms(assignments, s.atoms, weights) })).sort((a,b) => b.similarity-a.similarity || a.scenarioId.localeCompare(b.scenarioId)).slice(0, limit); }
  resolveFromAtoms(assignments, options = {}) { const signature = createScenarioSignature(assignments); const exact = this.findBySignature(signature); return exact.length ? { exactMatch: true, signature, scenarios: exact, candidateScenarios: [] } : { exactMatch: false, signature, scenarios: [], candidateScenarios: this.nearest(assignments, options) }; }
}
