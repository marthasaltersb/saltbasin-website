# MOD-26 — Proposal experience, Lonetree MVP & business-definition experience

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-26](../inventory/module-coverage.md#mod-26--proposal-experience-lonetree-mvp--business-definition-experience)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-26-001 | MOD-26 | **Proposal experience, Lonetree MVP, business-definition experience** | `server/routes/{proposalExperience,lonetreeMvp}.js`; `server/scripts/*` (one-off seed/convert scripts incl. named-client data) | 40 endpoints; hourly proposal feedback reminders + daily triage jobs. | see module coverage | absent | not assessed | `server/scripts/` contains client-specific provisioning scripts (e.g. `setBreckTempPassword.mjs`, `convertBreckGolden.mjs`) — operational tooling, not product features; contents not reviewed. | unverified | — |
