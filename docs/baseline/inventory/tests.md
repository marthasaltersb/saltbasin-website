# Automated tests and scripts

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


## Test files (17)

Runner detected from imports. Case names are extracted from `test(…)`/`it(…)` calls; execution results are **not** recorded here (see `../10-test-catalog.md`).

| Element ID | File | Runner | Cases | Case names |
|---|---|---|---|---|
| TE-TST-server-lib-agentStudioGovernance | `server/lib/agentStudioGovernance.test.js` | node:test | 3 | hydrates canonical authority and iteration gates; rejects self-expanded authority; accepts role configuration that does not redefine its boundary |
| TE-TST-server-lib-agents-crystalWorldAuditAgent | `server/lib/agents/crystalWorldAuditAgent.test.js` | node:test | 4 | canonical Crystal World registries pass deterministic validation; primary scenes participate in runtime lineage collection; experiential audit does not confuse valid lineage with usable 3D navigation; audit records zero LLM calls |
| TE-TST-server-lib-agents-staticHeuristics | `server/lib/agents/staticHeuristics.test.js` | jest | 11 | flags files with no sibling test, skips files that have one; flags an inline hex color; flags a magic timing constant; flags a domain-vocabulary literal array; flags a long switch/case chain; does not flag anything under a config/ or data/ directory; DOES flag a *Registry.js file outside config/data — filename alone is not an exemption; a clean file with none of the patterns produces no candidates |
| TE-TST-server-lib-cronMatch | `server/lib/cronMatch.test.js` | jest | 8 | accepts a standard 5-field expression; accepts step and range syntax; rejects wrong field count; rejects an out-of-range value; matches an exact minute/hour; matches a step schedule; respects day-of-week; an invalid cron string is never due |
| TE-TST-server-lib-seo | `server/lib/seo.test.js` | jest | 3 | falls back to the site name for the home page with no seo block; falls back to "<page name> \| <site name>" for a non-home page with no seo block; an explicit page.seo block overrides every fallback |
| TE-TST-src-lib-experienceAssetPipeline | `src/lib/experienceAssetPipeline.test.js` | node:test | 2 | reuses a governed asset before generating a new one; requires approval when the genome cannot express the asset |
| TE-TST-src-lib-experienceCompiler | `src/lib/experienceCompiler.test.js` | node:test | 1 | compiles the reference journey through governed world and variant registries |
| TE-TST-src-lib-sceneManifest | `src/lib/sceneManifest.test.js` | node:test | 3 | attaches and collects a governed scene entry; reports renderables without lineage; allows explicitly decorative renderables |
| TE-TST-src-lib-uxRuntimeAudit | `src/lib/uxRuntimeAudit.test.js` | node:test | 2 | experiential score reflects severity instead of registry validity; repeated instances of one rule do not erase the entire score |
| TE-TST-tests-agentContextRegistry | `tests/agentContextRegistry.test.js` | node:test | 2 | BestyStaff cache behavior resolves from a registered policy; context cache refuses an implicit freshness policy |
| TE-TST-tests-bestystaff-auth-proposal | `tests/bestystaff-auth-proposal.test.js` | node:test | 10 | intake order places email and CAPTCHA immediately after relationship; career and B2B intent classification is deterministic; career email gate recognizes consumer domain without manual work validation; B2B generic email remains accepted but requires manual work validation; B2B custom-domain email avoids the manual-domain flag; career conversion requires verified email plus registration or pledge;  |
| TE-TST-tests-crystal-orbit-chat | `tests/crystal-orbit-chat.test.js` | node:test | 3 | chat acceptance catalog covers every required capability area; all p0 scenarios are reproducible at declared viewports; source and configuration contracts pass |
| TE-TST-tests-financialPolicyRegistry | `tests/financialPolicyRegistry.test.js` | node:test | 4 | personal financial policy is member-private; secured debt is never silently classified as unsecured; providers retain credentials outside semantic evidence; sharing is limited to derived output classes |
| TE-TST-tests-metricVisualEncodingRegistry | `tests/metricVisualEncodingRegistry.test.js` | node:test | 4 | visual channels have one semantic source each; distance means relevance and fill means completeness; atom renderer ranges resolve from a named profile; higher relevance always resolves closer to the query context |
| TE-TST-tests-queryConvergence | `tests/queryConvergence.test.js` | node:test | 7 | every composite methodology is normalized configuration; relevance exposes configured component contributions; coverage deduplicates atoms and excludes optional dimensions; confidence remains separate from coverage; stability is inverse configured unresolved-evidence risk; evidence adapter never invents confidence or stability without evidence fields; evidence adapter derives separate metrics from |
| TE-TST-tests-rodMathematics | `tests/rodMathematics.test.js` | node:test | 18 | configured composite weights are normalized; rod position separates cycle, stage, and intra-stage position; stage completeness uses configured requirement buckets; readiness explains contradictions rather than acting as a hard stop; maturity is purpose-scoped and never collapses to one score; a purpose is capped by its dependencies; confidence uses the MVP_20B components and risk can only lower it |
| TE-TST-tests-scenarios | `tests/scenarios.test.js` | node:test | 9 | imports 2400 permanent unique IDs; signature ignores atom order and changes with material value; exact resolution works; similarity is deterministic, bounded, and explained; weighted defining atoms affect score; novel combinations create review observation without permanent ID; fixture is a deterministic domain-service contract; dependency lookup uses governed metric identifiers; invalid and confl |

## Verification scripts

- `scripts/verify-besty-auth-proposal.mjs`
- `scripts/verify-crystal-orbit-chat.mjs`
- `scripts/verify-metric-intelligence.mjs`

## package.json scripts

| Element ID | Script | Command |
|---|---|---|
| TE-SCR-dev | `dev` | `concurrently -k -n web,api -c cyan,magenta "vite" "node --watch server/index.js"` |
| TE-SCR-client | `client` | `vite` |
| TE-SCR-server | `server` | `node --watch server/index.js` |
| TE-SCR-build | `build` | `vite build` |
| TE-SCR-postbuild | `postbuild` | `node scripts/run-codex-contribution-intelligence.mjs` |
| TE-SCR-contributioncodex | `contribution:codex` | `node scripts/run-codex-contribution-intelligence.mjs` |
| TE-SCR-contributionclaude | `contribution:claude` | `node scripts/run-claude-contribution-intelligence.mjs` |
| TE-SCR-contributionimport-codex | `contribution:import-codex` | `node scripts/import-codex-raw-events.mjs` |
| TE-SCR-backlogreconcile-history | `backlog:reconcile-history` | `node scripts/reconcile-backlog-history.mjs` |
| TE-SCR-start | `start` | `node server/index.js` |
| TE-SCR-preview | `preview` | `vite preview` |
| TE-SCR-seed | `seed` | `node server/data/seed.js` |
| TE-SCR-verifymetrics | `verify:metrics` | `node scripts/verify-metric-intelligence.mjs` |
| TE-SCR-verifycrystal-orbit | `verify:crystal-orbit` | `node scripts/verify-crystal-orbit-chat.mjs` |
| TE-SCR-verifycrystal-orbitlive | `verify:crystal-orbit:live` | `node scripts/verify-crystal-orbit-chat.mjs --live` |
| TE-SCR-testcrystal-orbit | `test:crystal-orbit` | `node --test tests/crystal-orbit-chat.test.js` |
| TE-SCR-scenariosimport | `scenarios:import` | `node scripts/run-scenario-import.mjs` |
| TE-SCR-scenariosvalidate | `scenarios:validate` | `node scripts/validate-scenario-registry.mjs` |
| TE-SCR-scenariosfixture | `scenarios:fixture` | `node scripts/generate-scenario-fixture.mjs` |
| TE-SCR-testscenarios | `test:scenarios` | `node --test tests/scenarios.test.js` |
| TE-SCR-testbestystaff | `test:bestystaff` | `node --test tests/bestystaff-auth-proposal.test.js` |
| TE-SCR-verifybestystaff | `verify:bestystaff` | `node scripts/verify-besty-auth-proposal.mjs` |
| TE-SCR-test | `test` | `node --experimental-vm-modules ./node_modules/jest/bin/jest.js` |
