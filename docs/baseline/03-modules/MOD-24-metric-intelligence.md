# MOD-24 — Metric intelligence

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-24](../inventory/module-coverage.md#mod-24--metric-intelligence)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-24-001 | MOD-24 | **Metric intelligence** | `server/routes/metricIntelligence.js` | All endpoints behind router-level admin middleware (`role !== 'admin'` → 401); registry sync upserts `CORE_METRICS` into `metric_definitions`; ARR demo calculation. | TE-SRV-routes-metricIntelligence, TE-SRV-lib-metricIntelligence | partial | implemented | Read in this pass (first 60 lines). Uses 401 (not 403) for authenticated non-admins. | static evidence only | — |
