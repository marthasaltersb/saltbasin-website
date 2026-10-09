# Foundation Rods and audit history: many foundations per person, no lost history

Version 0.1 (proposed design, not built) · 2026-10-09 · Status: **awaiting owner approval**

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
