# 5. How it was built

The whole approach came out of one working session (9 October 2026) between the owner and Claude Code. It
was built one request at a time. Each step below shows what was asked, what Claude did, and the commit or
artifact that holds it. The method matters more than the order: **ask for one thing, check what already
exists, build or write it down, record the decision, then ask the next question.**

| # | The owner asked | What happened | Where it lives |
|---|---|---|---|
| 1 | "Help me make a generic release tracker like the Salt Basin website" | Claude read the existing tracker (`scripts/release-tracker-sync.mjs`, `tools/release-tracker/`) and pulled out a version with no Salt Basin dependencies. It added a settings file, a `log.mjs` so any pipeline can report, and a board that works on any static host. The result was checked to produce identical output to the original on test data. | commit 89e3981, `tools/release-tracker-kit/` |
| 2 | "Can I see a demo board in Salt Basin design system colors and 3D objects?" | Claude used the brand palette and fonts from `src/brand.css` and the crystal recipe from `src/lib/crystalGeometry.js`. Features orbit a release crystal as gems coloured by status, bugs circle their feature as shards, and clicking a gem filters the board. | Published demo artifact (private; share it from its page) |
| 3 | "I want the 3D objects to represent connected data, defined step by step in the platform" | Claude asked three questions (which data, who, how far). The answers were: any data source, admins and members, design spec first. It ran the reuse-first audit, then wrote the six-step scene procedure with no new tables. | commit 626ec30, `specs/scene-instructions.md` v0.1 |
| 4 | "How would I tell someone to map their own project system to my tracker?" | The seven mapping questions, with mappings by method and by tool and a worked example checked against the kit. | commit 1a91daf, `kit/MAPPING.md`, plus a published guide page |
| 5 | "The seven questions are foundational. I want to log in and build everything from there, scene by scene" | The questions became the account **Foundation**, and scenes are built on top of it. | commit ec9388b, scene spec v0.2 |
| 6 | "A user can have several foundational rods (personal career, plus organization ones with different databases), without losing audit history" | Claude checked the real database and found six ways history can be lost today (cascade deletes, evidence deletes, rod updates without events, and more). It wrote the four-layer rod model and separated owning a foundation from having access to it. | commit 3e88ce5, `specs/foundation-rods-and-audit-history.md` v0.1 |
| 7 | "So a rod is the equivalent of a data record?" | A plain explanation (rod type = table, rod = record, evidence = values with source, events = change log), plus a rule for deciding when something deserves its own rod. | Section 1 of `1-concepts.md` |
| 8 | "Can we make seed a thing below feature?" | Claude asked what a seed means and whether it should be its own rod. Answer: idea, story or task; tracked as evidence. | commit 2e2e57f (v0.2, later replaced) |
| 9 | "A seed is the raw entry of anything new, like a lead. Users plant seeds while building their career foundation, and agents plant seeds users review" | The seed lifecycle (plant → review → nurture → grow → report/audit), with the career foundation as the first experience and agent-planted seeds that always need the person's review. | commit 2e6fb4a (v0.3) |
| 10 | "A feature only comes from a seed; seeds and features link many-to-many; show what work was done when, for which seed, in which feature" | Features only from seeds, link records with scope, `seedIds` on every piece of work, seed IDs carried through the release loop, and traceability views. | commit 655298a (v0.4) |

## The habits that made it work

- **Check what exists before designing.** Every design step started by reading the real code and
  database. That is how the six history gaps were found.
- **Ask when the decision is the owner's.** Claude asked only when the answer changed what it would
  build, and offered a recommended option.
- **Write decisions down as versioned specs.** Every spec has a version table and a *Traces to* section,
  so later readers see how the design moved.
- **Keep a list of open questions.** Anything not decided is written as an exact question at the end of
  the spec, never guessed.
- **Prove the working parts.** The kit was checked against fixtures, and the guide's example was run
  through the kit before it was published.
- **Label what is real.** The working parts are distinguished from the designed parts everywhere.
