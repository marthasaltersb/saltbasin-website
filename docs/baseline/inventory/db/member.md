# Database — `member` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## member_agent_messages

Element `TE-DB-member_agent_messages` · declared at `server/db.js:1503` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_agent_messages_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `module_scope` | text | NOT NULL |  |
| 4 | `role` | text | NOT NULL |  |
| 5 | `content` | text | NOT NULL |  |
| 6 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_agent_messages_pkey | primary key | `PRIMARY KEY (id)` |
| member_agent_messages_role_check | check | `CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))` |
| member_agent_messages_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_member_agent_messages_scope | `btree (user_id, module_scope, created_at DESC)` |
| member_agent_messages_pkey | `UNIQUE btree (id)` |

## member_capability_allocations

Element `TE-DB-member_capability_allocations` · declared at `server/db.js:1473` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_capability_allocations_id_seq'::regclass)` |
| 2 | `org_id` | bigint | NOT NULL |  |
| 3 | `user_id` | bigint | NOT NULL |  |
| 4 | `capability_key` | text | NOT NULL |  |
| 5 | `permission_level` | text | NOT NULL |  |
| 6 | `allocated_by` | bigint | yes |  |
| 7 | `created_at` | bigint | NOT NULL |  |
| 8 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_capability_allocations_allocated_by_fkey | foreign key | `FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE SET NULL` |
| member_capability_allocations_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| member_capability_allocations_org_id_user_id_capability_key_key | unique | `UNIQUE (org_id, user_id, capability_key)` |
| member_capability_allocations_permission_level_check | check | `CHECK ((permission_level = ANY (ARRAY['view'::text, 'collaborate'::text, 'configure'::text, 'admin'::text])))` |
| member_capability_allocations_pkey | primary key | `PRIMARY KEY (id)` |
| member_capability_allocations_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| member_capability_allocations_org_id_user_id_capability_key_key | `UNIQUE btree (org_id, user_id, capability_key)` |
| member_capability_allocations_pkey | `UNIQUE btree (id)` |

## member_configs

Element `TE-DB-member_configs` · declared at `server/db.js:1555` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `user_id` | bigint | NOT NULL |  |
| 2 | `kind` | text | NOT NULL |  |
| 3 | `data` | text | NOT NULL |  |
| 4 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_configs_kind_check | check | `CHECK ((kind = ANY (ARRAY['draft'::text, 'published'::text])))` |
| member_configs_pkey | primary key | `PRIMARY KEY (user_id, kind)` |
| member_configs_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_member_configs_published_user | `btree (user_id) WHERE (kind = 'published'::text)` |
| member_configs_pkey | `UNIQUE btree (user_id, kind)` |

## member_connections

Element `TE-DB-member_connections` · declared at `server/db.js:3169` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_connections_id_seq'::regclass)` |
| 2 | `requester_id` | bigint | NOT NULL |  |
| 3 | `recipient_id` | bigint | NOT NULL |  |
| 4 | `status` | text | NOT NULL | `'pending'::text` |
| 5 | `message` | text | yes |  |
| 6 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 7 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_connections_pkey | primary key | `PRIMARY KEY (id)` |
| member_connections_recipient_id_fkey | foreign key | `FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE` |
| member_connections_requester_id_fkey | foreign key | `FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE` |
| member_connections_requester_id_recipient_id_key | unique | `UNIQUE (requester_id, recipient_id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_mc_recipient | `btree (recipient_id)` |
| idx_mc_requester | `btree (requester_id)` |
| member_connections_pkey | `UNIQUE btree (id)` |
| member_connections_requester_id_recipient_id_key | `UNIQUE btree (requester_id, recipient_id)` |

## member_feature_grants

Element `TE-DB-member_feature_grants` · declared at `server/db.js:2922` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_feature_grants_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `feature_key` | text | NOT NULL |  |
| 4 | `is_active` | boolean | NOT NULL | `true` |
| 5 | `expires_at` | bigint | yes |  |
| 6 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_feature_grants_pkey | primary key | `PRIMARY KEY (id)` |
| member_feature_grants_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_member_feature_grants_user | `btree (user_id)` |
| member_feature_grants_pkey | `UNIQUE btree (id)` |

## member_json_store

Element `TE-DB-member_json_store` · declared at `server/db.js:2521` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `user_id` | bigint | NOT NULL |  |
| 2 | `key` | text | NOT NULL |  |
| 3 | `data` | text | NOT NULL | `'{}'::text` |
| 4 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_json_store_pkey | primary key | `PRIMARY KEY (user_id, key)` |
| member_json_store_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_member_json_store_user | `btree (user_id)` |
| member_json_store_pkey | `UNIQUE btree (user_id, key)` |

## member_messages

Element `TE-DB-member_messages` · declared at `server/db.js:3183` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_messages_id_seq'::regclass)` |
| 2 | `sender_id` | bigint | NOT NULL |  |
| 3 | `recipient_id` | bigint | NOT NULL |  |
| 4 | `body` | text | NOT NULL |  |
| 5 | `read_at` | bigint | yes |  |
| 6 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_messages_pkey | primary key | `PRIMARY KEY (id)` |
| member_messages_recipient_id_fkey | foreign key | `FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE` |
| member_messages_sender_id_fkey | foreign key | `FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_mm_recipient | `btree (recipient_id, created_at DESC)` |
| idx_mm_sender | `btree (sender_id, created_at DESC)` |
| member_messages_pkey | `UNIQUE btree (id)` |

## member_oauth_connections

Element `TE-DB-member_oauth_connections` · declared at `server/db.js:2186` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_oauth_connections_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `provider` | text | NOT NULL |  |
| 4 | `external_id` | text | yes |  |
| 5 | `label` | text | yes |  |
| 6 | `access_token_enc` | text | NOT NULL |  |
| 7 | `refresh_token_enc` | text | yes |  |
| 8 | `token_expires_at` | bigint | yes |  |
| 9 | `scopes` | text | yes |  |
| 10 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 11 | `allow_write` | boolean | NOT NULL | `false` |
| 12 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 13 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_oauth_connections_pkey | primary key | `PRIMARY KEY (id)` |
| member_oauth_connections_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| member_oauth_connections_user_id_provider_key | unique | `UNIQUE (user_id, provider)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_legacy_oauth_provider | `btree (provider)` |
| idx_legacy_oauth_user | `btree (user_id)` |
| member_oauth_connections_pkey | `UNIQUE btree (id)` |
| member_oauth_connections_user_id_provider_key | `UNIQUE btree (user_id, provider)` |

## member_profiles

Element `TE-DB-member_profiles` · declared at `server/db.js:343` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `user_id` | bigint | NOT NULL |  |
| 2 | `slug` | text | NOT NULL |  |
| 3 | `draft` | text | NOT NULL |  |
| 4 | `published` | text | yes |  |
| 5 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 6 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 7 | `opted_in_network` | boolean | NOT NULL | `false` |
| 8 | `network_bio` | text | yes |  |
| 9 | `visibility_mode` | text | NOT NULL | `'unlisted'::text` |
| 10 | `site_password_hash` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_profiles_pkey | primary key | `PRIMARY KEY (user_id)` |
| member_profiles_slug_key | unique | `UNIQUE (slug)` |
| member_profiles_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| member_profiles_pkey | `UNIQUE btree (user_id)` |
| member_profiles_slug_key | `UNIQUE btree (slug)` |

## member_site_unlocks

Element `TE-DB-member_site_unlocks` · declared at `server/db.js:2849` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `token` | text | NOT NULL |  |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `expires_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_site_unlocks_pkey | primary key | `PRIMARY KEY (token)` |
| member_site_unlocks_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_msu_user | `btree (user_id)` |
| member_site_unlocks_pkey | `UNIQUE btree (token)` |

## member_sites

Element `TE-DB-member_sites` · declared at `server/db.js:1547` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `user_id` | bigint | NOT NULL |  |
| 2 | `kind` | text | NOT NULL |  |
| 3 | `data` | text | NOT NULL |  |
| 4 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_sites_kind_check | check | `CHECK ((kind = ANY (ARRAY['draft'::text, 'published'::text])))` |
| member_sites_pkey | primary key | `PRIMARY KEY (user_id, kind)` |
| member_sites_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| member_sites_pkey | `UNIQUE btree (user_id, kind)` |

## member_subscription_seats

Element `TE-DB-member_subscription_seats` · declared at `server/db.js:2913` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_subscription_seats_id_seq'::regclass)` |
| 2 | `subscription_id` | bigint | NOT NULL |  |
| 3 | `user_id` | bigint | NOT NULL |  |
| 4 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_subscription_seats_pkey | primary key | `PRIMARY KEY (id)` |
| member_subscription_seats_subscription_id_fkey | foreign key | `FOREIGN KEY (subscription_id) REFERENCES member_subscriptions(id) ON DELETE CASCADE` |
| member_subscription_seats_subscription_id_user_id_key | unique | `UNIQUE (subscription_id, user_id)` |
| member_subscription_seats_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_subscription_seats_user | `btree (user_id)` |
| member_subscription_seats_pkey | `UNIQUE btree (id)` |
| member_subscription_seats_subscription_id_user_id_key | `UNIQUE btree (subscription_id, user_id)` |

## member_subscriptions

Element `TE-DB-member_subscriptions` · declared at `server/db.js:2894` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_subscriptions_id_seq'::regclass)` |
| 2 | `user_id` | bigint | yes |  |
| 3 | `sponsor_org_id` | bigint | yes |  |
| 4 | `offering_id` | text | NOT NULL |  |
| 5 | `status` | text | NOT NULL | `'trialing'::text` |
| 6 | `trial_started_at` | bigint | yes |  |
| 7 | `trial_ends_at` | bigint | yes |  |
| 8 | `current_period_starts_at` | bigint | yes |  |
| 9 | `current_period_ends_at` | bigint | yes |  |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_subscriptions_offering_id_fkey | foreign key | `FOREIGN KEY (offering_id) REFERENCES commerce_offerings(id) ON DELETE RESTRICT` |
| member_subscriptions_pkey | primary key | `PRIMARY KEY (id)` |
| member_subscriptions_sponsor_org_id_fkey | foreign key | `FOREIGN KEY (sponsor_org_id) REFERENCES organization_profiles(id) ON DELETE SET NULL` |
| member_subscriptions_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_member_subscriptions_user | `btree (user_id)` |
| idx_member_subscriptions_user_offering | `UNIQUE btree (user_id, offering_id) WHERE ((user_id IS NOT NULL) AND (sponsor_org_id IS NULL))` |
| member_subscriptions_pkey | `UNIQUE btree (id)` |

## member_templates

Element `TE-DB-member_templates` · declared at `server/db.js:1815` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('member_templates_id_seq'::regclass)` |
| 2 | `slug` | text | NOT NULL |  |
| 3 | `name` | text | NOT NULL |  |
| 4 | `archetype` | text | yes |  |
| 5 | `tagline` | text | yes |  |
| 6 | `description` | text | yes |  |
| 7 | `preview_image_url` | text | yes |  |
| 8 | `brand_kit` | text | yes |  |
| 9 | `pages_preset` | text | NOT NULL |  |
| 10 | `sort_order` | integer | NOT NULL | `0` |
| 11 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| member_templates_pkey | primary key | `PRIMARY KEY (id)` |
| member_templates_slug_key | unique | `UNIQUE (slug)` |

**Indexes**

| Name | Definition |
|---|---|
| member_templates_pkey | `UNIQUE btree (id)` |
| member_templates_slug_key | `UNIQUE btree (slug)` |
