# Member Experience Module — build handover (2026-07-29)

The LoneTree "Member Experience Module": a bounded 9-stage guided Proposal
Experience (J01 Welcome → J09 Workspace) built from
`Salt_Basin_MVP_Proposal_Experience_Delta_Spec_v0.1.docx` and
`Salt_Basin_MVP_Proposal_Semantic_Seed_Repository_v0.1.xlsx` (both in
`~/Downloads`, **not** in the repo).

## What shipped

| Layer | File |
|---|---|
| Semantic registry (stages, actions, atoms, decision/view-state events) | `server/lib/proposalExperienceRegistry.js` |
| Executive/PDF projection (pure read-side compile) | `server/lib/proposalDocumentProjection.js` |
| Read/write API | `server/routes/proposalExperience.js` → `/api/proposal-experience/*` |
| Seed data (50 records, workbook-derived) | `server/data/proposalExperienceSeed/repository.json` |
| Idempotent seed script | `server/scripts/seedProposalExperience.js` |
| Interactive member UI | `src/components/admin/ProposalExperiencePanel.jsx` |

**No new tables.** The whole module rides the existing Channel Journey
substrate: a new `proposal_experience` rod_type as a hierarchical Tributary
child of the member rod, record molecules as `journey_rod_evidence` rows, and
Proposal Decision + View State as `journey_rod_events` (event-sourced, never a
mutable "current" row).

Seeded state for member 17 (`saltbasin-networks@breckgolden.com`): rod **88**,
50 evidence rows — 10 sections, 9 scenes, 9 diagnostic modules, 9 opportunity
scenarios, 7 evidence items, 6 highways.

```bash
node server/scripts/seedProposalExperience.js --userId=17
```

## Acceptance criteria

Verified by driving the running app as the logged-in member plus direct API and
library checks.

| ID | Status | Evidence |
|---|---|---|
| AC01 loads from seeded records, not hardcoded copy | PASS | All screens render from rod evidence; unseeded rod yields an honest empty state (verified on a throwaway rod: zero counts, no disclaimer, no fabricated content). |
| AC02 nine stages addressable, in presentation order | PASS | All 9 nav entries render and switch; no unresolved `stageId`. |
| AC03 six highways connect configured stages/molecules | PASS | 6 highways; all `startStageId`/`endStageId`/`primaryMoleculeIds` resolve. |
| AC04 screens render from Section + Scene molecules | PASS | Verified on J01/J06. |
| AC05 nine diagnostic modules render | PASS | D01–D09 all present in the UI. |
| AC06 scenarios show range, basis, confidence, recoverability, evidence, illustrative label | PASS | All 9 render e.g. "Exposure: Renewable ARR · Range 0.25%–1.50% (base 0.75%) · Confidence: Medium · Recoverability: High" with an ILLUSTRATIVE badge. |
| AC07 evidence opens without losing route/stage/scenario | PASS | Expanding SCN-01 kept stage 4, route `/member`, and the scenario expanded. |
| AC08 every CTA resolves to a configured action + route | PASS | Every section/scene `ctaActionId` resolves against `PROPOSAL_ACTIONS`; none missing. |
| AC09 decision selection creates/updates a Proposal Decision | PASS | Append-only events; latest-wins reconstruction verified. |
| AC10 interactive/executive/PDF/PowerPoint use the same molecules | **PARTIAL** | Interactive and executive/PDF share one reader (`readRecordAtoms`). **PowerPoint projection not built**, and no `/output/*` print page renders the document yet — see Gaps. |
| AC11 role/visibility via existing security model | **PARTIAL** | Every route is `requireUser` + scoped to the caller's own rod (no `rodId`/`orgId` param to substitute). But the registered `visibility_rule` atom is **not evaluated** at render time — see Gaps. |
| AC12 no new semantic primitive or parallel schema | PASS | No new tables; reuse-first audit held. |
| AC13 stable workbook IDs, repeatable import, no duplicates | PASS | Seed run twice → 50 rows both times (keyed on `rod_id, molecule_key, source_reference`). |
| AC14 illustrative content carries a visible disclaimer in every projection | PASS | Fixed this session — see below. |

## Fixed this session

- **AC14 gap.** The interactive projection showed per-record ILLUSTRATIVE
  badges but no disclaimer text. `/state` now returns `illustrative` +
  `disclaimer` sourced from the same `ILLUSTRATIVE_DISCLAIMER` constant the
  document projection uses, and the panel renders it as a persistent banner
  across all stages — one string, so the two projections cannot drift.
- **"Confidence: 1" in the opportunity drawer.** The `journey_rod_evidence`
  numeric ingest-confidence column was shadowing an Evidence Item's own
  `confidence` rating, so the member saw "Confidence: 1" instead of
  "Confidence: High". `readRecordAtoms` now lets record fields win and exposes
  the row value separately as `rowConfidence`; `source_reference` stays
  authoritative for `id` (AC13).

## Gaps / next steps

1. **PowerPoint projection (AC10)** — not built.
2. **Print page for the executive/PDF projection (AC10)** —
   `compileProposalDocument()` and `GET /api/proposal-experience/document` are
   done and return the full ordered document (chapters, diagnostic, opportunity
   with resolved cross-references, evidence appendix, decision, disclaimer), but
   nothing under `/output/*` renders it yet. That's the natural next task.
3. **`visibility_rule` not enforced (AC11)** — registered as vocabulary in
   `DELTA_ATOMS` and carried inside record JSON, but no renderer or route
   consults it. Every record is currently visible to the owning member.

## Deliberate design decisions worth not re-litigating

- **No dollar figures are computed anywhere.** Opportunity scenarios carry rate
  bands against a named *basis* ("Renewable ARR") but never the basis amount.
  Multiplying the rates by an assumed revenue number would fabricate a
  LoneTree-specific leakage claim the evidence does not support. The projection
  deliberately surfaces the rate band and the basis label only. There is a
  comment guarding this in `proposalDocumentProjection.js` — please leave it.
- **`proposal_decision` is a spec molecule (MOL-DECISION) stored as events**,
  not as a record atom. `HW-DECISION` legitimately references it. Any
  referential-integrity checker over molecule keys must include the
  event-sourced molecule types or it will report a false positive here.
- **`compileProposalDocument()` persists nothing.** Unlike `resumeProjection.js`
  and `orgDocumentProjection.js`, which write to satellite tables, this compiles
  on read so the document can never drift from the rod. Don't add a cache table
  without a reason.

## Environment note

`npm run server` runs with `--watch`, and every restart replays ~20s of
idempotent bootstrap DDL. During that window **every** API route returns 500 or
refuses the connection. This produced two convincing false alarms while
verifying: a "seed script OOM" and an "opportunity stage renders empty" bug,
both of which disappeared once the server stayed up. Before believing a failure
in this module, confirm the API is actually serving:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/auth/me
```

The client `useLoad()` helper swallows fetch errors (`.catch(() => setData(null))`)
and falls through to the honest empty state, so a backend failure is visually
indistinguishable from unseeded content. That is worth changing if this module
gets more debugging time.
