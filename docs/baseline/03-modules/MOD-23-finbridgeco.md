# MOD-23 — FinBridgeCo & accounting

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-23](../inventory/module-coverage.md#mod-23--finbridgeco--accounting)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-23-001 | MOD-23 | **FinBridgeCo & accounting ledger** | `server/routes/finbridgeco.js`; tables `gl_accounts`, `journal_entries`, `journal_entry_lines`, `accounting_*` | 5 endpoints. | TE-SRV-routes-finbridgeco | absent | not assessed | — | unverified | — |
