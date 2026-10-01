# Database — `nrm` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## nrm_contact_groups

Element `TE-DB-nrm_contact_groups` · declared at `server/db.js:2755` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `name` | text | NOT NULL |  |
| 3 | `description` | text | yes |  |
| 4 | `owner_user_id` | bigint | yes |  |
| 5 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| nrm_contact_groups_owner_user_id_fkey | foreign key | `FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE` |
| nrm_contact_groups_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| nrm_contact_groups_pkey | `UNIQUE btree (id)` |

## nrm_contacts

Element `TE-DB-nrm_contacts` · declared at `server/db.js:2731` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `user_id` | bigint | yes |  |
| 3 | `first_name` | text | yes |  |
| 4 | `last_name` | text | yes |  |
| 5 | `email` | text | yes |  |
| 6 | `org_name` | text | yes |  |
| 7 | `role_title` | text | yes |  |
| 8 | `relationship_type` | text | NOT NULL | `'contact'::text` |
| 9 | `opted_in` | boolean | NOT NULL | `false` |
| 10 | `contact_group_ids` | _text | yes |  |
| 11 | `domain_refs` | _text | yes |  |
| 12 | `notes` | text | yes |  |
| 13 | `last_contacted_at` | bigint | yes |  |
| 14 | `owner_user_id` | bigint | yes |  |
| 15 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 16 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| nrm_contacts_owner_user_id_fkey | foreign key | `FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| nrm_contacts_pkey | primary key | `PRIMARY KEY (id)` |
| nrm_contacts_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_nrm_contacts_owner | `btree (owner_user_id)` |
| idx_nrm_contacts_user | `btree (user_id) WHERE (user_id IS NOT NULL)` |
| nrm_contacts_pkey | `UNIQUE btree (id)` |

## nrm_reference_requests

Element `TE-DB-nrm_reference_requests` · declared at `server/db.js:2766` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `requester_name` | text | NOT NULL |  |
| 3 | `requester_email` | text | NOT NULL |  |
| 4 | `requester_org` | text | yes |  |
| 5 | `target_member_user_id` | bigint | yes |  |
| 6 | `context` | text | yes |  |
| 7 | `status` | text | NOT NULL | `'new'::text` |
| 8 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 9 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| nrm_reference_requests_pkey | primary key | `PRIMARY KEY (id)` |
| nrm_reference_requests_target_member_user_id_fkey | foreign key | `FOREIGN KEY (target_member_user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_nrm_ref_req_status | `btree (status, created_at DESC)` |
| idx_nrm_ref_req_target | `btree (target_member_user_id)` |
| nrm_reference_requests_pkey | `UNIQUE btree (id)` |
