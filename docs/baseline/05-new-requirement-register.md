# New-Requirement Register

**Status: awaiting read-aloud validation.** A design package was supplied 2026-09-05 (registered as SRC-NEWDOC-01 through SRC-NEWDOC-08 in `01-source-register.md`, preserved at `docs/baseline/intake/2026-09-05-salt-basin-orbital-design/`). Per the governing objective, missing documents are never interpreted as permission to invent requirements — and, symmetrically, *supplied-but-unvalidated* documents aren't treated as approved requirements either. The user has explicitly said this package hasn't been checked yet against their own intent. See `12-design-package-validation-workflow.md` for the read-aloud confirmation process now underway; this register populates as each document clears that process.

## Edit #1 entries — from live dictation (SRC-LIVE-01), pending read-back confirmation

These six items were extracted from the user's live dictation (not the ZIP package) and drafted into `Configuration-Module-Builder-Admin-Specification.md` v0.2-draft. **Marked pending** because, per this program's own protocol, nothing is confirmed until read back to the user and cleared through the edit log — flagged here now so the register isn't silently missing known-incoming content.

| ID | Source | Requirement (condensed) | Status per user's own vocabulary | Existing definition IDs | Relationship (Stage 3, not yet run) |
|---|---|---|---|---|---|
| NEW-001 | SRC-LIVE-01 §1 | Every configurable/coded element, and its input shape (JSON string / field / picklist / value set), must be explicitly recorded for every module/screen/field/rule/object | REQUIRED outcome; recording schema OPEN | Not yet mapped | Pending |
| NEW-002 | SRC-LIVE-01 §1 | All such definitions must be backmapped to existing Claude-built technical elements | REQUIRED | `04-technical-element-register.md` (once populated) | Pending — this is a reinforcement of this program's own existing reconciliation requirement, not new mechanism |
| NEW-003 | SRC-LIVE-01 §2 | Salt Basin's own end-to-end product must be built using its configuration module; that becomes the reusable engine for future modules/industries/clients | REQUIRED | Relates to `Current-Specification.md` §8–9 (configuration-first contract) — likely EXTEND, not NEW | Pending |
| NEW-004 | SRC-LIVE-01 §3 | Sales reps interact with platform agents via real voice (talk-to-text), not just text chat | REQUIRED outcome; voice engine/UX OPEN | Relates to `Current-Specification.md` §7 "Agent interaction" row — likely EXTEND | Pending |
| NEW-005 | SRC-LIVE-01 §4 | Voice input supports multiple languages; input is applied appropriately to the org's configured field language | REQUIRED outcome; mechanism OPEN | No existing definition located yet — candidate NEW | Pending |
| NEW-006 | SRC-LIVE-01 §4 | Original-language voice input is logged verbatim; every field gets a translated English value so data validates/displays correctly for all users regardless of input language | REQUIRED outcome; data model OPEN (see DEC-005) | No existing definition located yet — candidate NEW | Pending |

**Do not treat NEW-001 through NEW-006 as final** — they await the same read-back-and-correct pass every other item in this register requires. They are recorded now so the read-aloud validation of the six formal package documents doesn't inadvertently overwrite or ignore them.

## Edit #2 entries — the validation process itself, as a Configuration Module capability

The user redirected: the read-aloud validation workflow (doc 12) must be designed as a product capability within the Configuration Module — not remain a manual Claude Code process — and that design comes **before** resuming the document-by-document walkthrough. See `Configuration-Module-Builder-Admin-Specification.md` §6 (renumbered from §5 during Edit #4 — see below).

| ID | Source | Requirement (condensed) | Status per user's own vocabulary | Existing definition IDs | Relationship (Stage 3, not yet run) |
|---|---|---|---|---|---|
| NEW-007 | SRC-LIVE-01 §6.1 | Admin can load a source document as addressable sections and comment against each (voice or text): confirm/correct/reject/still-open/add | REQUIRED outcome; UI/journey OPEN | No existing definition located — candidate NEW | Pending |
| NEW-008 | SRC-LIVE-01 §6.1 | Every comment produces an updated section version, recorded in an append-only edit/version log — never silent overwrite | REQUIRED | Candidate EXTEND of existing draft/publish + schema-versioning pattern (`site_state`/`config_state`, `member_sites`/`member_configs`) | Pending |
| NEW-009 | SRC-LIVE-01 §6.1 | Confirmed section content promotes into governed requirement records, distinct from raw comments | REQUIRED | Mirrors this program's own `05`/`06` distinction — candidate NEW (product-side equivalent) | Pending |
| NEW-010 | SRC-LIVE-01 §6.1 | Full edit history visible per section: author, comment, change, resulting version — an admin audit view | REQUIRED | Relates to `Current-Specification.md` §6 "Audit/version" and §8 "ChangeDecision/DiagnosticRun" — likely EXTEND | Pending |
| NEW-011 | SRC-LIVE-01 §6.3 | This capability should reuse existing draft/publish versioning and `journey_rod_events`-style event logging rather than new bespoke mechanisms | REQUIRED (restates program-wide reuse-first rule) | `server/db.js` draft/publish tables; `journey_rod_events` | Pending — preliminary observation only, not a completed Stage 3 mapping |

**Sequencing note (per the user, this turn):** NEW-007 through NEW-011 are to be designed and confirmed before the formal read-aloud walkthrough of NEWDOC-01 through NEWDOC-06 resumes.

## Edit #3 entries — layer taxonomy and client-defined field extensibility (§1.1–§1.2)

On read-back of §1, the user confirmed its core text and extended it substantially: the real definition schema is a set of explicit layers (not just a configurable/coded axis), plus a concrete extensibility requirement for client-created fields.

| ID | Source | Requirement (condensed) | Status per user's own vocabulary | Existing definition IDs | Relationship (Stage 3, not yet run) |
|---|---|---|---|---|---|
| NEW-012 | SRC-LIVE-01 §1.1 | Every product aspect must be defined across four layers — code, configurable, database, user experience — not just classified along one configurable-vs-coded axis | REQUIRED | Not yet mapped | Pending |
| NEW-013 | SRC-LIVE-01 §1.1 | For coded elements (including the code behind configurable elements), record how much code is associated with the requirement and what supporting elements it depends on to run; record how layers connect and change dynamically by interacting user/data/licensing | REQUIRED outcome; recording schema OPEN | Not yet mapped | Pending |
| NEW-014 | SRC-LIVE-01 §1.2 | A client/org admin can create a new field in their own client context (a configurable action) without that requiring a new field in Salt Basin's core codebase; each client tracks its own set of client-defined extensions | REQUIRED | Candidate EXTEND of existing JSONB `fields` pattern (`site_state`/`config_state`/`member_sites`/`member_configs`) — needs verification, not assumed | Pending |

## Edit #4 entries — Module Definition and 3D Variant provisioning (new §5, prerequisite to §6)

On continuing the read-back, the user corrected the sequencing: before the validation capability (§6) can be built as a real module, Salt Basin's own Module Definition capability — including per-module 3D Variant generation and Orbit/constellation/planet-map structure — must exist. This inserted a new §5 and renumbered the former §5 (validation capability) to §6.

| ID | Source | Requirement (condensed) | Status per user's own vocabulary | Existing definition IDs | Relationship (Stage 3, not yet run) |
|---|---|---|---|---|---|
| NEW-015 | SRC-LIVE-01 §5.1 | Defining a Module is the foundational Configuration Module action; the validation capability (§6) is itself a module and depends on this existing first | REQUIRED (sequencing) | Relates to `Current-Specification.md` §8 `ModuleDefinition` | Pending |
| NEW-016 | SRC-LIVE-01 §5.1 | Every Module must have an associated 3D Variant; if none exists unallocated, the 3D Variant Engine must generate one, seeded by a prompt derived from the module's name/concept | REQUIRED outcome; generation mechanism OPEN | Candidate EXTEND of `salt-basin-world-variants` skill / `CRYSTAL_VARIANTS` / `crystalGeometry.js` — that system currently renders a small fixed set of world metaphors, not per-module generative provisioning; needs Stage 2/3 verification | Pending |
| NEW-017 | SRC-LIVE-01 §5.1 | Every Module needs an Orbit: constellations represent its journeys, and the planet has its own "planet map" view entered by selecting the planet | REQUIRED outcome; UI mechanism OPEN | Relates to `Current-Specification.md` §2–3 (Orbital Home: planets=modules, moons, constellations) — likely EXTEND, concrete navigation mechanic for an existing conceptual model | Pending |

**Open question raised during this pass, not yet resolved:** while reading the document header aloud, the user said "version zero point two or zero point three now" — ambiguous whether the whole document should be bumped to v0.3 given the accumulating edits. Not acted on; flagged for the user to clarify.

## Required row/record schema (for when documents arrive)

For each new document supplied:
- **Document ID**, title, version/date, source format (e.g. Word doc, ChatGPT-voice transcript/notes, image/mockup), and where it's stored in this repo's docs area once registered.
- Per atomic requirement extracted from it: a stable **Requirement ID** (prefix `NEW-`), the original source section/quote (preserved verbatim, not paraphrased away), intended visual behavior, interaction rules, data meaning, permissions, and acceptance criteria as stated or reasonably implied.
- Explicit tagging of what's an **explicit requirement** vs. an **interpretation** vs. an **open question** — kept separate, never merged.

## What's needed from you to unblock this

1. The new product/UX documents themselves (any format).
2. If any were produced via ChatGPT voice, the actual transcript/notes content (not a re-summary) — the objective specifically calls these out as in-scope source material distinct from prior Claude-authored documentation.
3. Confirmation of which existing subsystem(s) they target, if known, so Stage 2 prioritization (see `03-current-state-specification.md`) can align with what's about to be reconciled.
