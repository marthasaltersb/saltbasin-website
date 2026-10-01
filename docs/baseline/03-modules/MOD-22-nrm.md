# MOD-22 — Network Relationship Management (NRM)

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-22](../inventory/module-coverage.md#mod-22--network-relationship-management-nrm)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-22-001 | MOD-22 | **Network Relationship Management** | `server/routes/nrm.js`; `NrmPanel.jsx` (admin and member variants) | 10 endpoints; `POST /api/nrm/reference-requests` and `GET /api/nrm/marketplace/search` have no guard pattern. | TE-SRV-routes-nrm | absent | not assessed | — | unverified | — |
