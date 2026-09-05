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

## Required row/record schema (for when documents arrive)

For each new document supplied:
- **Document ID**, title, version/date, source format (e.g. Word doc, ChatGPT-voice transcript/notes, image/mockup), and where it's stored in this repo's docs area once registered.
- Per atomic requirement extracted from it: a stable **Requirement ID** (prefix `NEW-`), the original source section/quote (preserved verbatim, not paraphrased away), intended visual behavior, interaction rules, data meaning, permissions, and acceptance criteria as stated or reasonably implied.
- Explicit tagging of what's an **explicit requirement** vs. an **interpretation** vs. an **open question** — kept separate, never merged.

## What's needed from you to unblock this

1. The new product/UX documents themselves (any format).
2. If any were produced via ChatGPT voice, the actual transcript/notes content (not a re-summary) — the objective specifically calls these out as in-scope source material distinct from prior Claude-authored documentation.
3. Confirmation of which existing subsystem(s) they target, if known, so Stage 2 prioritization (see `03-current-state-specification.md`) can align with what's about to be reconciled.
