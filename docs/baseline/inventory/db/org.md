# Database — `org` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## org_configs

Element `TE-DB-org_configs` · declared at `server/db.js:2037` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `org_id` | bigint | NOT NULL |  |
| 2 | `kind` | text | NOT NULL |  |
| 3 | `data` | text | NOT NULL |  |
| 4 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| org_configs_kind_check | check | `CHECK ((kind = ANY (ARRAY['draft'::text, 'published'::text])))` |
| org_configs_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| org_configs_pkey | primary key | `PRIMARY KEY (org_id, kind)` |

**Indexes**

| Name | Definition |
|---|---|
| org_configs_pkey | `UNIQUE btree (org_id, kind)` |

## org_document_projections

Element `TE-DB-org_document_projections` · declared at `server/db.js:998` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('org_document_projections_id_seq'::regclass)` |
| 2 | `org_id` | bigint | NOT NULL |  |
| 3 | `parent_rod_id` | bigint | yes |  |
| 4 | `rod_relationship_type` | text | yes |  |
| 5 | `document_type` | text | NOT NULL |  |
| 6 | `title` | text | NOT NULL |  |
| 7 | `summary` | text | yes |  |
| 8 | `content` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `status` | text | NOT NULL | `'draft'::text` |
| 10 | `created_by` | bigint | yes |  |
| 11 | `created_at` | bigint | NOT NULL |  |
| 12 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| org_document_projections_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id)` |
| org_document_projections_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| org_document_projections_parent_rod_id_fkey | foreign key | `FOREIGN KEY (parent_rod_id) REFERENCES journey_data_rods(id) ON DELETE SET NULL` |
| org_document_projections_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_org_doc_projections_org | `btree (org_id, document_type)` |
| org_document_projections_pkey | `UNIQUE btree (id)` |

## org_memberships

Element `TE-DB-org_memberships` · declared at `server/db.js:2017` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('org_memberships_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `org_id` | bigint | NOT NULL |  |
| 4 | `role` | text | NOT NULL | `'member'::text` |
| 5 | `invited_by` | bigint | yes |  |
| 6 | `joined_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| org_memberships_invited_by_fkey | foreign key | `FOREIGN KEY (invited_by) REFERENCES users(id)` |
| org_memberships_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| org_memberships_pkey | primary key | `PRIMARY KEY (id)` |
| org_memberships_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| org_memberships_user_id_org_id_key | unique | `UNIQUE (user_id, org_id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_org_memberships_org | `btree (org_id)` |
| idx_org_memberships_user | `btree (user_id)` |
| org_memberships_pkey | `UNIQUE btree (id)` |
| org_memberships_user_id_org_id_key | `UNIQUE btree (user_id, org_id)` |

## org_sites

Element `TE-DB-org_sites` · declared at `server/db.js:2030` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `org_id` | bigint | NOT NULL |  |
| 2 | `kind` | text | NOT NULL |  |
| 3 | `data` | text | NOT NULL |  |
| 4 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| org_sites_kind_check | check | `CHECK ((kind = ANY (ARRAY['draft'::text, 'published'::text])))` |
| org_sites_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| org_sites_pkey | primary key | `PRIMARY KEY (org_id, kind)` |

**Indexes**

| Name | Definition |
|---|---|
| org_sites_pkey | `UNIQUE btree (org_id, kind)` |
