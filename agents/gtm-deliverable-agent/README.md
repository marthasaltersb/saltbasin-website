# GTM Deliverable & Benchmark Research Agent

> **Superseded (2026-08-02).** This standalone Python CLI is no longer the
> maintained path — the same design now runs natively in the platform,
> configurable from the admin "GTM Deliverables" tab
> (`src/components/admin/GtmDeliverablesPanel.jsx`), using the server's own
> already-provisioned `ANTHROPIC_API_KEY` (no personal key, no terminal, no
> script to run). See `server/lib/gtm/` and `server/routes/gtmDeliverables.js`.
> This directory is kept in place because its `context/` and `schema/` files
> are the native build's own single-source-of-truth inputs (read directly off
> disk at request time — see `server/lib/gtm/context.js` and
> `clientDataNormalize.js`), and its `lib/*.py` remains a useful reference for
> the original design (exact schema shapes, xlsx formula patterns, styling
> constants). The two GitHub Actions workflows that used to run this script
> (`gtm-benchmark-submit.yml` / `gtm-benchmark-fetch.yml`) have been removed
> and replaced by `.github/workflows/gtm-deliverables-cron.yml`, which just
> pings the server's own `/api/gtm-deliverables/run-due` endpoint.

Agent #1 from the Autonomous Agent Roadmap, including the client
source-data mapping expansion. Standalone Python — calls the Claude API
directly with your own key, not through Cowork's managed scheduling.

## What it does

Given a topic (e.g. "revenue leakage in usage-based billing"), researches
primary-sourced benchmarks via `web_search`, and drafts a deliverable
structured like a real HandoverOS workbook: Executive Summary, Benchmark
Master, Assumptions & Methodology (verified statistics / modeled
assumptions with conservative-base-optimistic ranges / scenario-to-source
confidence mapping), and an Impact Quantification ROI calculator with live
formulas. Anything it can't verify to a primary source gets flagged, never
invented.

The default topic list (`schema/topics.json`), the anchor case studies and
exposure-formula grounding, and the variance-threshold/exception-class logic
used in Data Quality Gaps are all pulled directly from Betsy's own source
material — the Q2R Diagnostic Framework playbook and the FinBridgeCo /
HandoverOS Enterprise Data Architecture doc — not invented for this agent.
See `context/salt_basin_context.md` for the specifics and citations back to
those source docs. The executive summary can also be generated in one of
three styles pulled from her real exec-templates library
(`--exec-style financial_first|narrative_first|dashboard`, defaults to
`financial_first`).

When a client export is provided (`run_engagement.py --client-file ...`),
it also normalizes the client's raw columns against
`schema/capability_mapping_schema.json`, runs the client's actual figures
through the same model, and adds a Client Actuals vs. Benchmark section —
flagging data-quality gaps and unmapped fields rather than guessing at them.

**Human review gate is on.** Nothing here sends or publishes anything.
`fetch_batch_results.py` only ever writes files to `output/` — a docx, an
xlsx, and a `REVIEW_ME_FIRST.md` punch list — for you to review before
anything goes near a client.

## Setup

```bash
cd agents/gtm-deliverable-agent
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY
```

Set a monthly spend limit on the API workspace at console.anthropic.com
before running this unattended for the first time.

## Usage

**Benchmark-only deliverable** (no client data), submitted via the Batch
API (50% off, results within a few hours):

```bash
python run_engagement.py --topic "Revenue leakage in usage-based billing"
python fetch_batch_results.py --batch-id <id-from-above>
```

**Engagement with client data.** Drop the export in `CLIENT_DATA_DIR`
(defaults to `./secure_input/`, gitignored — see the security note below),
then:

```bash
python run_engagement.py \
  --topic "Revenue leakage in usage-based billing" \
  --client-file acme_contracts.csv \
  --client-name "Acme Inc" \
  --exec-style dashboard
python fetch_batch_results.py --batch-id <id-from-above>
```

`--exec-style` works on both `run_engagement.py` and `benchmark_refresh.py`
(`financial_first` / `narrative_first` / `dashboard`, default
`financial_first` — see `context/salt_basin_context.md` for what each means).

**Recurring benchmark refresh** (the cadence Betsy chose — cron now, via
GitHub Actions):

```bash
python benchmark_refresh.py   # submits one batch request per topic in schema/topics.json
```

Wired as two workflows — `.github/workflows/gtm-benchmark-submit.yml`
(monthly) and `gtm-benchmark-fetch.yml` (daily, checks for finished
batches and uploads results as workflow artifacts). Requires an
`ANTHROPIC_API_KEY` repo secret. Edit the cron expressions directly if
monthly/daily isn't the cadence you want.

## Security — client data

Client financial data never passes through chat, never gets committed to
git, and only a redacted summary — matched column names, small
non-identifying samples of *unmatched* columns, and numeric aggregates —
ever leaves your machine in the API request. Row-level client data stays
local. See `lib/client_data.py` for exactly what gets sent.

Point `GTM_AGENT_CLIENT_DATA_DIR` (in `.env`) at a path **outside** any git
repo on whichever machine actually runs `run_engagement.py` — the default
`./secure_input/` is fine for testing with synthetic data, not for real
client financials sitting in a cloned repo.

## Cost levers (per the roadmap's "Running these as your own scripts" section)

- **Prompt caching** — `context/salt_basin_context.md` (brand voice,
  citation standard, deliverable structure, methodology pattern) is marked
  `cache_control: ephemeral` and read at the front of every system prompt.
  First run pays full price to write the cache; every run within the hour
  after reads it at ~90% off.
- **Batch API** — every deliverable generation goes through
  `client.messages.batches.create`, not a live call. 50% off input/output,
  results within hours.
- **Model tiering** — Sonnet 5 (`DRAFT_MODEL` in `lib/anthropic_client.py`)
  does the research and drafting; Haiku 4.5 is reserved for future
  mechanical sub-passes. The client-column matching itself is done with
  zero LLM calls — a deterministic alias-list pass in `lib/client_data.py`
  handles what it can for free, and only the columns it couldn't
  confidently resolve go to the model.

## Testing before trusting the schedule

See `golden_tests/README.md`. Two things are already validated in this
build: the deterministic client-data normalization correctly flags
ambiguous/mixed-currency/no-match columns instead of guessing
(`golden_tests/dry_run_edge_cases.py`, passing), and the docx/xlsx template
generators produce well-formed files with live formulas from a fixture
deliverable. What still needs a live run with your API key: comparing
actual model output against the real reference deliverable in
`source-docs/golden-deliverables/`.

## Layout

```
context/salt_basin_context.md   Cached system prompt: brand voice, citation
                                 standard, deliverable structure, methodology
schema/capability_mapping_schema.json   Client field-mapping targets (real schema + draft)
schema/topics.json               Default recurring benchmark-refresh topics
lib/anthropic_client.py          Client setup, cached system block, structured-output schema
lib/batch_jobs.py                Batch submit/poll/fetch
lib/client_data.py               Client CSV/XLSX normalization (deterministic pass)
lib/xlsx_template.py             Workbook generator (openpyxl, live formulas)
lib/docx_template.py             Word companion doc generator (python-docx)
lib/review_flags.py              Human-review punch list generator
benchmark_refresh.py             Entrypoint: recurring, no client data
run_engagement.py                Entrypoint: per-engagement, optional client data
fetch_batch_results.py           Entrypoint: poll + generate deliverables
golden_tests/                    Testing per the roadmap's checklist
source-docs/                     Reference material Betsy provided (brand, golden
                                  deliverables, schema, templates)
secure_input/                    Client exports land here (gitignored)
output/                          Generated deliverables land here (gitignored)
```
