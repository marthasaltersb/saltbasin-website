---
description: Advance the Salt Basin Website Intelligence and Configuration Engine build by one phase — analyze the current public site, reconstruct its narrative, propose an information architecture, and turn that reasoning into governed, configuration-driven site_state/config updates (never hardcoded JSX). Repeatable across sessions.
---

Invoke the `salt-basin-website-intelligence` skill to advance the Website Intelligence engine build.

Arguments passed to this command: $ARGUMENTS

- If empty: read `docs/salt-basin-website-intelligence-progress.md` and run the next phase whose status is `not started` or newly-unblocked.
- If it names a phase (a number 1–13, or a keyword like `inspect`, `source`, `crawl`, `inventory`, `narrative`, `audience`, `architecture`, `rendering`, `infographic`, `visual`, `composition`, `content`, `voice`, `configuration`, `changeset`, `sync`, `dependency`, `preview`, `metrics`, `validation`, `salt-basin`, `personal-brand`, `org-admin`, `chat`, `agents`, `vertical-slice`, `demonstration`, matched against `.claude/skills/salt-basin-website-intelligence/reference/phases.md`), run that specific phase.
- If it is `status`, don't run a phase — just read and summarize `docs/salt-basin-website-intelligence-progress.md` (phase statuses, changelog, open decisions) without making changes.
- If it is `full` or `all`, ask for explicit confirmation before attempting more than one phase in a single turn — this skill is designed to run one phase at a time for reviewability, and several phases are explicitly too large for one turn per `reference/phases.md`.

Follow the skill's workflow exactly: read the progress tracker first, read only the master-prompt sections relevant to the chosen phase, inspect the real running site/config architecture before designing anything (especially for Phase 1 — run the app, don't just read source), produce actual structural artifacts (models, registries, engine code, configuration) rather than a strategy document, respect the draft/published + append-only-registry invariants from `CLAUDE.md`, run `salt-basin-config-audit` against any new weighted scoring or hardcoded assumption this phase introduces, then update the progress tracker before reporting back. Never let the engine hardcode organization-specific content into a generic component, and never let it silently overwrite live published site_state.
