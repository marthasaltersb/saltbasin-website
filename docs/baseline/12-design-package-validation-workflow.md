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

## The read-aloud validation process — your actual protocol (adopted 2026-09-06)

You supplied the two prompts you gave ChatGPT to run this same validation on that side, and asked me to mirror the process rather than my earlier invented CONFIRMED/CORRECTED table. Your protocol, verbatim in intent:

1. **Reading order**: **NEWDOC-01 → NEWDOC-02 → NEWDOC-03 → NEWDOC-04 → NEWDOC-05 → NEWDOC-06**, unchanged from the original plan. NEWDOC-07/08 (raw transcript) stay reference-only.
2. **You read a section's text aloud**, then call out specific notes against it.
3. **Every callout is logged as a comment attributed to you** ("comment from the user Betsy Salter") — not paraphrased into my own verdict vocabulary.
4. **I update the finalized markdown text** for that section to reflect the callout.
5. **Every update is logged under an incrementing edit number** in `docs/baseline/intake/2026-09-05-salt-basin-orbital-design/EDIT-LOG.md` — edit number, target document/section, your comment (verbatim or lightly cleaned up for dictation artifacts, never reworded in meaning), the resulting text, and the version it now appears in. Edit numbering is global across the whole package (not per-document), starting at **Edit #1** (recorded below) and continuing sequentially — matching how you're running it on the ChatGPT side, so the two edit histories stay comparable.

Status vocabulary carries over from `Current-Specification.md` §1 and from your own new v0.2 framing: **REQUIRED** = your explicit direction, **PROPOSED** = a recommendation (mine or ChatGPT's) needing your confirmation, **EXAMPLE** = illustrative only, **OPEN** = still undecided. Detailed contracts default to PROPOSED unless the text explicitly says it's a user requirement — your own stated convention for the v0.2 material.

Once a document's every section has passed through this loop, its confirmed (REQUIRED/PROPOSED-accepted) content promotes into `05-new-requirement-register.md` as `NEW-` requirement rows, and once all six documents clear, Stage 3 reconciliation against existing code proceeds in `06-reconciliation-matrix.md` as originally planned — classifying retain/extend/modify/replace/split/merge/retire/new/conflicting/unresolved, and flagging unmapped new requirements and existing features with no counterpart.

You don't have to do all six documents in one sitting — the edit log tracks exactly where we left off and every edit's version, so picking back up later just means reading the log.

### Edit #1 — logged now, from your live dictation (not yet from a document read-aloud pass)

Before starting the formal NEWDOC-01 walkthrough, you flagged content you hadn't captured anywhere yet: a **Configuration Module / Builder-Admin Specification, version 0.2 draft** covering (a) field/element-level detail depth and (b) voice-agent multi-language input. This didn't exist in the supplied package or anywhere in this program's documents, so it's now drafted as new source content and logged as Edit #1 — see `EDIT-LOG.md` and the corresponding `NEW-001` through `NEW-006` rows in `05-new-requirement-register.md`. **This draft has not been read back to you yet for confirmation** — it's my first-pass distillation of your dictation, exactly the kind of thing this protocol exists to catch errors in, so treat it as due for your own correction pass, not as settled.

### Sequencing change (Edit #2) — the validation process itself is now a design item, and comes first

You redirected: this whole read-aloud validation workflow must itself be designed as a Configuration Module capability (not stay a manual Claude Code process), and that design happens **before** we resume NEWDOC-01–06. That design is drafted at `Configuration-Module-Builder-Admin-Specification.md` §6 (renumbered from §5, see Edit #4 below) and registered as `NEW-007` through `NEW-011`, logged as Edit #2. **The document walkthrough below is paused until this is confirmed.** Once confirmed, whether the walkthrough then continues manually in this chat (as a stand-in until the real capability is built) or waits for the capability itself is your call — not yet decided.

### Further correction on read-back (Edit #3, Edit #4) — layers, extensibility, and an even earlier prerequisite

Reading §1 back, you confirmed it and added real depth: the actual definition schema is four explicit layers (code, configurable, database, user experience), how they connect, and how they change per interacting user/data/licensing — plus a concrete requirement that clients can create their own fields without that touching Salt Basin's core codebase (Edit #3, `NEW-012`–`NEW-014`).

Then a bigger correction: the true first step isn't uploading a document into the validation capability — it's that Salt Basin's own **Module Definition** capability has to exist first, including auto-provisioning a 3D Variant per module (via the existing world-variant/crystal-geometry system, extended to generate on demand) and an Orbit/constellation/planet-map structure. This is now **§5**, inserted before the validation capability (renumbered §5→§6), logged as Edit #4 (`NEW-015`–`NEW-017`). **Open, unresolved:** you also said "version zero point two or zero point three now" while reading the header — flagged in `05-new-requirement-register.md`, not acted on.

## A structural note worth flagging before you start reading

The package's own precedence table (`Current-Specification.md` §1) already does some of Stage 3's reconciliation work itself — e.g. it says "Preserve three peer Journey Rods; modules can organize capabilities across them," which is a direct, specific claim about how this maps onto the *existing* `journey_data_rods`/Tributary architecture documented in this repo's own `docs/canon/SB-*` files and the `salt-basin-channel-journey-architecture` skill. That's exactly the kind of claim this program's rules say not to accept just because it's plausible-sounding or because ChatGPT wrote it confidently — it needs the same read-aloud confirmation as everything else, and then a real check against the existing Tributary/Channel Rod registry (not just an assertion that it's compatible). Flagging this now so it doesn't get treated as already-settled when we reach NEWDOC-01 §2.

## Ready when you are

Say which document you'd like to start reading aloud through (recommended: NEWDOC-01, `Current-Specification.md`), and begin calling out changes as you go — I'll track them.
