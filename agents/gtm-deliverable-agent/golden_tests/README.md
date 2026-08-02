# Testing, before any schedule gets wired up

Per the roadmap's "Testing — before you trust it unattended" checklist.

## 1. Dry-run the edge cases (no API key needed)

```bash
python golden_tests/dry_run_edge_cases.py
```

Runs the client-data normalization pass against `fixtures/messy_client_export.csv`
— missing values, mixed EUR/USD in one column, ambiguous abbreviations, a
duplicate-looking row — and asserts it flags what it can't confidently
resolve instead of guessing. Already run once during the build; passes.

## 2. Golden test set (needs `ANTHROPIC_API_KEY`)

```bash
python golden_tests/run_golden_test.py \
  --topic "Revenue leakage in usage-based billing" \
  --reference ../source-docs/golden-deliverables/HandoverOS_Revenue_Leakage_v22.xlsx
```

Runs the agent live (not batched — full-price but fast, for iteration) against
a topic you already have a real answer for, writes the output to
`golden_tests/output/<timestamp>/`, and prints a comparison checklist.
Open the generated `deliverable.xlsx`/`.docx` next to the reference file and
work through the checklist by hand — this comparison is inherently a human
judgment call, not something to fully automate.

The repo ships one real reference deliverable:
`source-docs/golden-deliverables/HandoverOS_Revenue_Leakage_v22.xlsx`. Add
more here as Betsy provides them — 2-3 is the roadmap's recommendation.

**Log every correction and why** (wrong tone / weak source / missed
connection / confidence level too generous) in a running note next to this
folder. After a few cycles that log is the prompt-refinement punch list for
`context/salt_basin_context.md`.

## 3. Human review gate

Stays on through this entire testing phase and into the first several live
cycles once cron is wired up — see `../README.md`. Nothing in this agent
auto-sends or auto-publishes; `fetch_batch_results.py` only ever writes
files to `output/` for manual review.
