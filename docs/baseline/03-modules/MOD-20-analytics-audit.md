# MOD-20 — Analytics, events & audit

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-20](../inventory/module-coverage.md#mod-20--analytics-events--audit)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-20-001 | MOD-20 | **Audit trail** | `server/lib/audit.js` (`audit()`) | Security-relevant actions write audit rows (`auth.login`, `auth.login.failed` incl. submitted email, `auth.logout`, `auth.sso.login`, `site.publish`, `site.draft.save`, `commerce.checkout.stub`, …). | TE-SRV-lib-audit, TE-DB-audit_log, TE-DB-audit_events | partial | implemented | Two audit tables exist (`audit_log`, `audit_events`); which one `audit()` writes and why both exist not traced. Runtime probe produced 1 `audit_log` row (the probe login). Retention not located. | static evidence only | — |
| REQ-20-002 | MOD-20 | **Analytics events** | `/api/events/page-view`, `/api/analytics/events` (public), `/api/field-audit` | Public event ingestion endpoints. | TE-API-POST-api-events-page-view, TE-API-POST-api-analytics-events | absent | not assessed | Rate limiting / abuse controls not checked. | unverified | — |
