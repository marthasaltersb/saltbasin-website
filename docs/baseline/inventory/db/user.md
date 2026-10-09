# Database — `user` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## user_authentication_routes

Element `TE-DB-user_authentication_routes` · declared at `server/db.js:1523` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('user_authentication_routes_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `route_type` | text | NOT NULL |  |
| 4 | `provider_key` | text | yes |  |
| 5 | `secret_enc` | text | yes |  |
| 6 | `enabled` | boolean | NOT NULL | `false` |
| 7 | `preferred` | boolean | NOT NULL | `false` |
| 8 | `org_id` | bigint | yes |  |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| user_authentication_routes_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| user_authentication_routes_pkey | primary key | `PRIMARY KEY (id)` |
| user_authentication_routes_route_type_check | check | `CHECK ((route_type = ANY (ARRAY['password'::text, 'totp'::text, 'sso'::text])))` |
| user_authentication_routes_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| user_authentication_routes_user_id_route_type_provider_key__key | unique | `UNIQUE (user_id, route_type, provider_key, org_id)` |

**Indexes**

| Name | Definition |
|---|---|
| user_authentication_routes_pkey | `UNIQUE btree (id)` |
| user_authentication_routes_user_id_route_type_provider_key__key | `UNIQUE btree (user_id, route_type, provider_key, org_id)` |

## user_emails

Element `TE-DB-user_emails` · declared at `server/db.js:1575` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('user_emails_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `email` | text | NOT NULL |  |
| 4 | `type` | text | NOT NULL | `'personal'::text` |
| 5 | `verified` | boolean | NOT NULL | `false` |
| 6 | `verification_code` | text | yes |  |
| 7 | `code_expires_at` | bigint | yes |  |
| 8 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| user_emails_email_key | unique | `UNIQUE (email)` |
| user_emails_pkey | primary key | `PRIMARY KEY (id)` |
| user_emails_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_user_emails_user | `btree (user_id)` |
| idx_user_emails_verified | `btree (email) WHERE (verified = true)` |
| user_emails_email_key | `UNIQUE btree (email)` |
| user_emails_pkey | `UNIQUE btree (id)` |

## user_password_history

Element `TE-DB-user_password_history` · declared at `server/db.js:1321` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('user_password_history_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `password_hash` | text | NOT NULL |  |
| 4 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| user_password_history_pkey | primary key | `PRIMARY KEY (id)` |
| user_password_history_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_user_password_history | `btree (user_id, created_at DESC)` |
| user_password_history_pkey | `UNIQUE btree (id)` |

## user_password_reset_preferences

Element `TE-DB-user_password_reset_preferences` · declared at `server/db.js:1328` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `user_id` | bigint | NOT NULL |  |
| 2 | `default_destinations` | jsonb | NOT NULL | `'["primary"]'::jsonb` |
| 3 | `ip_rules` | jsonb | NOT NULL | `'[]'::jsonb` |
| 4 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| user_password_reset_preferences_pkey | primary key | `PRIMARY KEY (user_id)` |
| user_password_reset_preferences_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| user_password_reset_preferences_pkey | `UNIQUE btree (user_id)` |

## user_tasks

Element `TE-DB-user_tasks` · declared at `server/db.js:5725` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('user_tasks_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `source_type` | text | NOT NULL |  |
| 4 | `source_id` | bigint | yes |  |
| 5 | `title` | text | NOT NULL |  |
| 6 | `detail` | text | yes |  |
| 7 | `status` | text | NOT NULL | `'open'::text` |
| 8 | `due_at` | bigint | yes |  |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `completed_at` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| user_tasks_pkey | primary key | `PRIMARY KEY (id)` |
| user_tasks_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| user_tasks_pkey | `UNIQUE btree (id)` |
