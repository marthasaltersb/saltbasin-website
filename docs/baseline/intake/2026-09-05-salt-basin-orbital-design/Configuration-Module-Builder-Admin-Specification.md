# Salt Basin — Configuration Module / Builder-Admin Specification

Version 0.2-draft · Drafted 2026-09-06 from live dictation (Edit #1, see `EDIT-LOG.md`) · Status: **not yet read back to the user for confirmation.**

Status vocabulary, per the user's own stated convention: **REQUIRED** = explicit user direction, **PROPOSED** = a recommendation needing confirmation, **EXAMPLE** = illustrative only, **OPEN** = mechanism/detail still undecided. Detailed contracts below default to PROPOSED unless the text explicitly says REQUIRED.

## 1. Field/element-level detail depth (REQUIRED outcome; mechanism OPEN)

Every aspect of the product needs definition down to the level of: which elements are **configurable** vs. **coded**, and for configurable elements, what shape of user input they take — a JSON string, a single field, a picklist value, or a set of values relating to an object. This is not a general architecture principle to apply loosely; it's a REQUIRED deliverable: **for every module, screen, field, rule, and object in the target specification, its configurable/coded classification and its input shape must be explicitly recorded**, not left implicit.

Every one of these detailed definitions must be **backmapped to the existing Claude-built functionality** — i.e., for each configurable/coded element defined here, the reconciliation matrix (`06-reconciliation-matrix.md`) must record what existing technical element (if any) it maps to, per the program's existing mapping schema (retain/extend/modify/replace/split/merge/retire/new/conflicting/unresolved). This is a restatement/reinforcement of the existing reconciliation program's own required rigor, not a new mechanism — flagged here because the user identified it as something not yet explicitly called out for this particular design package.

**OPEN:** the exact schema for recording "configurable vs. coded + input shape" per element (e.g., does this become a new column in the technical-element register, or a new per-field metadata table) is not yet decided — this is a Stage 4 (target specification) design decision, not resolved here.

## 2. Configuration module builds the product itself (REQUIRED)

The end-to-end product experience for Salt Basin itself is to be built **using the configuration module** — i.e., the configuration/definition capability is not a side feature bolted onto a separately-hardcoded product; it is the mechanism that produces the product's actual screens, journeys, and behavior. Once built this way, **the same configured product becomes the reusable engine used to iterate going forward for every future module, industry, business use case, or client context** Salt Basin builds for.

This directly reinforces (does not replace) the existing "configuration-first development contract" already present in `Current-Specification.md` §8–§9 and this repository's own `salt-basin-config-audit` skill — the user is stating this as a firm, non-negotiable delivery approach, not a nice-to-have.

## 3. Voice input for platform agents (REQUIRED outcome; mechanism OPEN)

Sales reps must be able to interact directly with platform agents **through voice**, not only text chat — real voice-chat functionality (talk-to-text), comparable in kind to ChatGPT's voice mode, built into the Salt Basin platform itself. This extends the existing "Agent interaction: accept voice and typed requests" line already present in `Current-Specification.md` §7/table row ("Agent interaction"), which stated the requirement at a high level — this section adds the specific delivery target (sales-rep-facing, real-time, talk-to-text, ChatGPT-voice-comparable) that wasn't previously spelled out.

Quality bar (REQUIRED as a goal): voice input must be **accurate** and **easy for the user**. No specific accuracy metric or vendor/engine choice was given — that's OPEN.

## 4. Multi-language voice input and field-level translation (REQUIRED outcome; mechanism OPEN)

Voice input must support **multiple languages**, with input applied "appropriately to the database in the proper language." Concretely, per the user's own example:

> If an organization's application is configured in English, but the organization has Spanish-speaking users providing Spanish-language voice input, the platform must **automatically log the Spanish input as given**, **and** translate it to the **English value that maps to the corresponding English field** — so that every field has an English translation, and data maps, validates, and displays correctly to **all** users regardless of the language they used to provide it.

Decomposed as explicit requirements:
- **REQUIRED:** the original-language input, as spoken, must be logged/retained (not discarded once translated) — this is an audit/evidence requirement, consistent with the existing diagnostic/lineage discipline already required elsewhere in this package (`Current-Specification.md` §7's diagnostic table, which already tracks "Translation: mapping version, incoming value, translated value, validation result" for *rule/data* translations — this section extends that same discipline to *human-language* translation, which is a distinct concept the existing diagnostic table does not yet cover).
- **REQUIRED:** every field that can receive non-English input must have a translated English-language value stored/derivable, so the platform's single source of validated truth is consistent regardless of input language.
- **EXAMPLE, not a universal rule:** English-as-the-organization's-configured-language and Spanish-as-a-user-input-language is the example given; the actual requirement is language-pair-agnostic (an org could be configured in any language, with users providing input in any other language).
- **OPEN:** the actual data model for this is undecided — does a field store one canonical value plus a translation-log/audit trail, or does it need genuine multi-locale value storage (a value per language) versus a single canonical value with retained original-language evidence only? This is a real, nontrivial data-model decision with backward-compatibility implications for every existing `section.fields` object across the codebase (per this repository's own `CLAUDE.md`, sections currently store untyped `fields` objects with no documented localization concept at all) — **flagged as a new Stage 2/3 investigation item**: does any existing localization/i18n mechanism exist in the codebase today? Not yet checked. See `07-decision-log.md` DEC-005.

## 5. The design-package validation process is itself a Configuration Module capability (REQUIRED; drafted Edit #2, not yet read back)

The read-aloud validation workflow this program has been running manually in chat (`12-design-package-validation-workflow.md`) is **not to stay a manual Claude Code process** — it is itself a product capability to be designed within the Configuration Module, consistent with §2's mandate that Salt Basin be built using its own configuration module. This section defines that capability at design level. No code changes are made here — this is still discovery/design, per the governing reconciliation program's own rule against implementing during discovery.

### 5.1 What the capability must do (REQUIRED outcome)

Let an authorized user (starting with the platform admin — Betsy) do, through the product itself, exactly what this program has been doing by hand:
1. Load a source document (an uploaded design artifact, a prior conversation export, or a Salt Basin-generated specification) as a set of addressable sections.
2. Read/hear a section, and attach a comment against it — **by voice or text** — a comment being: confirm, correct with replacement text, reject, mark still open, or add new content.
3. On each comment, produce an updated, finalized version of that section's text, and record the change as one entry in an append-only edit/version log — never overwriting prior text silently.
4. Once a document (or a defined subset of it) has every section resolved, promote its confirmed content into governed requirement records, distinct from a general note — mirroring this program's own `05-new-requirement-register.md`/`06-reconciliation-matrix.md` distinction between raw comment and accepted requirement.
5. Show, for any section, its full edit history: who commented, what was said, what changed, and which published version now carries it — an administrator audit view, per the existing "Change Decision" / "Audit-version" concepts already required elsewhere in this package (`Current-Specification.md` §6 "Audit/version" row, §8 "ChangeDecision / DiagnosticRun").

### 5.2 New Builder-module record types this requires (PROPOSED — maps onto existing §8 pattern, does not replace it)

Extending the persisted-definition table already established in `Current-Specification.md` §8:

| Record type | Purpose | Relationships |
|---|---|---|
| `SourceDocumentDefinition` | One ingested document (a design doc, transcript, or spec) | Owner/author, ingestion date, document-level status |
| `DocumentSectionDefinition` | One addressable section of a document, with current finalized text and status (REQUIRED/PROPOSED/EXAMPLE/OPEN) | Parent `SourceDocumentDefinition`; current version pointer |
| `ValidationCommentDefinition` | One comment against a section — voice or text, verbatim, attributed to its author | Parent `DocumentSectionDefinition`; input modality (voice/text); resulting edit |
| `EditLogEntryDefinition` | One append-only edit: comment, resulting text, sequential edit number, timestamp | Parent section; supersedes prior section version, never deletes it |
| `RequirementRecordDefinition` | A confirmed, promoted requirement derived from one or more sections | Source section(s); reconciliation mapping to existing `TechnicalElement`/`ModuleDefinition` records (§8, already defined) |

These are **proposed logical entities**, per §8's own existing caveat — not an instruction to create five new database tables before checking reuse.

### 5.3 Backmapping candidates already visible in the existing codebase (REQUIRED per §1 — recorded now, not deferred)

Per this document's own §1 rule ("every defined element must be backmapped to existing Claude functionality"), two existing mechanisms are strong reuse candidates and should be the starting point of Stage 3 reconciliation for this capability, not a from-scratch build:

- **Draft/published pair** (`CLAUDE.md`'s documented `site_state`/`config_state` and `member_sites`/`member_configs` pattern, with `version`/`schemaVersion` stamped on write) is structurally the same shape as `DocumentSectionDefinition`'s draft-text-vs-published-version need — a section's "current finalized text" is a draft/publish pair like everything else in this app, not a new concept.
- **Event-sourced Channel Rod evidence** (`journey_rod_events`, per this repo's Career Placement Agents architecture, where "agent actions reuse `journey_rod_events` against whichever rod the agent is working... only the role/capability/schedule *definitions* got new tables") is structurally the same shape as an append-only `EditLogEntryDefinition` — an edit log is an event stream against a rod-like object, which this codebase already has a governed mechanism for.

**This is a preliminary observation, not a completed Stage 3 mapping** — real reconciliation (checking these mechanisms' actual current implementation, not just their documented shape) is still Stage 2/3 work. It's recorded now because leaving it out would violate this same section's own detail-depth requirement.

### 5.4 Relationship to voice/multi-language requirements (§3–§4)

This capability is the natural first real use case for the voice-agent input required in §3: Betsy commenting on a document section by speaking is the same interaction shape as a sales rep updating a record by speaking to an agent. It should reuse the same voice-input mechanism, not a separate one — flagged so §3's design isn't built in isolation from this need. Whether it also needs §4's multi-language handling is **OPEN** (this specific capability is currently single-user, English-only; multi-language only matters here if the platform is used by non-English-speaking admins later).

### 5.5 Sequencing (REQUIRED — per the user's explicit direction this turn)

This capability's design is to be completed and confirmed **before** resuming the manual read-aloud walkthrough of `Current-Specification.md` and the other five package documents. The manual process already run for Edit #1 stands as evidence of what the capability needs to do — it is not thrown away, it's the reference behavior this design must reproduce as a product feature.

## Traceability

Registered as `SRC-LIVE-01` in `01-source-register.md`. Extracted as `NEW-001` through `NEW-006` (§1–§4) and `NEW-007` through `NEW-011` (§5) in `05-new-requirement-register.md`. §1–§4 logged as `Edit #1`, §5 logged as `Edit #2`, both in `EDIT-LOG.md`. **Awaiting the user's read-back confirmation pass** before any of this is treated as settled.
