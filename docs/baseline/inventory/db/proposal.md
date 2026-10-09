# Database — `proposal` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## proposal_approval_actions

Element `TE-DB-proposal_approval_actions` · declared at `server/db.js:1406` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('proposal_approval_actions_id_seq'::regclass)` |
| 2 | `proposal_version_id` | bigint | NOT NULL |  |
| 3 | `action` | text | NOT NULL |  |
| 4 | `actor_user_id` | bigint | yes |  |
| 5 | `rationale` | text | yes |  |
| 6 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| proposal_approval_actions_action_check | check | `CHECK ((action = ANY (ARRAY['requested'::text, 'approved'::text, 'rejected'::text])))` |
| proposal_approval_actions_actor_user_id_fkey | foreign key | `FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| proposal_approval_actions_pkey | primary key | `PRIMARY KEY (id)` |
| proposal_approval_actions_proposal_version_id_fkey | foreign key | `FOREIGN KEY (proposal_version_id) REFERENCES proposal_versions(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| proposal_approval_actions_pkey | `UNIQUE btree (id)` |

## proposal_collaborators

Element `TE-DB-proposal_collaborators` · declared at `server/db.js:1352` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('proposal_collaborators_id_seq'::regclass)` |
| 2 | `proposal_version_id` | bigint | NOT NULL |  |
| 3 | `user_id` | bigint | NOT NULL |  |
| 4 | `rights` | jsonb | NOT NULL | `'["view", "comment"]'::jsonb` |
| 5 | `notified_at` | bigint | yes |  |
| 6 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| proposal_collaborators_pkey | primary key | `PRIMARY KEY (id)` |
| proposal_collaborators_proposal_version_id_fkey | foreign key | `FOREIGN KEY (proposal_version_id) REFERENCES proposal_versions(id) ON DELETE CASCADE` |
| proposal_collaborators_proposal_version_id_user_id_key | unique | `UNIQUE (proposal_version_id, user_id)` |
| proposal_collaborators_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| proposal_collaborators_pkey | `UNIQUE btree (id)` |
| proposal_collaborators_proposal_version_id_user_id_key | `UNIQUE btree (proposal_version_id, user_id)` |

## proposal_contracts

Element `TE-DB-proposal_contracts` · declared at `server/db.js:1394` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('proposal_contracts_id_seq'::regclass)` |
| 2 | `proposal_version_id` | bigint | NOT NULL |  |
| 3 | `rod_id` | bigint | NOT NULL |  |
| 4 | `status` | text | NOT NULL | `'draft'::text` |
| 5 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 6 | `commercial_terms` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `performance_obligations` | jsonb | NOT NULL | `'[]'::jsonb` |
| 8 | `created_by` | bigint | yes |  |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| proposal_contracts_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| proposal_contracts_pkey | primary key | `PRIMARY KEY (id)` |
| proposal_contracts_proposal_version_id_fkey | foreign key | `FOREIGN KEY (proposal_version_id) REFERENCES proposal_versions(id) ON DELETE RESTRICT` |
| proposal_contracts_proposal_version_id_key | unique | `UNIQUE (proposal_version_id)` |
| proposal_contracts_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE RESTRICT` |
| proposal_contracts_status_check | check | `CHECK ((status = ANY (ARRAY['draft'::text, 'review'::text, 'approved'::text, 'executed'::text])))` |

**Indexes**

| Name | Definition |
|---|---|
| proposal_contracts_pkey | `UNIQUE btree (id)` |
| proposal_contracts_proposal_version_id_key | `UNIQUE btree (proposal_version_id)` |

## proposal_delivery_emails

Element `TE-DB-proposal_delivery_emails` · declared at `server/db.js:1377` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('proposal_delivery_emails_id_seq'::regclass)` |
| 2 | `proposal_version_id` | bigint | NOT NULL |  |
| 3 | `recipient_user_id` | bigint | NOT NULL |  |
| 4 | `to_email` | text | NOT NULL |  |
| 5 | `provider_status` | text | NOT NULL |  |
| 6 | `provider_id` | text | yes |  |
| 7 | `sent_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| proposal_delivery_emails_pkey | primary key | `PRIMARY KEY (id)` |
| proposal_delivery_emails_proposal_version_id_fkey | foreign key | `FOREIGN KEY (proposal_version_id) REFERENCES proposal_versions(id) ON DELETE CASCADE` |
| proposal_delivery_emails_recipient_user_id_fkey | foreign key | `FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| proposal_delivery_emails_pkey | `UNIQUE btree (id)` |

## proposal_feedback_entries

Element `TE-DB-proposal_feedback_entries` · declared at `server/db.js:1361` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('proposal_feedback_entries_id_seq'::regclass)` |
| 2 | `proposal_version_id` | bigint | NOT NULL |  |
| 3 | `user_id` | bigint | NOT NULL |  |
| 4 | `component_key` | text | NOT NULL |  |
| 5 | `visual_layer_key` | text | yes |  |
| 6 | `entry_type` | text | NOT NULL | `'comment'::text` |
| 7 | `body` | text | NOT NULL |  |
| 8 | `context` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `status` | text | NOT NULL | `'draft'::text` |
| 10 | `triage` | jsonb | NOT NULL | `'{}'::jsonb` |
| 11 | `published_at` | bigint | yes |  |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| proposal_feedback_entries_entry_type_check | check | `CHECK ((entry_type = ANY (ARRAY['comment'::text, 'question'::text, 'change_request'::text])))` |
| proposal_feedback_entries_pkey | primary key | `PRIMARY KEY (id)` |
| proposal_feedback_entries_proposal_version_id_fkey | foreign key | `FOREIGN KEY (proposal_version_id) REFERENCES proposal_versions(id) ON DELETE CASCADE` |
| proposal_feedback_entries_status_check | check | `CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'triaged'::text, 'resolved'::text])))` |
| proposal_feedback_entries_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_proposal_feedback_version | `btree (proposal_version_id, status, updated_at DESC)` |
| proposal_feedback_entries_pkey | `UNIQUE btree (id)` |

## proposal_feedback_reminders

Element `TE-DB-proposal_feedback_reminders` · declared at `server/db.js:1386` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('proposal_feedback_reminders_id_seq'::regclass)` |
| 2 | `proposal_version_id` | bigint | NOT NULL |  |
| 3 | `user_id` | bigint | NOT NULL |  |
| 4 | `reminder_at` | bigint | NOT NULL |  |
| 5 | `channel_summary` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| proposal_feedback_reminders_pkey | primary key | `PRIMARY KEY (id)` |
| proposal_feedback_reminders_proposal_version_id_fkey | foreign key | `FOREIGN KEY (proposal_version_id) REFERENCES proposal_versions(id) ON DELETE CASCADE` |
| proposal_feedback_reminders_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_proposal_feedback_reminders | `btree (proposal_version_id, user_id, reminder_at DESC)` |
| proposal_feedback_reminders_pkey | `UNIQUE btree (id)` |

## proposal_versions

Element `TE-DB-proposal_versions` · declared at `server/db.js:1334` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('proposal_versions_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `version_number` | integer | NOT NULL |  |
| 4 | `status` | text | NOT NULL | `'draft'::text` |
| 5 | `proposal_class` | text | NOT NULL | `'budgetary'::text` |
| 6 | `snapshot` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `approval_caveat` | text | yes |  |
| 8 | `created_by` | bigint | yes |  |
| 9 | `approved_by` | bigint | yes |  |
| 10 | `approved_at` | bigint | yes |  |
| 11 | `delivered_at` | bigint | yes |  |
| 12 | `archived_at` | bigint | yes |  |
| 13 | `created_at` | bigint | NOT NULL |  |
| 14 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| proposal_versions_approved_by_fkey | foreign key | `FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL` |
| proposal_versions_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| proposal_versions_pkey | primary key | `PRIMARY KEY (id)` |
| proposal_versions_proposal_class_check | check | `CHECK ((proposal_class = ANY (ARRAY['budgetary'::text, 'final'::text])))` |
| proposal_versions_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| proposal_versions_rod_id_version_number_key | unique | `UNIQUE (rod_id, version_number)` |
| proposal_versions_status_check | check | `CHECK ((status = ANY (ARRAY['draft'::text, 'approved'::text, 'delivered'::text, 'archived'::text, 'contracted'::text])))` |

**Indexes**

| Name | Definition |
|---|---|
| idx_proposal_versions_rod | `btree (rod_id, version_number DESC)` |
| proposal_versions_pkey | `UNIQUE btree (id)` |
| proposal_versions_rod_id_version_number_key | `UNIQUE btree (rod_id, version_number)` |
