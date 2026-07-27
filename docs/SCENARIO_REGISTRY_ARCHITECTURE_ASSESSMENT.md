# Scenario Repository Architecture Assessment

The scenario vocabulary extends the existing platform rather than replacing it. Canonical rods and their event/evidence history remain in `journey_data_rods`; atoms retain the current crystal geometry, lineage, maturity, and path-color mechanics; molecules retain existing bonding and reader-specific visibility; metrics remain transaction-derived definitions; audit and field lineage remain the temporal provenance layer.

The new scenario registry is configuration between governed workbook import and runtime consumers. Its responsibilities are identity, normalization, validation, signatures, deterministic matching, explainable similarity, expectations, and fixture contracts. It does not mutate financial state.

Recommended next vertical slice: add reviewed Postgres tables for scenario definition versions and unresolved observations, then connect one representative `Expansion` source event through an existing domain generation rule, reconciliation evaluation, metric invalidation, and retained calculation lineage.
