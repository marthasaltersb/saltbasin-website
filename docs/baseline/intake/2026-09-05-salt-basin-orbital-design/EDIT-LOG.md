# Edit Log — Configuration Module / Builder-Admin Specification and design-package validation

Global, sequential edit numbering across the whole intake package, per the protocol in `../../12-design-package-validation-workflow.md`. Each entry: edit number, date, target, your comment (attributed to you, Betsy Salter), the resulting text, and version.

---

### Edit #1 — 2026-09-06

**Target:** New document — `Configuration-Module-Builder-Admin-Specification.md` (version 0.2 draft), not yet in the supplied package.

**Comment from the user (Betsy Salter), source: live dictation in this Claude session, not yet read back for confirmation:**

> I don't think I called this out — any new definitions we need to support a more detailed build definition, user experience, or business rule detail. We need to get down to configurable elements vs. coded elements — whether a user is inputting a JSON string, a field, a picklist value, or a set of values relating to these objects. That level of detail needs to be defined for every single aspect of this product, and it needs to be backmapped to the existing Claude functionality. We're going to build the end-to-end product experience for this product itself using the configuration module, and that becomes the product we use to iterate going forward for every different module, industry, business use case, or client context. That means the new configuration/definition module needs to define voice input functionality for our agents — sales reps interacting directly with platform agents through voice, not just text chat, but real voice-chat functionality like ChatGPT voice, mimicked in our platform as talk-to-text. Make it accurate and easy for the user, and support different languages, applied appropriately to the database in the proper language — e.g., if an org's application is configured in English but has Spanish-speaking users giving Spanish input, the voice functionality must automatically log the Spanish input given and translate it to the English value that maps to the corresponding field, and every field needs an English translation so it maps and validates and displays correctly to all users.

**Resulting text (version 0.2 draft, first pass — see full document for the complete drafted section):** created `Configuration-Module-Builder-Admin-Specification.md` §1 (Detail-depth requirement) and §2 (Voice agent input and multi-language mapping), both status **REQUIRED** for the outcome, **OPEN** for the technical mechanism, per your own stated convention ("detailed contracts are proposed, unless explicitly described as user requirements").

**Now appears in:** `Configuration-Module-Builder-Admin-Specification.md` v0.2-draft, §1–§2; registered as `NEW-001` through `NEW-006` in `../../05-new-requirement-register.md`; source registered as `SRC-LIVE-01` in `../../01-source-register.md`.

**Status:** Awaiting your read-back confirmation/correction (this is a first-pass distillation of dictated content, not yet validated by you per the protocol's own rule that nothing is settled until you've heard it read back and called out corrections).

---

### Edit #2 — 2026-09-06

**Target:** `Configuration-Module-Builder-Admin-Specification.md` §5 (new section) — "The design-package validation process is itself a Configuration Module capability."

**Comment from the user (Betsy Salter), source: live dictation in this Claude session:**

> Okay but is the functionality built to then run against my comments to provide updated documentation, and I actually want the package design validation process to be something we design first in the configuration module.

**Resulting text:** added §5, specifying the read-aloud validation workflow itself as a Configuration Module capability (not a manual Claude Code process): what it must do (§5.1), proposed new Builder-module record types — `SourceDocumentDefinition`, `DocumentSectionDefinition`, `ValidationCommentDefinition`, `EditLogEntryDefinition`, `RequirementRecordDefinition` (§5.2), preliminary backmapping candidates against the existing draft/publish pair and `journey_rod_events` (§5.3), its relationship to the §3 voice-input requirement (§5.4), and explicit sequencing: this design is to be confirmed before resuming the document-by-document read-aloud walkthrough (§5.5).

**Now appears in:** `Configuration-Module-Builder-Admin-Specification.md` v0.2-draft §5; registered as `NEW-007` through `NEW-011` in `../../05-new-requirement-register.md`.

**Status:** Awaiting your read-back confirmation/correction — same as Edit #1, not yet settled.
