# New-Requirement Register

**Status: awaiting read-aloud validation.** A design package was supplied 2026-09-05 (registered as SRC-NEWDOC-01 through SRC-NEWDOC-08 in `01-source-register.md`, preserved at `docs/baseline/intake/2026-09-05-salt-basin-orbital-design/`). Per the governing objective, missing documents are never interpreted as permission to invent requirements — and, symmetrically, *supplied-but-unvalidated* documents aren't treated as approved requirements either. The user has explicitly said this package hasn't been checked yet against their own intent. See `12-design-package-validation-workflow.md` for the read-aloud confirmation process now underway; this register populates as each document clears that process.

## Required row/record schema (for when documents arrive)

For each new document supplied:
- **Document ID**, title, version/date, source format (e.g. Word doc, ChatGPT-voice transcript/notes, image/mockup), and where it's stored in this repo's docs area once registered.
- Per atomic requirement extracted from it: a stable **Requirement ID** (prefix `NEW-`), the original source section/quote (preserved verbatim, not paraphrased away), intended visual behavior, interaction rules, data meaning, permissions, and acceptance criteria as stated or reasonably implied.
- Explicit tagging of what's an **explicit requirement** vs. an **interpretation** vs. an **open question** — kept separate, never merged.

## What's needed from you to unblock this

1. The new product/UX documents themselves (any format).
2. If any were produced via ChatGPT voice, the actual transcript/notes content (not a re-summary) — the objective specifically calls these out as in-scope source material distinct from prior Claude-authored documentation.
3. Confirmation of which existing subsystem(s) they target, if known, so Stage 2 prioritization (see `03-current-state-specification.md`) can align with what's about to be reconciled.
