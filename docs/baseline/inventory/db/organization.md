# Database — `organization` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## organization_authentication_policies

Element `TE-DB-organization_authentication_policies` · declared at `server/db.js:1452` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `org_id` | bigint | NOT NULL |  |
| 2 | `allowed_routes` | jsonb | NOT NULL | `'["password", "totp"]'::jsonb` |
| 3 | `preferred_route` | text | yes |  |
| 4 | `sso_provider_key` | text | yes |  |
| 5 | `authenticator_label` | text | yes |  |
| 6 | `require_one_route` | boolean | NOT NULL | `true` |
| 7 | `updated_by` | bigint | yes |  |
| 8 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| organization_authentication_policies_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| organization_authentication_policies_pkey | primary key | `PRIMARY KEY (org_id)` |
| organization_authentication_policies_updated_by_fkey | foreign key | `FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| organization_authentication_policies_pkey | `UNIQUE btree (org_id)` |

## organization_profiles

Element `TE-DB-organization_profiles` · declared at `server/db.js:293` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('organization_profiles_id_seq'::regclass)` |
| 2 | `slug` | text | NOT NULL |  |
| 3 | `name` | text | NOT NULL |  |
| 4 | `org_type` | text | NOT NULL | `'llc'::text` |
| 5 | `description` | text | yes |  |
| 6 | `logo_url` | text | yes |  |
| 7 | `website` | text | yes |  |
| 8 | `industry` | text | yes |  |
| 9 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 10 | `originating_lead_id` | bigint | yes |  |
| 11 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 12 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 13 | `email_domain` | text | yes |  |
| 14 | `segment` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| organization_profiles_originating_lead_id_fkey | foreign key | `FOREIGN KEY (originating_lead_id) REFERENCES leads(id) ON DELETE SET NULL` |
| organization_profiles_pkey | primary key | `PRIMARY KEY (id)` |
| organization_profiles_slug_key | unique | `UNIQUE (slug)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_org_profiles_email_domain | `btree (email_domain) WHERE (email_domain IS NOT NULL)` |
| idx_org_profiles_originating_lead | `btree (originating_lead_id)` |
| idx_org_profiles_slug | `btree (slug)` |
| organization_profiles_pkey | `UNIQUE btree (id)` |
| organization_profiles_slug_key | `UNIQUE btree (slug)` |

## organization_sso_login_states

Element `TE-DB-organization_sso_login_states` · declared at `server/db.js:1462` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `token_hash` | text | NOT NULL |  |
| 2 | `org_id` | bigint | NOT NULL |  |
| 3 | `user_id` | bigint | NOT NULL |  |
| 4 | `provider_key` | text | NOT NULL |  |
| 5 | `nonce` | text | NOT NULL |  |
| 6 | `expires_at` | bigint | NOT NULL |  |
| 7 | `consumed_at` | bigint | yes |  |
| 8 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| organization_sso_login_states_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| organization_sso_login_states_pkey | primary key | `PRIMARY KEY (token_hash)` |
| organization_sso_login_states_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_org_sso_state_expiry | `btree (expires_at)` |
| organization_sso_login_states_pkey | `UNIQUE btree (token_hash)` |
