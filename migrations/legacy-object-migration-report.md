# Legacy object migration report

Generated 2026-07-12. This is a semantic inventory, not a global replacement report.

## Migrated

- The Re-trade / Financing Change Customer Journey divergence is a Journey Tributary. Its renderer identity, agent, objective, and return point now use Tributary and Confluence semantics.
- The prior merge ring is a Confluence and retains lineage rather than deleting the Tributary.
- Member Organization Branch was challenged and rejected as a Tributary. It is a typed Member Organization Relationship.
- Legacy maturity/score values cross a compatibility boundary as historical observations. They are not settlement density.

## Intentionally retained

- `branchAngleDeg` and `branchElevation` in spatial layout are geometric vector vocabulary, not business domain objects.
- Business Definition tree branching is configuration-tree structure, not a Journey Tributary.
- Git branch terminology is software configuration management.
- Data adapter remains a valid software boundary; only source-system integration boundaries become Ports.

## Pending migration

- Database journey tables still contain `stage_score`, confidence, gate, and molecule-key vocabulary. They require versioned schema/data migration with a database snapshot; no live records were rewritten in this pass.
- Existing renderer maturity mechanics still drive parts of the prototype. The compatibility adapter prevents semantic promotion, but projection-relative settlement must replace those mechanics before production claims.
