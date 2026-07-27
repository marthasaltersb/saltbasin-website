# Handover: Website Intelligence and Configuration Engine

## Objective

Continue building the "Master Build Prompt — Autonomous Website Intelligence, Public Site Design, and
Configuration Engine": a governed pipeline that analyzes Salt Basin's existing public site, reconstructs
its public narrative, proposes a future-state information architecture, and turns that reasoning into real
`site_state` / `member_sites` configuration changes — never hardcoded JSX, never a strategy document that
stops short of a working configuration diff.

The full 30-section verbatim master prompt, broken into 13 build phases, already exists as a repeatable
skill:

```text
.claude/commands/website-intelligence.md       -- /website-intelligence slash command
.claude/skills/salt-basin-website-intelligence/
  SKILL.md                                      -- non-negotiables, workflow, codebase cross-reference table
  reference/master-build-prompt.md              -- verbatim 30-section (I-XXX) brief
  reference/phases.md                           -- static 13-phase breakdown, dependencies, scope-discipline notes
docs/salt-basin-website-intelligence-progress.md  -- MUTABLE state: phase statuses, findings, changelog
```

**Start every future session by invoking `/website-intelligence`** (or reading
`docs/salt-basin-website-intelligence-progress.md` directly) — it picks the next phase automatically. Do
not re-read the whole master prompt; the skill's workflow tells you which section(s) matter for the current
phase.

## What's actually done vs. designed-only

**Phase 1 (Platform Inspection) — done.** Real architecture inventory in the progress tracker. Confirmed by
direct DB query that zero `member_sites` rows have `kind='published'` — the `/u/:slug` visual-inspection
gate was closed as a verified fact, not left stalled, since the shared `RenderSection`/`REGISTRY`
architecture was already verified via the live admin site + code.

**Phase 2 (Source Adapters + Page Inventory) — done, real code, run against real data.**

```text
server/lib/websiteIntelligence/sourceAdapters.js   -- SOURCE_TYPES, SOURCE_AUTHORITY, adaptSaltBasinSiteState,
                                                       adaptMemberSiteState, adaptFoundationSourceOfTruth,
                                                       adaptBrandGuide, normalizePages
server/lib/websiteIntelligence/pageInventory.js    -- buildPageInventory (WebsitePageInventory per master prompt §IV)
scripts/website-intelligence-inventory.mjs         -- read-only CLI runner: node scripts/website-intelligence-inventory.mjs [draft|published]
```

Run it yourself to re-confirm current state:

```powershell
node scripts/website-intelligence-inventory.mjs published
```

Real findings from the 2026-07-16 run are recorded in the progress tracker's "Phase 2 — real page
inventory" table: 4 pages (`home`, `resources`, `creative`, `consulting`), 23 sections, all real content
lengths/fill-rates/CTA counts — not fixture data.

**Phases 3–13 — not started.** Phase 3 (Current-State Analysis + Public Narrative Model) is next and is the
first phase requiring actual judgment (narrative clarity, content quality, audience inference) rather than
structural extraction. See `reference/phases.md` for what each remaining phase covers.

## Real architecture discrepancies found and corrected in `CLAUDE.md`

While building Phase 2, discovered `CLAUDE.md`'s documented section shape did not match the live system.
**This has already been fixed** in `CLAUDE.md`'s "Section / block system" section (commit not yet made —
see Dirty-worktree section below). The corrected doc now states:

1. `site_state.pages` is a **keyed object**, not an array, despite being described as `pages: [...]`.
   `sourceAdapters.js`'s `normalizePages()` handles both shapes defensively.
2. Section content lives under **`section.fields`**, not `section.content`. Confirmed two ways: the real
   published DB row, and `src/components/blocks/index.jsx` (51 occurrences of `section.fields`, 0 of
   `section.content`, across every block type). `section.fieldMeta` is a real, wired-up sibling key but is
   currently **unused in production data** (0 of 23 live sections carry it as of 2026-07-16) — don't assume
   it's populated.
3. **CTA fields have no standardized naming convention** across blocks — `home-hero` uses
   `cta1Label`/`cta1Link`, `services` uses `s1Cta`, `assessments` uses `a1Price`, `creative-decor` uses a
   bare `cta1`. This is now documented in `CLAUDE.md` as a fact to work around, not yet fixed structurally.

## Open decision: which configurability gap to build next

Phase 1/2 inspection surfaced three real architecture gaps beyond the documentation fixes above. These are
**not yet started** and each is a real, moderately-sized, live-component-touching effort — not a quick fix:

1. **CTA field standardization** — give every block a consistent CTA convention so tooling (including this
   engine) can reliably enumerate CTAs on any page. Touches ~20 block components; needs a non-breaking
   migration path for existing live section data per `CLAUDE.md`'s deployment-safety invariants (append-only
   registry, no silent reinterpretation of existing member/admin JSON).
2. **Unified SEO / structured-data layer** — no page-level config surface exists today for
   title/description/canonical/schema markup. This is additive (new schema + admin UI), lower risk than
   touching existing blocks.
3. **Shared infographic/chart/3D registry** — Recharts, Three.js scenes (`SpatialJourneyWorld.jsx`,
   `CrystalMarkField.jsx`), and journey renderers exist but aren't unified under one registry the way page
   sections are. This is literally **Phase 6** of the Website Intelligence build (`reference/phases.md`) —
   the largest of the three efforts.

**I asked the user which to prioritize via a multi-select question and got a contradictory answer** (all
four options selected, including the mutually-exclusive "none right now"). I asked for clarification in
chat but the session ended before the user responded. **The next session should re-ask this before starting
any of the three gaps** — do not guess and start building based on the earlier ambiguous answer.

## Dirty-worktree warning

The repository has many pre-existing modified/untracked files unrelated to this work (visible via
`git status` — EIDOS build, scenario registry, member-org reconciliation docs, etc.). **Preserve all of it.**
Do not reset, clean, discard, or reformat anything outside the website-intelligence files listed below.

Files this work has touched or created so far (none committed yet):

```text
 M CLAUDE.md                                              -- section shape + CTA-inconsistency fix, see above
AM docs/salt-basin-website-intelligence-progress.md        -- was already partially staged before this session
?? .claude/commands/website-intelligence.md
?? .claude/skills/salt-basin-website-intelligence/
?? server/lib/websiteIntelligence/
?? scripts/website-intelligence-inventory.mjs
```

## Immediate continuation sequence

1. Read `docs/salt-basin-website-intelligence-progress.md` in full (phase table, Phase 2 findings table,
   changelog) — do not re-derive what's already there.
2. Resolve the open decision above: ask the user (again, cleanly) which of the three configurability gaps
   to build first, or confirm they want Phase 3 of the core pipeline instead. Don't conflate the two —
   Phase 3 (narrative model) advances the core engine; the three gaps are prerequisite architecture cleanup
   the engine will eventually depend on (especially the infographic registry, which **is** Phase 6).
3. If continuing the core pipeline: run `/website-intelligence` (or invoke the
   `salt-basin-website-intelligence` skill directly) — it will pick Phase 3 automatically since Phases 1–2
   are marked `done`.
4. For Phase 3 specifically: read master-prompt §V and §VI only (not the whole document), build the actual
   `PublicNarrativeModel` and its 5 layers (Immediate Understanding → Differentiation → Evidence → Depth →
   Action) grounded in `docs/salt-basin-foundation-source-of-truth.md` as the authoritative claims source,
   and the real page inventory from Phase 2 as the current-state evidence. Do not fabricate customer
   counts, metrics, or claims not already supported by the Foundation doc.
5. Whichever path is chosen, update `docs/salt-basin-website-intelligence-progress.md` before ending the
   session — phase status, findings table, changelog entry with date. This file is the only thing a future
   session reads to resume correctly; don't leave it stale.

## Important design constraints (do not relitigate these)

- **Configuration-driven output only.** Every proposed page/section must resolve to real `REGISTRY` keys in
  `src/components/blocks/index.jsx`. Never emit raw JSX as a phase's deliverable.
- **Draft/published invariants are absolute.** No phase writes to a published `site_state`/`member_sites`
  row without going through the existing publish workflow. Nothing in Phases 1–2 mutated any row — both are
  read-only.
- **Never fabricate evidence.** No invented customer counts, revenue, metrics, partnerships, case studies,
  adoption numbers, patents, certifications. Unsupported claims get ASPIRATIONAL/VISION framing, never
  FACTUAL framing.
- **No opaque composite scores.** Every metric this engine introduces must answer one specifically named
  question (see master prompt §XXI) — same rule the sibling `salt-basin-visual-metrics` skill already
  enforces.
- **Run `salt-basin-config-audit`** against any new weighted formula or scoring model a future phase
  introduces (Phase 2's `duplication_score`/`content_confidence` are plain unweighted ratios, so this was
  correctly skipped — document that decision explicitly if a future phase also has no weights, don't skip
  silently).
