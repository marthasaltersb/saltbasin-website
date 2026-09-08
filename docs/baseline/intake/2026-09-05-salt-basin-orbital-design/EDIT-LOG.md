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

---

### Edit #3 — 2026-09-06

**Target:** `Configuration-Module-Builder-Admin-Specification.md` §1 — new subsections §1.1 (Layer taxonomy) and §1.2 (Client-defined field extensibility).

**Comment from the user (Betsy Salter), source: live dictation, read-back pass on §1:**

> [Read §1 back near-verbatim, confirming it, then:] The first paragraph is explaining the requirement for the principle of user experience definition versus visual element definition versus module definition versus the event from a user perspective and what destination it has, and how the information displayed gets gated and animation, etc. I'd like to add: every aspect needs definition down to which components of the software platform get defined, and are they coded — if coded, how much code is associated with a specific requirement, what supporting elements does the code need to run? Even configurable elements have code in the background that calls those configurable elements to make them work. When I'm building a product I want to define the code layers, the configurable layers, the database layers, the user experience layers, the detailed components of each, how those layers connect to each other, and how those layers change dynamically based on the interacting user and their data, licensing, etc. — what that changes about what they're able to see and do. Also: can a user create a new field? That action is configurable, against an admin. But if a user creates a new field in their client context, that doesn't necessarily create a new field in Salt Basin's overall codebase — each client has to keep track of their own client-defined pieces they create themselves.

**Resulting text:** §1 confirmed as originally drafted; added §1.1 (four-layer taxonomy — code/configurable/database/user-experience — plus how layers connect and change dynamically by user/data/licensing) and §1.2 (client-defined field extensibility without core-codebase changes, backmapped to the existing JSONB `fields` pattern already in this codebase).

**Now appears in:** `Configuration-Module-Builder-Admin-Specification.md` v0.2-draft §1.1–1.2; registered as `NEW-012` through `NEW-014` in `../../05-new-requirement-register.md`.

**Status:** Awaiting your read-back confirmation/correction.

---

### Edit #4 — 2026-09-06

**Target:** `Configuration-Module-Builder-Admin-Specification.md` — new §5 "Module Definition and 3D Variant provisioning," inserted before the validation-process capability, which is renumbered from §5 to §6 (subsections 5.1–5.5 → 6.1–6.5). Nothing was deleted — this edit log entry preserves the renumbering decision.

**Comment from the user (Betsy Salter), source: live dictation:**

> The first step of this design should really be defining the Salt Basin product — I'm still needing to define this configuration definition. I need to define the module, and for each module there's an associated 3D variant that represents that module. If there is not a 3D variant in the system existing that is not allocated to another module already, we need to run the 3D variant engine to produce a new 3D variant object for the module name, and provide the generator with a prompt to leverage the idea or concept visually to produce a more accurate 3D picture of what the module represents. And then for each module you need to define the orbit of that planet — each module should have constellations that represent journeys, and the planet itself should have a planet map view — I click into the planet and it takes me into the planet.

**Resulting text:** new §5 "Module Definition and 3D Variant provisioning — prerequisite capability," with §5.1 (Module Definition: 3D Variant auto-provisioning via a naming/concept-seeded generator, and Orbit/constellation/planet-map structure per module) and §5.2 (relationship to §6 — the validation capability is itself a module and needs this too). Former §5 renumbered to §6, its subsections renumbered 6.1–6.5, and its sequencing note (now §6.5) updated to reference §5 as a prerequisite.

**Now appears in:** `Configuration-Module-Builder-Admin-Specification.md` v0.2-draft §5; registered as `NEW-015` through `NEW-017` in `../../05-new-requirement-register.md`.

**Status:** Awaiting your read-back confirmation/correction. Also open: you said "version zero point two or zero point three now" while reading the header — flagged, not acted on; see the open question in the chat response for this edit.
