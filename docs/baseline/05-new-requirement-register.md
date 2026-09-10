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

## Resume-product package entries (supplied 2026-09-10, pending validation)

A second, unrelated package — the Salt Basin Resume Product (Career Master Foundation, transferable-skill translation, configurable resume templates, human/AI contribution ledger, and Betsy's actual Osaic application) — was supplied 2026-09-10. Registered as SRC-RESUME-01 through SRC-RESUME-14 in `01-source-register.md`; preserved at `docs/baseline/intake/2026-09-10-salt-basin-resume-product/`. **Same rule as the orbital-design package above applies: supplied-but-unvalidated is not approved.** These entries are extracted from the supplied documents' own U01–U11 numbering and Betsy's live dictation; none has been read back to her for confirmation.

| ID | Source | Requirement (condensed) | Status per source's own vocabulary | Existing definition IDs | Relationship (Stage 3, not yet run) |
|---|---|---|---|---|---|
| NEW-018 | SRC-RESUME-01 §1 | AI-driven resume/job/title recommendations must carry accessible evidence and be approvable/rejectable at wording, sentence, paragraph, or recommendation level | REQUIRED (dictated directly by Betsy) | No existing definition located — candidate NEW | Pending |
| NEW-019 | SRC-RESUME-01 §1 | Configurable default review-gating thresholds: ≥90% match proceeds without asking for review; 75%–<90% recommends review without blocking delivery; <75% requires additional sources/context/explicit human judgment before proceeding | REQUIRED thresholds and bands (exact numbers dictated); mechanism for computing "match %" OPEN | Distinct from SRC-RESUME-11 §4's own 75/50 "requirement-level transfer" thresholds and from SRC-RESUME-06's 15/15/15/15/15/10/5/10 opportunity-ranking weights — see DEC-006, all three must stay visually and computationally separate | Pending |
| NEW-020 | SRC-RESUME-02 | Below the review threshold, user testimony is an acceptable primary source (not required to be document-backed); provenance must stay labeled user-attested / document-supported / independently-verified, never blurred together | REQUIRED | Candidate EXTEND of SRC-RESUME-11 §3's evidence-state model — same distinction, needs reconciliation into one schema | Pending |
| NEW-021 | SRC-RESUME-02 | A user may apply to a stretch role after explicitly acknowledging a missing qualification; the system must not invent transferable skills, qualifications, or proficiency to close that gap, and "I feel ready" is never testimony of possessing a missing credential | REQUIRED | No existing definition located — candidate NEW | Pending |
| NEW-022 | SRC-RESUME-03 | Personal learning (tailoring to one user's own history) is available without opting into shared cross-user learning; shared contribution is a separate, explicit opt-in with its own purpose-specific consent (analytics vs. recommendation improvement vs. model training are not one blanket permission) | REQUIRED (proposed default, stated as such) | No existing definition located — candidate NEW | Pending |
| NEW-023 | SRC-RESUME-03 | Shared learning must never expose another user's identity/private documents/reference info/identifiable resume passages (name removal alone is insufficient — rare career-detail combinations can still identify someone), and another user's success is never evidence that this user has a skill | REQUIRED | No existing definition located — candidate NEW | Pending |
| NEW-024 | SRC-RESUME-01 §3 | Personal links default to "LinkedIn upon request" / "References upon request"; user has explicit per-link control over direct-show / upon-request / omit, and can declare "I don't have LinkedIn" to remove it entirely; AI must never independently decide what personal info to show | REQUIRED | No existing definition located — candidate NEW | Pending |
| NEW-025 | SRC-RESUME-01 §4 | Reference verification (Salt Basin optionally contacts references on the user's behalf) and reference disclosure (whether/when references appear on output) are separately configurable — opting into one is not opting into the other | REQUIRED | No existing definition located — candidate NEW | Pending |
| NEW-026 | SRC-RESUME-01 §7 | Document generation is distinct from having actually applied; the system must track real application status, not infer it from output creation | REQUIRED | No existing definition located — candidate NEW | Pending |
| NEW-027 | SRC-RESUME-01 §8 | Calendar integration links interview invitations to the correct application; interview outcomes, callbacks, and offers are tracked and connected back to the specific materials/wording/evidence used | REQUIRED outcome; calendar-provider integration and follow-up-email authorization model OPEN | No existing definition located — candidate NEW | Pending |
| NEW-028 | SRC-RESUME-11 §2–§7 | Career Master Foundation is the single reusable source for every resume output; career facts originate only with the user (job history, skills, achievements, certifications); AI must not supply missing biographical facts | REQUIRED (U02, U03) | Relates to existing "Career Channel Rod" (`journey_data_rods` where `rod_type='career_master'`, `careerAtomRegistry.js`) per `CLAUDE.md` — likely EXTEND, needs direct comparison before assuming either replaces the other | Pending |
| NEW-029 | SRC-RESUME-11 §4 | Below-threshold or ambiguous matches must prompt the user for their own transfer rationale (specific situation, personal action, scope, result) and invite — never require — supporting documentation; the answer becomes new, reusable Career Master testimony | REQUIRED (U07) | No existing definition located — candidate NEW | Pending |
| NEW-030 | SRC-RESUME-11 §7 | Every claim/output segment needs a dual ledger: factual provenance (source, evidence state) and editorial contribution (human vs. AI actor, transformation type, timestamp, approval state) — kept as two distinct attributes, never collapsed into one "% human" figure | REQUIRED (U06) | Conceptually adjacent to the separate `salt-basin-contribution-intelligence` skill/build (human-vs-AI attribution for Claude session work) — that system tracks contribution to *this platform's own build*, not to a member's personal career claims; confirm these are meant to stay two distinct ledgers before reusing tables | Pending |
| NEW-031 | SRC-RESUME-11 §10 | Personal resume must describe the Salt Basin resume product as this specific product at its actual (specification) stage — never claim implementation, launch, or adoption ahead of evidence | REQUIRED (U10) | No existing definition located — candidate NEW | Pending |

**Not registered as NEW- items (out of scope for this pass, flagged so they aren't silently folded in anyway):** the free-trial gating model, the agent/API-login spec for external Claude/Codex/ChatGPT agents, the "zero recurring LLM cost" architecture goal, and Betsy's own in-platform Claude Code access request — these are real, explicitly stated asks but are platform-wide/commercial decisions, not resume-product UX requirements. See `07-decision-log.md` DEC-007 through DEC-009.

## Required row/record schema (for when documents arrive)

For each new document supplied:
- **Document ID**, title, version/date, source format (e.g. Word doc, ChatGPT-voice transcript/notes, image/mockup), and where it's stored in this repo's docs area once registered.
- Per atomic requirement extracted from it: a stable **Requirement ID** (prefix `NEW-`), the original source section/quote (preserved verbatim, not paraphrased away), intended visual behavior, interaction rules, data meaning, permissions, and acceptance criteria as stated or reasonably implied.
- Explicit tagging of what's an **explicit requirement** vs. an **interpretation** vs. an **open question** — kept separate, never merged.

## What's needed from you to unblock this

1. The new product/UX documents themselves (any format).
2. If any were produced via ChatGPT voice, the actual transcript/notes content (not a re-summary) — the objective specifically calls these out as in-scope source material distinct from prior Claude-authored documentation.
3. Confirmation of which existing subsystem(s) they target, if known, so Stage 2 prioritization (see `03-current-state-specification.md`) can align with what's about to be reconciled.
