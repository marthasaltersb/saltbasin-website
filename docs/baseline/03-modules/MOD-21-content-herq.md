# MOD-21 — Content pipeline, publications & HERQ

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-21](../inventory/module-coverage.md#mod-21--content-pipeline-publications--herq)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-21-001 | MOD-21 | **Content pipeline, publications, HERQ, website intelligence** | `server/routes/{herq,publicationPipelines,contentAttachments,contentPublications}.js`; `.claude/skills/salt-basin-website-intelligence` | 35 endpoints; `GET /api/herq/posts` public. Hourly content-attachment retention job. | see module coverage | absent | not assessed | `docs/herq-content-pipeline-test-plan.md` exists (not reconciled). | unverified | — |
