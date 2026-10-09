# Foundation Starter Package

Everything someone needs to set up the Salt Basin approach with their own Claude:
- the release tracker
- foundations built from the seven mapping questions
- seeds that grow into features
- scenes built one at a time
- history that is never lost

The approach was designed in a working session between Betsy Salter (Salt Basin) and Claude Code in
October 2026. This package explains what was built, the rules it was built under, and how to repeat it.

## Read in this order

| # | File | For |
|---|---|---|
| 1 | `1-concepts.md` | Everyone. The ideas in plain language: foundations, the seven questions, seeds, features, scenes, rods, audit history. |
| 2 | `2-setup-with-your-own-claude.md` | The person setting it up. Step-by-step setup with Claude Code, from an empty repo to a live board. |
| 3 | `3-rules.md` | Anyone building on it. The rules everything was built under, and why each one exists. |
| 4 | `4-your-setup-checklist.md` | The person setting it up. What this package can't do for you: accounts, hosting, data, privacy, decisions. |
| 5 | `5-how-it-was-built.md` | Anyone learning the method. The build session step by step, with each owner direction and what it changed. |
| 6 | `6-training.md` | New users. The video walkthrough chapter by chapter, plus hands-on exercises. |
| 7 | `prompts.md` | The person setting it up. Prompts to paste into Claude Code at each step. |
| — | `templates/` | A `CLAUDE.md` starter and three skills (release loop, reuse-first audit, config audit) to copy into your repo. |

## What the built package (zip) contains

Run `node build-package.mjs <out-dir>` from this folder. It assembles a zip from the *current* versions of:

- this folder (docs, prompts, templates)
- `kit/`: the generic release tracker kit (`tools/release-tracker-kit/`), including `MAPPING.md`
- `specs/`: the design specs this approach comes from
  - `docs/changes/scene-instructions.md`
  - `docs/changes/foundation-rods-and-audit-history.md`
  - `docs/release-process.md`
  - `server/data/releaseLoop/definition.json`
- `video/`: the walkthrough recording script (`record-walkthrough.mjs`)

Copies are made at build time, so the package never drifts from the repo.

## Status, honestly

| Part | State |
|---|---|
| Release tracker kit (sync, log, board, mapping guide) | **Working.** Tested against a fictional fixture and a hand-logged pipeline. |
| 3D Salt Basin board | **Working demo** on fictional data. Not yet connected to live runs. |
| Foundations, seeds, features, scenes, audit-history model | **Designed, not built.** Specs are versioned and list the owner decisions still open. |
| Live connectors (Jira, Azure DevOps, Linear) | **Not built.** None is in the platform's current OAuth provider list. |

All examples use fictional data.
