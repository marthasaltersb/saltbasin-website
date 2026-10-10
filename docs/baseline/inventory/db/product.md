# Database — `product` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## product_feedback

Element `TE-DB-product_feedback` · declared at `server/db.js:4386` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('product_feedback_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `product_id` | text | yes |  |
| 4 | `category` | text | NOT NULL | `'idea'::text` |
| 5 | `message` | text | NOT NULL |  |
| 6 | `status` | text | NOT NULL | `'new'::text` |
| 7 | `score` | numeric | NOT NULL | `0` |
| 8 | `upvotes` | integer | NOT NULL | `0` |
| 9 | `routed_backlog_item_id` | bigint | yes |  |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| product_feedback_pkey | primary key | `PRIMARY KEY (id)` |
| product_feedback_routed_backlog_item_id_fkey | foreign key | `FOREIGN KEY (routed_backlog_item_id) REFERENCES backlog_items(id) ON DELETE SET NULL` |
| product_feedback_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_product_feedback_score | `btree (score DESC)` |
| idx_product_feedback_status | `btree (status)` |
| idx_product_feedback_user | `btree (user_id, created_at DESC)` |
| product_feedback_pkey | `UNIQUE btree (id)` |

## product_licenses

Element `TE-DB-product_licenses` · declared at `server/db.js:2061` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('product_licenses_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `org_id` | bigint | yes |  |
| 4 | `product_id` | text | NOT NULL |  |
| 5 | `tier` | text | NOT NULL | `'standard'::text` |
| 6 | `granted_by` | bigint | yes |  |
| 7 | `granted_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 8 | `expires_at` | bigint | yes |  |
| 9 | `is_active` | boolean | NOT NULL | `true` |
| 10 | `access_mode` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| product_licenses_granted_by_fkey | foreign key | `FOREIGN KEY (granted_by) REFERENCES users(id)` |
| product_licenses_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| product_licenses_pkey | primary key | `PRIMARY KEY (id)` |
| product_licenses_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_licenses_org | `btree (org_id)` |
| idx_licenses_product | `btree (product_id)` |
| idx_licenses_user | `btree (user_id)` |
| product_licenses_pkey | `UNIQUE btree (id)` |

## product_onboarding_runs

Element `TE-DB-product_onboarding_runs` · declared at `server/db.js:4367` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('product_onboarding_runs_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `product_id` | text | NOT NULL |  |
| 4 | `answers` | jsonb | NOT NULL | `'[]'::jsonb` |
| 5 | `status` | text | NOT NULL | `'in_progress'::text` |
| 6 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 7 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| product_onboarding_runs_pkey | primary key | `PRIMARY KEY (id)` |
| product_onboarding_runs_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_product_onboarding_runs_product | `btree (product_id)` |
| idx_product_onboarding_runs_user | `btree (user_id, created_at DESC)` |
| product_onboarding_runs_pkey | `UNIQUE btree (id)` |
