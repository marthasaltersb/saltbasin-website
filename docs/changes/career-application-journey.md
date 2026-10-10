# Change spec: Career application journey (prospect → package → applied)

Feature key: `career-application-journey` · Release: `2026-10-02-application-packages` (0.2.0) · Version 1 (design) · 2026-10-10
Status: design. Owner direction captured below; open owner questions are listed at the end. Nothing is built yet.

## Owner direction (2026-10-10)

> In Career Sources there is the user uploading external documents that get mapped to skills, tech,
> proficiency levels, job description, job… and then there's career pipeline items that a user reviews and
> decides whether or not to apply for the job. Career pipeline prospect prioritization scoring should be a
> configuration, and once the user approves a career prospect, the next review is for the system to
> automatically generate a proposed cover letter, graphic resume, ATS resume and Application Appendix. There
> should be 3 proposed templates for each package, and the user can pick and choose which sections and pages
> and graphics they want in the editor screen. If the user decides in the editor to make their own resume
> updates, and the entries or edits materially change an existing, or provide a new, Career Master source,
> that becomes a new item for review, so the user can approve quickly whether or not that résumé's changes
> become new source authority, and that resume should get logged in the Career Master source evidence log.
> Once the career outbound package is approved, it becomes the frozen version. Once the job is moved to
> applied, the most recent package version is the version that the system assumes was used to apply. If the
> user wants to edit the outputs again, they click back into the job's resume output editor and the next
> conversion becomes the newest version. If the job is already applied for, the system should prompt the user
> to confirm whether the job should be marked as not applied, or whether it is a new job and needs a new
> pipeline record.

## Two review queues, kept separate

| Queue | What is reviewed | Decision | Where it lives today |
| --- | --- | --- | --- |
| **Career Sources to Review** | Facts from outside documents (uploaded resumes, imported packages) and, new here, material edits made in a job's output editor, mapped to Career Master fields (jobs, skills, tools, proficiency, certifications, job descriptions) | Approve = becomes Career Master source authority; Reject = Career Master unchanged, the wording stays only in that output | `career_reconciliation_tasks`, `careerReconciliation.js`, `packageReconciliation.js`, `CareerReconciliationPanel.jsx` |
| **Career pipeline** | Job prospects (tracked opportunities), prioritised by a configurable score | Approve = pursue this job (`discovered → approved`); later stages applied, interviewing, offer, rejected, withdrawn | `career_opportunity_target` rods, `careerOpportunityRollups.js` (`ALLOWED_TRANSITIONS`), Career Placement Agents |

## The journey, step by step, against what exists

| # | Owner's step | Exists today | Gap to build |
| --- | --- | --- | --- |
| 1 | Prospects are prioritised by a **configurable** score | Scoring model is a configuration row (`journey_current_definitions`, `scoringModel: 'weighted_sum_x20'`, 8 dimensions, tiers) with an org override seam; missing dimensions are reported, never scored 0 | A screen to edit the weights, dimensions and tiers (today only data); the pipeline list sorted by score |
| 2 | Approving a prospect starts the next review: the system proposes a **cover letter, graphic resume, ATS resume and Application Appendix** | `discovered → approved` is watched by the auto-queue dispatcher; a template cover letter is drafted when a job is tracked (`coverLetterAutoDraft.js`); combined package with contents page (`packageAssembly.js`) | Generate all four on approval (not the cover letter at track time); the **Application Appendix** output type; an **ATS resume** layout (plain, single column, parser-safe) beside the graphic resume |
| 3 | **Three proposed templates** for each package item; the member picks sections, pages and graphics in the editor | Output Templates (presets) and the chart gallery; one editor (`HerqOutputConfigurator.jsx`) | Three template proposals per output type shown side by side; choose one, then include/exclude sections, pages and graphics in the same editor |
| 4 | Member edits in the editor that **materially change** or **add** a Career Master source become a review item; the resume is logged in the **Career Master source evidence log** | Per-output overrides with Revert; package items go to Career Sources to Review; evidence rows in `journey_rod_evidence` | Detect material edits on save and file them as Career Sources to Review items with the output as their source; log the output as a source document in the evidence log (source type `member_output`) |
| 5 | Approving the package **freezes** it | Approved versions are never edited; saving makes a new draft version in the same lineage (`parent_version_id`) | Approve the four items together as one package version |
| 6 | Moving the job to **applied** records the most recent approved package version as the one used to apply | Stage moves are events (`career_opportunity_stage_changed`) | Store the applied-with package version on the stage event and show it on the job |
| 7 | Editing again after applying: reopen the job's output editor; the next conversion becomes the newest version | Editor and versioning exist | If the job is **applied**, ask first: "Mark this job as not applied" (new transition `applied → approved`, recorded with who and when) or "This is a new job" (creates a new pipeline record linked to this one); the applied-with version stays on record either way |

## Definitions proposed for the owner to confirm

- **Material change** (step 4): a new job, skill, tool, certification or bullet; a changed job title, employer or
  dates; a changed proficiency level; a changed metric or number. Rewording that keeps the same facts is not
  material and stays a per-output override.
- **ATS resume**: one column, standard headings, no charts, tables or images, text that copies cleanly; the
  same Career Master facts as the graphic resume.
- **Three templates**: three Output Template presets per output type, chosen in Output Templates and editable
  there (platform defaults until the member saves their own).

## Reuse-first notes

No new tables expected: pipeline stages and scores already live on `career_opportunity_target` rods and their
events; review items reuse `career_reconciliation_tasks`; outputs, versions and packages reuse
`resume_output_projections` (lineage, `parent_version_id`, `career_opportunity_rod_id`); the evidence log is
`journey_rod_evidence`. Additive columns only where a field is missing (for example the applied-with version id
on the stage event's metadata). Interface parity: every step on the website (desktop and phone), the API and an
MCP tool.

## Open questions for the owner

1. **Application Appendix**: what goes in it? (For example: project case studies, certifications with dates,
   references, portfolio links, the proficiency charts.)
2. Confirm the **material change** definition above.
3. When a job is marked **not applied**, should the package version it was applied with stay approved and
   frozen (recommended), or return to draft?
