# Change spec: Career Master is the only source

Feature key: `career-master-single-source` · Version 1 (design) · 2026-10-10
Status: design. The owner direction is recorded below; the owner still has to choose where the single store lives and when it ships (see the end). Nothing is built yet.

## Owner direction (2026-10-10)

> The Career Master should be the only source the public pages read from; there shouldn't be a second copy.
> If something isn't read from Career Master, it is a member user-scoped config field they create within the
> public site itself, and whatever value the user stores gets persisted to a Career Master source entry for
> public-site user-scoped fields, recorded as the source entry authority for those fields. The user can opt
> to choose which public-site content they want to leverage in the resume outputs from the Career Master.

## Today: two copies kept in step

- **Editing** (Career Master screens, imports, approvals) writes the `career_jobs / skills / tools /
  engagements / certifications / domains / deals` tables.
- **Reading** for public pages, charts, rollups, proficiency, resume targeting, cover letters, opportunity
  scoring and version history goes through the Career Channel Rod: `journey_rod_evidence` rows on the
  member's `career_master` rod. These are written by `careerAtomMigration.js`
  (`syncSingleEntry` / `removeEntryEvidence`) after every table write.
- So there are two stores, and a sync step that can fail between them. The "Career Atom sync failed"
  message and its Retry button exist only because of this.
- About 30 server and client modules read the rod side, and 7 route or library files read the tables.

## Rule

1. **One store.** Every Career Master fact (job, skill, tool, engagement, certification, domain, deal,
   proficiency, bullet) lives in exactly one place. Public pages, resume outputs, charts and agents read it
   from there, and there is no sync step.
2. **Every value has a source entry.** Each value records where it came from: typed in Career Master, an
   approved import, an approved edit made in an output editor, or a public-site field. It also records who
   approved it and when. That record is the source evidence log.
3. **Public-site fields are Career Master entries too.** A value a member types into their public site
   (for example a headline, an about paragraph, a custom stat, a testimonial) is saved as a Career Master
   source entry with source type `public_site`. That entry is the authority for that field. The site reads it
   back from Career Master like everything else.
4. **Resumes opt in.** Public-site entries are not used in resume outputs unless the member opts in. Each
   output template, or each output, has a choice that lists the member's public-site entries, and only the
   ticked ones are available to the resume.

## Where the single store should live: recommendation

The owner's own terms are "source entry", "source authority" and "source evidence log". They describe the
evidence rows (`journey_rod_evidence`: value, `source_type`, `source_reference`, `confidence`, `source_tier`,
plus the approval columns added for render bindings: `status`, `proposed_by`, `decided_by`, `decided_at`).

**Recommended:** make the Career Master evidence store the single store. Under this option:
- The Career Master screens, imports and approvals write evidence directly.
- Readers keep reading the same place.
- The `career_*` tables stop being written once every member's data has moved. The tables are kept,
  read-only, so nothing is lost.

The alternative is to keep the `career_*` tables as the store, add provenance columns to them, and move
about 30 readers onto the tables.

**Deployment safety** (CLAUDE.md invariants):
- Moving a member's existing data is an explicit, versioned, per-member migration, recorded per member.
  It is never a silent reinterpretation.
- No member row is rewritten by seed or bootstrap.
- Until a member's migration is recorded, that member keeps today's behaviour.

## What it replaces or simplifies

- The "Career Atom sync failed" path, the "Applied - sync failed" list and Retry sync go away.
  Career-bound-outputs step E.4 is retired by amendment.
- The Career Sources to Review queue writes the approved value straight into the single store, with its
  source entry.
- The career application journey (`docs/changes/career-application-journey.md`) logs an approved resume
  edit as a source entry in the same store.

## Owner decisions needed

1. Confirm the single store: the Career Master evidence store (recommended), or the current Career Master
   tables.
2. When to ship it: as the first feature of the next release, after release 0.2.0 passes (recommended, since
   about 30 modules and every member's data are involved), or inside 0.2.0 now.
3. Which public-site fields count as member-authored entries (headline, about, custom stats, testimonials,
   links …), or simply every member-editable text field on their public site.
