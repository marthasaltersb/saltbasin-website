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

## Traceability

Registered as `SRC-LIVE-01` in `01-source-register.md`. Extracted as `NEW-001` through `NEW-006` in `05-new-requirement-register.md`. Logged as `Edit #1` in `EDIT-LOG.md`. **Awaiting the user's read-back confirmation pass** before any of this is treated as settled.
