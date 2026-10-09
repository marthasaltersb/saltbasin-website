# Foundation Rods and audit history: many foundations per person, no lost history

Version 0.3 (proposed design, not built) · 2026-10-09 · Status: **awaiting owner approval**

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-09 | Many foundations per person; audit-history model; gaps G1–G6 (commit 3e88ce5). |
| 0.2 | 2026-10-09 | Owner direction: **seeds** sit below features (section 6). |
| 0.3 | 2026-10-09 | Owner direction: a seed is the raw **entry point** for anything new, like a lead. Seeds are planted, reviewed, nurtured, grown, reported and audited. The career foundation teaches it, and agents plant seeds for people to review (section 6, rewritten). |

## Traces to

- `docs/changes/scene-instructions.md` v0.2 (commit ec9388b): one foundation per account. This document
  replaces that with **many foundations per person**, per owner direction 2026-10-09.
- `server/db.js`:
  - `journey_data_rods` (`user_id`, `org_id`, `parent_rod_id`, unique indexes `idx_rods_user_type` and
    `idx_rods_user_org_type`)
  - `journey_rod_events`, `journey_rod_evidence` (`lineage_parent_id`)
  - `org_memberships` (`role`), `personal_org_links`
  - `oauth_connections` (`profile_scope`, `profile_id`, `allow_write`)
  - `data_ports`
- CLAUDE.md deployment-safety invariants (append-only registries, schema-versioned JSON, never reinterpret
  member data silently).

## Owner direction (2026-10-09)

- A person can hold **several foundational Channel Rods**.
- A member who joins **without an organization** gets a persistent **career** foundation that belongs to
  them.
- If the same person also belongs to one or more **organizations**, their relationship to each
  organization gives them access to that organization's foundation(s). Each one may read from, and write
  back to, a *different* database.
- The person sees all their foundations in one place. Where possible, they define each one through the
  Salt Basin steps, and Salt Basin runs both the **setup definition** and the **release process**.
- The database must stay flexible and keep evolving **without losing audit history**.

## 1. How a rod stays flexible without losing history

Treat every rod as four layers. Only the bottom two are ever rewritten.

| Layer | What it holds | Can it change? | Where |
|---|---|---|---|
| **Identity** | The rod's id, type and owner (person or organization) | Never. A rod is *retired*, never deleted. | `journey_data_rods` row |
| **History** | Every change ever made: what changed, before and after, who or what did it, through which connection, when it was recorded and when it happened in the source system | Append only. Nothing is updated or deleted. | `journey_rod_events` |
| **Definition** | The foundation's answers, mappings and connections, as numbered versions | A new version is added; old versions stay | Snapshots inside `definition_published` events |
| **Current state** | Stage, score, metadata as they are *now* | Rewritten freely, because it can be rebuilt from history | `journey_data_rods` columns + `metadata` |

How the database evolves:
- **New kinds of thing** become new `rod_type`s, event types, Atom definitions or Tributary entries.
  Existing meaning is never changed in place.
- **New facts about an existing thing** become additive columns or new `metadata` keys, stamped with
  `schemaVersion`.
- **Data that arrived under an old definition** stays tagged with the definition version it was read
  under, so a newer definition never quietly reinterprets it.

Four rules make this hold:
1. **One write path.** Every change to a rod goes through one helper, `applyRodChange(rodId, patch, {
   actor, reason, connectionId, effectiveAt })`. It updates the row *and* appends the event in the same
   transaction. No code updates a rod row directly.
2. **Supersede, don't delete.** Evidence that is corrected or no longer true gets a new row that points
   back to it (`lineage_parent_id`, which already exists). The old row is marked superseded, not removed.
3. **Retire, don't delete.** Rods end with a `rod_retired` event and a `retired` stage. Their history
   stays readable.
4. **Two clocks.** `created_at` is when Salt Basin recorded something; `effectiveAt` is when it happened in
   the source system. Late or replayed syncs then never rewrite the timeline.

## 2. Many foundations per person

A foundation is identified by its **owner** plus a **foundation key** that is unique within that owner.

| Foundation | Owner | Example key | Data source | Who can define it |
|---|---|---|---|---|
| Personal career | The person (`user_id`, no org) | `career` | Salt Basin's own Career Master | The person |
| Personal workspace | The person (`user_id`, no org) | `consulting-asana` | The person's own connected tool | The person |
| Organization foundation | The organization (`org_id`, no user) | `delivery-jira`, `revenue-salesforce` | The organization's connection | Org admins (by default) |
| Person-in-organization | Person + organization (`user_id` + `org_id`) | `my-team-board` | An org connection, with the person's own view | The person, within what the org allows |

**Owning a foundation is not the same as having access to it.** The person's "My foundations" list
contains:
- every foundation they own, plus
- every organization foundation they can reach through `org_memberships`, according to their role there.

Role → permission is a configuration row, not code. Proposed defaults:

| Role | View | Add data | Change definition | Run releases | Approve write-back |
|---|---|---|---|---|---|
| admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| member | ✓ | ✓ | — | — | — |
| viewer | ✓ | — | — | — | — |

**When a person leaves an organization**, their access ends. Their personal foundations stay with them.
The organization's foundation and its history stay with the organization. Neither side loses audit
history.

Database change needed:
- Exclude `project_foundation` from `idx_rods_user_type` / `idx_rods_user_org_type`, as already done for
  opportunity rods.
- Add one partial unique index on `(owner, metadata->>'foundationKey')` for `project_foundation`. This
  follows the `scenarioKey` precedent.

## 3. Reading from and writing back to each database

Each foundation names its connection:
- an `oauth_connections` row (`profile_scope` personal or organization, `profile_id`, `allow_write`), and
- a `data_ports` entry describing that system's objects and fields.

- **Reading:** each sync appends `source_synced` (connection, cursor, counts, `effectiveAt` range).
- **Writing back:** only when the connection has `allow_write` on. Every write goes through these events:
  1. `writeback_proposed`
  2. `writeback_approved` (by someone with that permission)
  3. `writeback_sent`
  4. `writeback_confirmed` (with the external record id and before/after values), or `writeback_failed`
     (with the reason)

  A write-back that fails is shown as failed, never as done.

## 4. Salt Basin runs both setup and release, per foundation

- **Setup:** each foundation goes through the seven mapping questions on its own. Its answers are
  definition versions on its rod.
- **Release:** each foundation's release board reads its own answers: what a feature, a round and a bug
  are, what needs a business decision, and the fix-attempt limit. Precedence is *foundation answer →
  platform default* (`release_intelligence_rules`).
- Release records gain an additive `foundation_rod_id` column. One person can then see the releases of
  every foundation they have access to, each with its own rules.

## 5. Gaps found in today's code (would lose history)

| # | Gap | Where | Proposed fix |
|---|---|---|---|
| G1 | Deleting a rod, or the user who owns it, also deletes all of that rod's events | `journey_rod_events.rod_id … ON DELETE CASCADE`; `journey_data_rods.user_id … ON DELETE CASCADE` | Rods are retired, never deleted. Add a database trigger that refuses UPDATE/DELETE on `journey_rod_events`. Account deletion needs an owner decision (question 1). |
| G2 | Evidence rows are physically deleted when a Career Master entry is edited or removed, or when a person corrects an atom | `careerAtomMigration.js` `syncSingleEntry` / `removeEntryEvidence`; `documentAtomSync.js` correction path | Supersede instead: additive `superseded_at` / `superseded_by_id` on `journey_rod_evidence`, and readers filter to the current rows. |
| G3 | About 14 places update a rod row directly, several with no event, so those changes leave no history | e.g. `memberProvisioning.js` (onboarding email status, first login), `opportunityOutputs.js` (metadata), `coverLetterAutoDraft.js` | Route all of them through `applyRodChange()`. |
| G4 | Only one foundation per person and one per person-in-organization | unique indexes in `db.js` | See section 2. |
| G5 | A member with no organization can't own a data source | `data_ports` has `org_id` only | Additive `owner_user_id`. |
| G6 | OAuth routes still write the legacy `member_oauth_connections`, which has no profile scope or `allow_write` | `server/routes/oauth.js` (noted in CLAUDE.md) | Move to `oauth_connections` before any write-back is built. |

New tables: **none**. Changes are:
- additive columns: `data_ports.owner_user_id`, `journey_rod_evidence.superseded_at` /
  `superseded_by_id`, `release_records.foundation_rod_id`
- one index change, one append-only trigger
- one shared write helper

## 6. Seeds: the entry point for anything new

Owner direction, 2026-10-09 (replaces v0.2's "seeds below features"):
- A **seed** is a raw entry of anything new or unassigned, almost like a lead. It is the **entry point
  event**.
- "Planting a seed" means putting it into Salt Basin.
- The website helps the person take a seed and **grow** it, **expand** it, **report** on it and **audit**
  it.
- The **career foundation** is where a person first learns this, by planting seeds while building their
  career foundation.
- People then **set up agents that plant seeds** for them. The person reviews and nurtures those seeds.

### The life of a seed

```
plant ─▶ review ─▶ nurture ─▶ grow into something real ─▶ report / audit
  │         │                     │
  │         ├─ merge (duplicate)  ├─ Career Master entry or skill evidence
  │         └─ set aside          ├─ tracked career opportunity
  │                               ├─ feature (in a release foundation)
  └─ by the person, an agent,     ├─ another foundation's data
     or an import                 └─ two or more new seeds (split)
```

| Stage | What happens | What is written (nothing is ever deleted) |
|---|---|---|
| **Planted** | Anything is entered: typed text, pasted notes, an uploaded document, a link. No type or destination is needed yet. | One `journey_rod_evidence` row, Atom key `seed`, on the foundation where it was planted, plus a `seed_planted` event. Value: `{ seedId, raw, attachments, kind (may be empty), plantedBy: { type: person \| agent \| import, id }, sourceRef }`. Uses the existing `source_tier` and `confidence` columns. |
| **Reviewed** | The person accepts it, merges it into an earlier seed (a duplicate), or sets it aside. Seeds planted by an agent always start here, waiting for the person. | `seed_reviewed` event with the decision. A merge points to the surviving seed, like `leads.merged_into_id` (same convention, not the same table). |
| **Nurtured** | The seed gets richer: Salt Basin asks follow-up questions (when, where, outcome, proof), the person answers, and evidence is attached. | Each addition is a new evidence row with `lineage_parent_id` → the seed, plus a `seed_nurtured` event. |
| **Grown** | The person chooses what the seed becomes. The new thing is created through the path that already exists for it (e.g. `createCareerOpportunity`, the Career Master CRUD that syncs to the Career Channel Rod). | New rows or rods that point back to the seed (`lineage_parent_id` or `metadata.seedId`), plus a `seed_grew` event naming what was created. The seed stays. One seed can grow into several things. |
| **Reported / audited** | For any seed: everything it grew into, who planted it, and every step since. For any outcome (a résumé line, an opportunity, a feature): the seed it came from. | Read from the events and lineage. Nothing extra is stored. |

**What a seed can grow into is a registry, not code.**
- `server/lib/seedGrowthRegistry.js` lists each target with its label, the existing create function it
  calls, the fields it needs from the seed, and who may approve it.
- Adding a new kind of outcome is a new entry, like `TRIBUTARY_TYPES`.

### The career foundation is where people learn it

Every member has a personal career foundation, with or without an organization. Their first experience
after logging in:

1. **Plant your first seed.** One box: "Tell us about something you did, want, or are working on." Typing,
   pasting or uploading (e.g. an old résumé) all count. No form to fill in.
2. **See it in your seed bank.** The seed appears in the career foundation's scene as a seed in the
   ground, with its stage shown.
3. **Nurture it.** Salt Basin asks the two or three questions that would make it usable ("When was this?
   What changed because of it?"). Rules ask first; the language model is used only when the rules can't,
   the same order the cover-letter agent already uses.
4. **Grow it.** Salt Basin suggests what it could become ("This looks like a job entry with two skills").
   The person confirms, and their Career Master fills in. The foundation's rollups update from real data
   only, never invented.
5. **Set up planting agents.** Once the person has grown a few seeds themselves, they can turn on agents
   that plant seeds for them. Examples:
   - The Career Researcher plants matching roles weekly.
   - An evidence agent plants achievements it finds in uploaded documents.
6. **Review and nurture what agents plant.** Agent seeds arrive in a review queue, labelled with the agent
   that planted them and why. An agent can plant, but **only the person can grow a seed**.
7. **Watch the garden.** A report shows:
   - seeds planted by the person vs by agents
   - how many were reviewed, grown or set aside
   - what each one became

   Counts come from events. Anything not recorded shows as "not recorded".

The same mechanics then carry over to every other foundation. In a release foundation, a seed can grow
into a feature. In an organization foundation, a seed can grow into that organization's records,
including written back to its database (section 3).

### Fit with the platform

- **Agents** reuse `agent_definitions` and `agent_schedules` (cadence and trigger mode already exist).
- **Agent-planted seeds** carry `plantedBy.type = 'agent'` and always need a person's review. This is
  enforced in the one seed write path; no sandboxing is claimed (Agent Boundary gap, recorded as before).
- **Human-vs-agent attribution** comes for free from `plantedBy` and the events, and feeds Contribution
  Intelligence.
- **Usage tracking:** a new `SALT_BASIN_TRACKED_INTERACTIONS.seeds` entry (`seed_plant`, `seed_review`,
  `seed_grow`).
- No new tables. Depends on gap G2 (supersede instead of delete).

### Features still need an approval

- Planting no longer means approving a feature.
- In a release foundation, a feature is still **approved** before work starts. Its approval rule (e.g.
  "grown from at least one idea or user story, with at least one task with acceptance criteria") is part
  of that foundation's definition.
- The approval goes through the existing approval gate.

## Questions for the owner (needs a business decision)

1. **Account deletion vs audit history.** When someone deletes their account, should Salt Basin keep their
   history with personal details removed (anonymized), or erase it completely? Some privacy laws require
   erasure on request, so this needs your decision and possibly legal advice.
2. **Career data from organization work.** Can a person copy evidence from an organization foundation
   (e.g. "shipped feature X at Org A") into their personal career foundation? If yes, who approves: the
   person alone, or an org admin too?
3. **Role defaults.** Are the role → permission defaults in section 2 right? Should an organization be
   able to change them for itself?
4. **Write-back approval.** Should every write-back to an outside database need a person's approval, or
   may an organization allow some fields to be written automatically?
5. **Organizations with several databases.** Should an organization use one foundation per database
   (`delivery-jira`, `revenue-salesforce`), or one foundation that combines several connections?
6. **Where a seed lands.** When a person with several foundations plants a seed, should it go to
   their career foundation by default, or should Salt Basin ask which foundation each time?
7. **What agents may do.** Agents can plant seeds. Can they also nurture (add follow-up evidence) without
   asking, or only plant? Should each agent have a weekly limit on how many seeds it plants?
8. **Set-aside seeds.** Should seeds that were set aside stay visible forever under a "Set aside" filter
   (proposed, for the audit trail), or be hidden after a while?
9. **Feature approval rule.** Is the default rule for approving a feature in a release foundation "at
   least one idea or user story, plus at least one task with acceptance criteria"? Should each foundation
   be able to set its own rule?
10. **Duplicates.** When Salt Basin spots a likely duplicate seed, should it suggest a merge for the person
    to confirm (proposed), or merge it automatically?
