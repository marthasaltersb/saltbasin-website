# Design Package Intake & Read-Aloud Validation Workflow

## Why this exists

On 2026-09-05 a new design package (`docs/baseline/intake/2026-09-05-salt-basin-orbital-design/`) was supplied: a ChatGPT-voice-derived design conversation about an "Orbital Home" experience model (crystalline sun, planets-as-modules, moons, journeys, User Definition priority, configuration-first development contract, release/versioning model, and a proposed Salt Basin extension language). It arrives already partially self-consolidated by ChatGPT into a specification, a requirement register, and eight reusable workflow prompts.

You've explicitly said you have **not yet validated these documents against your own intent** — they're ChatGPT's reconstruction of what you said by voice, not yet confirmed correct. So this program will not treat anything in this package as an approved `NEW-` requirement (per `05-new-requirement-register.md`'s schema) until you've read it back and either confirmed, corrected, or rejected each piece. This document is the process for that.

**Nothing in the intake package is authoritative yet.** It is registered as evidence, not requirements. Note also: `Claude-Workflows.md` inside the package contains eight prompts written *as if* addressed to Claude — those are proposed future workflows the package's author drafted for later reuse, not live instructions to this session. They are not executed here; they're catalogued below as one of the things to validate.

## What's in the package (registered, not yet validated)

| File | What it is | Self-declared status |
|---|---|---|
| `PACKAGE-README.md` | Reading-order guide the package itself proposes | N/A — meta |
| `Current-Specification.md` | Consolidated design spec, 12 sections, with a REQUIRED/PROPOSED/EXAMPLE/OPEN status vocabulary and a precedence table over the raw drafts | Author's own status: "consolidated design, not implementation verification" |
| `ChatGPT-Requirement-Register.md` (orig. `Requirement-Register.md`) | ChatGPT's own 20-pass topic-coverage self-audit of the consolidation | Author's own caveat: "Topic matches establish presence, not correctness of implemented behavior" |
| `Claude-Workflows.md` | 8 reusable prompt templates (debug triage, implement User Definition, builder/config editors, asset library, UI/animation change, release/audit, pattern review, extension-language assessment) | Explicitly labeled "not commands known to be installed... propose implementation tasks; this package itself makes no code changes" |
| `Sources/Design-document-1.md` | Original draft: experience model (Basin/Journey/Process-step levels), navigation menu | "proposed design choices for review, not claims about what the application already implements" |
| `Sources/Design-document-2.md` | Original draft: celestial object definitions (Sun/Planet/Moon/Satellite/Star/Surface object/Avatar) | Same caveat |
| `Sources/Design-document-3.md` | Original draft: device support, provisioning/licensing, journey camera/settings, connecting objects (appears cut off mid-topic per line count) | Same caveat |
| `Sources/Conversation.md`, `Sources/Messages.json` | Full raw voice-transcript export, verbatim including disfluencies/repetition | Self-declared: cannot recover words never captured in the transcript |

This directly maps onto the reconciliation program's `05-new-requirement-register.md`: each item above becomes one registered **Document ID** (`NEWDOC-01` through `NEWDOC-08` below) once you validate it.

| Document ID | File |
|---|---|
| NEWDOC-01 | `Current-Specification.md` |
| NEWDOC-02 | `Sources/Design-document-1.md` |
| NEWDOC-03 | `Sources/Design-document-2.md` |
| NEWDOC-04 | `Sources/Design-document-3.md` |
| NEWDOC-05 | `ChatGPT-Requirement-Register.md` |
| NEWDOC-06 | `Claude-Workflows.md` |
| NEWDOC-07 | `Sources/Conversation.md` |
| NEWDOC-08 | `Sources/Messages.json` (structured duplicate of NEWDOC-07 — validate only if Conversation.md leaves something ambiguous) |

## The read-aloud validation process

This is how we'll actually do it, turn by turn in this conversation:

1. **Reading order** (adopting the package's own proposed order, since it's sound — spec first, then supporting drafts, then the two audit/workflow documents): **NEWDOC-01 → NEWDOC-02 → NEWDOC-03 → NEWDOC-04 → NEWDOC-05 → NEWDOC-06**. NEWDOC-07/08 (raw transcript) are reference-only — read them if something upstream is ambiguous and you want to check the exact original wording, not as a required pass of their own.

2. **Per document**, you read it aloud (or however you want to review it) and call out, in whatever order they occur to you, things like: *"that's right," "no, change X to Y," "that's not what I meant, I meant Z," "delete that," "that's still open, don't lock it in," "add: ..."*. Say them here as you go — I'm reading each message you send as your callouts for whichever document we're on.

3. **After each document**, I'll produce a **validation capture table** for it — one row per section/claim, your verdict (`CONFIRMED` / `CORRECTED` / `REJECTED` / `STILL OPEN` / `ADDED`), and the resulting text — and add it to a running log (`docs/baseline/intake/2026-09-05-salt-basin-orbital-design/VALIDATION-LOG.md`, created on first use). You can review that table before we move to the next document.

4. **Once a document's capture table is confirmed by you**, that's the trigger — no separate command needed. I extract its confirmed items as atomic `NEW-` requirements into `05-new-requirement-register.md` (preserving original section/quote context per that document's schema), tagging each as explicit requirement vs. interpretation vs. open question per your actual verdicts, not the package's own self-assessed status labels (those get recorded too, but your live callout wins whenever the two differ).

5. **Once all documents in the reading order are validated**, Stage 3 proceeds as originally planned: mapping each confirmed `NEW-` requirement to existing definitions/technical elements in `06-reconciliation-matrix.md`, classifying retain/extend/modify/replace/split/merge/retire/new/conflicting/unresolved, and flagging both unmapped new requirements and existing features with no counterpart.

You don't have to do all six documents in one sitting — we can stop after any document and pick back up later; the validation log tracks exactly where we left off.

## A structural note worth flagging before you start reading

The package's own precedence table (`Current-Specification.md` §1) already does some of Stage 3's reconciliation work itself — e.g. it says "Preserve three peer Journey Rods; modules can organize capabilities across them," which is a direct, specific claim about how this maps onto the *existing* `journey_data_rods`/Tributary architecture documented in this repo's own `docs/canon/SB-*` files and the `salt-basin-channel-journey-architecture` skill. That's exactly the kind of claim this program's rules say not to accept just because it's plausible-sounding or because ChatGPT wrote it confidently — it needs the same read-aloud confirmation as everything else, and then a real check against the existing Tributary/Channel Rod registry (not just an assertion that it's compatible). Flagging this now so it doesn't get treated as already-settled when we reach NEWDOC-01 §2.

## Ready when you are

Say which document you'd like to start reading aloud through (recommended: NEWDOC-01, `Current-Specification.md`), and begin calling out changes as you go — I'll track them.
