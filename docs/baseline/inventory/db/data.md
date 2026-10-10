# Database — `data` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## data_entitlements

Element `TE-DB-data_entitlements` · declared at `server/db.js:2077` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('data_entitlements_id_seq'::regclass)` |
| 2 | `license_id` | bigint | NOT NULL |  |
| 3 | `scope` | jsonb | NOT NULL | `'{}'::jsonb` |
| 4 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| data_entitlements_license_id_fkey | foreign key | `FOREIGN KEY (license_id) REFERENCES product_licenses(id) ON DELETE CASCADE` |
| data_entitlements_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| data_entitlements_pkey | `UNIQUE btree (id)` |

## data_ports

Element `TE-DB-data_ports` · declared at `server/db.js:670` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('data_ports_id_seq'::regclass)` |
| 2 | `port_key` | text | NOT NULL |  |
| 3 | `org_id` | bigint | yes |  |
| 4 | `name` | text | NOT NULL |  |
| 5 | `port_type` | text | NOT NULL | `'crm'::text` |
| 6 | `native_system_type` | text | yes |  |
| 7 | `environment` | text | NOT NULL | `'production'::text` |
| 8 | `query_mode` | text | NOT NULL | `'pull'::text` |
| 9 | `centralization_allowed` | boolean | NOT NULL | `true` |
| 10 | `policy` | jsonb | NOT NULL | `'{}'::jsonb` |
| 11 | `is_active` | boolean | NOT NULL | `true` |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| data_ports_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| data_ports_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| data_ports_pkey | `UNIQUE btree (id)` |
| idx_data_ports_key_global | `UNIQUE btree (port_key) WHERE (org_id IS NULL)` |
| idx_data_ports_key_org | `UNIQUE btree (port_key, org_id) WHERE (org_id IS NOT NULL)` |

## data_snapshots

Element `TE-DB-data_snapshots` · declared at `server/db.js:3102` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `entity_type` | text | NOT NULL |  |
| 3 | `entity_id` | text | NOT NULL |  |
| 4 | `snapshot_hash` | text | NOT NULL |  |
| 5 | `field_count` | integer | NOT NULL | `0` |
| 6 | `changed_count` | integer | NOT NULL | `0` |
| 7 | `triggered_by` | text | NOT NULL | `'manual'::text` |
| 8 | `author_id` | bigint | yes |  |
| 9 | `author_email` | text | yes |  |
| 10 | `captured_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| data_snapshots_author_id_fkey | foreign key | `FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL` |
| data_snapshots_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| data_snapshots_pkey | `UNIQUE btree (id)` |
| idx_ds_captured | `btree (captured_at DESC)` |
| idx_ds_entity | `btree (entity_type, entity_id, captured_at DESC)` |
