# MOD-19 — Platform lifecycle management — backlog, QA, deployment & contribution intelligence

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-19](../inventory/module-coverage.md#mod-19--platform-lifecycle-management--backlog-qa-deployment--contribution-intelligence)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-19-001 | MOD-19 | **Backlog, QA, deployment intelligence, contribution intelligence** | `server/routes/{backlog,qa,deploymentIntelligence,backlogOutputs,feedback}.js`; `docs/salt-basin-contribution-intelligence-progress.md` | Admin tools (backlog router is `requireAdmin`); 12 of this module's tables are created lazily on first request (REQ-01-002). | TE-SRV-routes-backlog, TE-SRV-lib-backlogIntelligenceSchema | absent | not assessed | Repo also holds large backlog JSON dumps at the root (`backlog-full.json` etc.) — status as data or artefact undetermined. | unverified | REQ-01-002 |
