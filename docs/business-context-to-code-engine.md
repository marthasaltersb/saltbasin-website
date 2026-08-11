# Business Context to Code Implementation Engine

## Purpose

This operating layer turns governed Codex and Claude conversations into canonical requirements, implementation evidence, tests, deployments, contribution intelligence, reusable business rules, and reviewable publication outputs. A transcript is evidence; it is never itself the canonical requirement.

## Canonical chain

`chat event → extracted requirement source → canonical backlog item → component → deployment → test scenario/run/result → defect or promotion gate → HERQ output review → publication`

Every join retains its source identifiers, timestamps, contributor identities, confidence, and environment. Multiple people and agents may participate in one session.

## Requirement matching and upsert

1. Group immutable `raw_events` by platform and source session.
2. Use the selected Codex or Claude API to extract bounded requirement candidates.
3. Compute a deterministic title fingerprint and token-overlap score.
4. Exact fingerprint matches update the canonical item. A similarity score of at least `0.58` creates an additional source link to the best matching item. Lower scores create a new item.
5. Prefer the more complete requirement, rules, acceptance criteria, and structured design while preserving every source in `backlog_requirement_sources`.
6. Re-running is idempotent through canonical keys and source uniqueness constraints.

## Contribution intelligence

`backlog_contribution_links` allocates versioned `contribution_events` to canonical backlog items. Rollups retain estimates and actuals separately and distinguish `human` from agent contributors. `agent_session_participants` does not assume a single end user.

## Design and production state

Each canonical item carries:

- narrative requirement fields already used by the Backlog drawer;
- `design_definition` for data schema, functionality, and architecture;
- `production_state` for current commit, deployment, environment, and effective time;
- `backlog_components` for folder, file, build, and runtime-surface mappings;
- composition percentages derived from source, design, implementation, QA, deployment, and contribution completeness.

Status is a projection of evidence composition. A label alone must not claim implementation, verification, deployment, or production currency.

## Shared QA model

The existing `test_scenarios`, `test_scenario_steps`, `test_runs`, and `test_run_step_results` remain canonical. They are extended with user profile, process, data, action, expected/actual behavior, automation, deployment, executor, and screenshot evidence. Features and defects use the same objects through `test_scenario_features` and subject links.

A failed step must include screenshot/evidence and creates a child defect. The defect records reproduction steps and whether redeployment is required. Configuration fixes still require promotion, but may carry a lower deployment-effort classification.

## Deployment and promotion

GitHub/CI posts commit, ref, environment, timestamp, deployment reference, and changed files to the deployment-intelligence endpoint. Changed paths resolve components and canonical backlog items. Promotion evaluation requires every required scenario to have a passing result for the relevant deployment.

The environment sequence is `sandbox → test → production`. The application calculates and records eligibility; CI owns the external hosting mutation. `VITE_TEST_BASE_URL` points “Test Sign In” to the isolated replica rather than allowing production credentials to be submitted to a path alias.

## Publication outputs

After deployment, output jobs will aggregate architecture, tech stack, timeline, capability shipments, decisions, lessons, business problems, cost allocation, avoided costs, agent specifications, hierarchy visuals, orbit journeys, and spatial-journey manifests. Outputs use HERQ templates and enter human review. Text, visual rules, grouping rules, data inputs, and image prompts remain configurable before publishing.

Generated imagery must use an approved Salt Basin brand profile, user-authored scenario prompt, professional-photo composition policy, and deterministic bottom-right Salt Basin logo/copyright overlay. Image generation and logo composition are separate provenance steps so the original generation and branded derivative remain auditable.

## External gates

- GitHub push and pull request creation require authenticated GitHub tooling.
- Sandbox/test hosting requires a separately provisioned replica URL and environment-specific secrets/database.
- Automated production promotion requires CI credentials and must consume an eligible promotion-gate record.
- Image generation requires an approved provider credential, model policy, asset storage, and review approval.

