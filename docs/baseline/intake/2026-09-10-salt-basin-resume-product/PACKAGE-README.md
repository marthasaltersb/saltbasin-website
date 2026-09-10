# Salt Basin — Resume Product Design Package

Intake date: 2026-09-10. Supplied across a live Claude Code session as file uploads (in two near-identical batches — see `EDIT-LOG.md` note below) plus text pasted directly into chat. This package captures career-resume-product requirements and Betsy's actual Osaic application materials; it is a sibling to `../2026-09-05-salt-basin-orbital-design/`, not a replacement for it.

Start with **`Resume-Product-Specification-v0.2.md`** for the consolidated deliverable/requirement spec. **`Source-Review-and-Career-Foundation.md`** is the career-fact reconciliation layer — read it alongside the spec, since it supersedes some of the spec's own "missing source" assumptions (§1) with real evidence from S01–S08. **`Reusable-Production-Prompt.md`** is the reusable driver prompt Betsy asked to have preserved for reuse in future sessions/agents. **`Osaic-Application-Review-Draft.md`** is the actual personal-application content (resume + cover letter draft + internal source map) — not final, awaiting the real Osaic posting and the R01–R12 reconciliation items.

`Sources/` preserves the originals Betsy actually uploaded to this session, unmodified, renamed only with their `S0N-` ID prefix from `Source-Review-and-Career-Foundation.md`'s source table, plus the three earlier UX/trust-requirements writing blocks (`UXT-01` through `UXT-03`) from a separate, earlier dictation pass in this same session. **S06 and the S09 image referenced throughout `Source-Review-and-Career-Foundation.md` were never actually supplied as files to this session** — see the intake note at the top of that document.

## Documents in this package

| Document | What it is |
|---|---|
| `Resume-Product-Specification-v0.2.md` | Consolidated deliverable/requirement spec: Career Master Foundation schema, evidence states, transferable-skill weighting model (75/50 thresholds), negative-scenario rules, template families, human/AI contribution ledger, D01–D11 deliverables |
| `Source-Review-and-Career-Foundation.md` | S01–S09 source inventory, R01–R12 reconciliation register (Streamforce founder vs. partner, Accenture month, headline counts, etc.), C01–C14 claim set, actual transfer map for Betsy's real career history |
| `Reusable-Production-Prompt.md` | The reusable "act as a source-grounded career-content editor" driver prompt Betsy asked to be saved separately so it survives outside chat context |
| `Osaic-Application-Review-Draft.md` | Draft resume + cover letter content for the actual Osaic application, plus the internal (never-published) source map behind each line |
| `Sources/` | Original uploaded files, unmodified, ID-prefixed per the source table above |

## What this package is not

This is documentation and a proposed specification, not a shipped release. No product code, database schema, or UI was changed by creating this package. No application material here has been marked final, approved, or submitted. No claim in `Osaic-Application-Review-Draft.md` should be read as verified beyond "user-supplied document assertion" — see that document's own provenance labels.

## How this connects to the program in `docs/baseline/`

This package is registered as evidence in `../../01-source-register.md` (new "2026-09-10 resume-product intake" section), candidate requirements are logged — explicitly unvalidated — in `../../05-new-requirement-register.md`, and open decisions (match-threshold reconciliation, free-trial gating, R01–R12 career-fact conflicts, the self-hosted-agent-platform ask) are logged in `../../07-decision-log.md`. Per this program's own rule, nothing here is promoted to a confirmed target-spec requirement until Betsy has reviewed and confirmed it.

A repeatable build driver for this package lives at `.claude/skills/salt-basin-resume-product/SKILL.md` (invoke via `/salt-basin-resume-product`), mirroring the `salt-basin-master-build` / `salt-basin-pre-build` pattern already used elsewhere in this repo.
