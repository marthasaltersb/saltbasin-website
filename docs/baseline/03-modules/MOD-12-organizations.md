# MOD-12 — Organizations & org portal

[← Current-state index](../03-current-state-specification.md) · Elements: [module-coverage § MOD-12](../inventory/module-coverage.md#mod-12--organizations--org-portal)

Inspected revision `e0ea466` · 2026-10-01. **Coverage status: registered, not deeply assessed.** Every element of this module is inventoried and linked above, but behaviour has not been read line by line in this pass. Rows below either (a) record facts read directly in this pass, or (b) register claims from existing documentation (CLAUDE.md, canon docs) as **unverified** so they are reconciled against code later rather than trusted or dropped. Column vocabularies: see the [03 index](../03-current-state-specification.md#conventions).

| ID | Module | Name and meaning | Source references | Expected current behavior | Technical element IDs | Maturity | Implementation state | Evidence and gaps | Verification state | Related IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| DEF-12-001 | MOD-12 | **Organization & membership** | CLAUDE.md "Profile system" | Three-layer identity: `personal_profiles` (1:1 users) → `org_memberships` → `organization_profiles`; `personal_org_links` links a self-employed member to their LLC org; `product_licenses`/`data_entitlements` gate Salt Basin products by org. | TE-DB-organization_profiles, TE-DB-org_memberships, TE-DB-personal_org_links | partial | implemented (tables declared) | Tables confirmed in the declared catalog; behaviour not read. `org_memberships.role` values used by SSO (`admin`) and financial sharing. | static evidence only (tables); unverified (behaviour) | MOD-02, MOD-13 |
| REQ-12-001 | MOD-12 | **Org portal** | `server/routes/orgPortal.js`; `src/components/OrgPortal.jsx`; `/org/:orgId`; AdminShell scope `org-admin` | Endpoints and screen exist (12 endpoints). | TE-SRV-routes-orgPortal, TE-UIR-org-orgId, TE-CMP-components-OrgPortal | absent | not assessed | Not read in this pass. | unverified | REQ-03-008 |
