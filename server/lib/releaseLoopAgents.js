// Platform-default agent roster for the release loop (agent_definitions rows,
// pipeline 'release_loop', org_id and owner_user_id NULL). Built from the
// shipped definition so the roles stay data. Insert-if-missing only: an admin
// or org that later edits or shadows a row keeps its version (same convention
// as the career/commercial roster in db.js).
import { loadDefaultDefinition } from './releaseLoopDefinition.js';

// Roles the definition names outside `roles`: the failure-reconciliation agent
// (definition.failureReconciliation) and the scope agent (definition.scopeCheck).
export function derivedRoles(def) {
  return [
    {
      key: 'release_reconciler', name: 'Reconciliation agent',
      does: def.failureReconciliation?.rule || 'Verifies and classifies every reported failure, refusal, partial step or deviation.',
      produces: [def.failureReconciliation?.report || 'docs/triage/<feature>-<build|fix>[-rN]-reconciliation.md'],
    },
    {
      key: 'release_scope_reviewer', name: 'Scope agent',
      does: def.scopeCheck?.rule || 'Decides whose bug each triage item is.',
      produces: [def.scopeCheck?.decisionsFile || 'docs/triage/scope-review.json'],
    },
  ];
}

const BOUNDARIES = {
  release_validator: ['Edit a training spec or baseline', 'Substitute script checks for the browser journey'],
  release_fixer: ['Edit a training spec or baseline', 'Mark a bug verified (only a passing re-test does)'],
  release_spec_reviewer: ['Decide an amendment it proposed', 'Weaken an expected result without the checklist'],
  release_reconciler: ['Mark an item resolved without evidence'],
  release_triage: ['Fix code', 'Edit a training spec or baseline'],
};
const DEFAULT_BOUNDARIES = ['Push to a remote', 'Write real personal or employer data into a committed file'];

export function buildReleaseLoopRoster(def = loadDefaultDefinition()) {
  return [...def.roles, ...derivedRoles(def)].map((r) => ({
    key: r.key,
    name: r.name,
    pipeline: 'release_loop',
    tier: 1,
    roleDescription: r.does,
    objective: `Perform the "${r.name}" role of the Salt Basin release loop exactly as the platform definition describes it.`,
    capabilities: [r.does, ...(r.produces || []).map((p) => `Produces ${p}`)],
    boundaries: BOUNDARIES[r.key] || DEFAULT_BOUNDARIES,
  }));
}

/** Insert-if-missing platform defaults. `sql` is the postgres client used inside db.js bootstrap. */
export async function seedReleaseLoopAgents(sql, now = Date.now()) {
  for (const a of buildReleaseLoopRoster()) {
    await sql.unsafe(
      `INSERT INTO agent_definitions (org_id, owner_user_id, key, name, pipeline, role_description, objective, capabilities, boundaries, reports_to_agent_id, tier, is_active, created_at, updated_at)
       VALUES (NULL, NULL, $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,NULL,$8,true,$9,$9)
       ON CONFLICT (key) WHERE org_id IS NULL AND owner_user_id IS NULL DO NOTHING`,
      [a.key, a.name, a.pipeline, a.roleDescription, a.objective, a.capabilities, a.boundaries, a.tier, now],
    );
  }
}
