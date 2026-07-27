# Cross-Rod Query Convergence and Temporal Lineage

## Cross-Rod query test

Run this exact query: **"Show ARR and how it relates to pipeline, onboarded customers, and actual user
adoption."**

The system must **visibly** (not just correctly in the response payload — the intermediate steps must be
observable in the UI):

1. Identify relevant Atoms
2. Activate relevant Magnetic Field relationships
3. Form or activate relevant Molecules
4. Converge relevant Atoms against Channel Rods
5. Show Channel Rod convergence
6. Construct the compressed query Rod hash
7. Show data compilation progress
8. Return query results

If the query resolves instantly with no visible convergence sequence, or the sequence is simulated with a
generic loading spinner rather than reflecting the actual Atoms/Molecules/Rods involved, that is a gate
failure — the convergence must be legible, not decorative.

## Result lineage

- The user must be able to select a result.
- The system must visually accent every contributing data element represented in the final result
  lineage (every Atom/source that fed the answer, highlighted — not just a text citation list).
- The user must be able to select an individual contribution.
- Display complete lineage for that individual contribution (source, contributor, timestamp/effective
  date, path to the final result).

## Temporal state inspection

Provide temporal state inspection supporting at minimum:

- 10 weeks ago
- Present state
- Near-future temporary Tributaries

Near-future state must identify open decisions, definitions, deals, or other effective-dated conditions
that may impact the converged master data state — not just show a placeholder "future" tab with nothing
in it. If there are no open near-future conditions in the test data, seed or note at least one so the
near-future view has something real to display and isn't structurally untestable.

Cross-reference: `server/lib/eidos.js` (Atoms/Molecules/Magnetic Field/query convergence),
`src/lib/journeyEngine/lineage.js` and related lineage utilities, effective-dating fields on
`journey_data_rods` / EIDOS tables.
