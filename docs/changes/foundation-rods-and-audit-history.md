# Foundation Rods and audit history: many foundations per person, no lost history

Version 0.2 (proposed design, not built) · 2026-10-09 · Status: **awaiting owner approval**

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-09 | Many foundations per person; audit-history model; gaps G1–G6 (commit 3e88ce5). |
| 0.2 | 2026-10-09 | Owner direction: **seeds** sit below features (section 6). |

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

## 6. Seeds below features

Owner direction, 2026-10-09:
- A **feature** is close to a capability.
- A **seed** is the original idea, a user story, or a tactical, detailed task.
- A feature can be linked to several seeds.
- Every feature goes through an approval to be **planted**, and planting needs a minimum set of seeds.
- Seeds are **evidence on a feature, not rods of their own**. They are still tracked, and a seed can be
  converted into a feature or linked to another feature.

```
Foundation rod
 ├─ seed bank: seeds not yet linked to any feature (evidence on the foundation rod)
 └─ Feature rod (a capability)     proposed ─▶ planted (approval + minimum seeds) ─▶ build … ─▶ passed
      ├─ seed: idea                "Members want to see release status in 3D"
      ├─ seed: user story          "As an org admin, I can see which features need a person"
      └─ seed: task                "Colour gems by status; acceptance: Passed gems are sage"
```

**How a seed is stored.**
- Each seed is one `journey_rod_evidence` row with Atom key `feature_seed`. Its value is
  `{ seedId, kind, title, detail, acceptance, sourceRef }`.
- `kind` is one of the foundation's seed kinds (default `idea`, `user_story`, `task`). Screen 1 of the
  foundation maps them to the outside system, e.g. Jira story and sub-task.
- `seedId` never changes, wherever the seed moves, so a seed can always be followed.
- No new table and no rod per seed.

**Where a seed lives.**
- Before it's linked to anything, a seed sits on its **foundation rod** (the seed bank).
- Every evidence row needs a rod, and the foundation is the natural home for ideas that haven't found a
  feature yet.

**What happens to a seed.** Every move is an event, and nothing is deleted.

| Action | What is written |
|---|---|
| Capture | Evidence on the foundation (or directly on a feature) + `seed_captured` event |
| Link to a feature | New evidence row on the feature with `lineage_parent_id` → the earlier row. The earlier row is marked superseded (gap G2's fix). Event `seed_linked` on both rods. |
| Move to another feature | Same as linking: new row on the new feature, old row superseded, `seed_moved` events on both features |
| Convert into a feature | A new feature rod is created; the seed becomes its first seed (same mechanism); event `seed_converted` |
| Retire | The row is marked superseded with reason; event `seed_retired`. Still visible in history. |

**Planting (the approval).**
- A feature starts as `proposed`. It moves to `planted` only when:
  1. its seeds meet the foundation's **planting rule**, and
  2. someone with the "approve planting" permission approves, through the existing approval gate
     (`useToolCategoryGate().run` → `assertReadyToFinalize`).
- The planting rule is part of the foundation's definition: an eighth answer, versioned like the other
  seven, never hard-coded.
- The `feature_planted` event records which seeds, at which versions, the approval was based on.

**Link to testing (proposal).**
- A task seed's acceptance criteria can become journey steps in the feature's training spec.
- A feature's test round then reports which seeds' steps passed. "Passed" still means every step passed.

**Depends on** gap G2 (supersede instead of delete). Without it, linking or moving a seed would erase its
earlier place.

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
6. **Planting minimum.** What is the default planting rule? A proposal to confirm or change: at least one
   idea **or** user story, plus at least one task with acceptance criteria. Should each foundation be able
   to set its own rule?
7. **One seed, several features.** Can one seed support several features at the same time (shared), or
   only one feature at a time (it moves)?
8. **Seeds added after planting.** If a seed is added to a feature that is already planted, does the
   feature need approving again?
9. **Who approves planting.** By default, foundation admins. Should the person who wrote the seeds be
   allowed to approve their own feature?

