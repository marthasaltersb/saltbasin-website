# Database — `financial` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## financial_account_definitions

Element `TE-DB-financial_account_definitions` · declared at `server/db.js:2145` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('financial_account_definitions_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `connection_id` | bigint | NOT NULL |  |
| 4 | `provider_account_ref` | text | yes |  |
| 5 | `account_class` | text | NOT NULL |  |
| 6 | `liability_class` | text | NOT NULL |  |
| 7 | `institution_name` | text | NOT NULL |  |
| 8 | `account_display_name` | text | NOT NULL |  |
| 9 | `masked_account_reference` | text | yes |  |
| 10 | `currency` | text | NOT NULL | `'USD'::text` |
| 11 | `semantic_atom_refs` | jsonb | NOT NULL | `'{}'::jsonb` |
| 12 | `connection_status` | text | NOT NULL | `'active'::text` |
| 13 | `security_policy_id` | text | NOT NULL |  |
| 14 | `data_scope` | text | NOT NULL | `'MEMBER_PRIVATE'::text` |
| 15 | `effective_from` | bigint | NOT NULL |  |
| 16 | `effective_to` | bigint | yes |  |
| 17 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| financial_account_definitions_account_class_check | check | `CHECK ((account_class = ANY (ARRAY['checking'::text, 'savings'::text, 'money_market'::text, 'credit_card'::text, 'personal_loan'::text, 'unsecured_line_of_credi` |
| financial_account_definitions_connection_id_fkey | foreign key | `FOREIGN KEY (connection_id) REFERENCES external_financial_connections(id) ON DELETE CASCADE` |
| financial_account_definitions_connection_id_provider_accoun_key | unique | `UNIQUE (connection_id, provider_account_ref)` |
| financial_account_definitions_data_scope_check | check | `CHECK ((data_scope = 'MEMBER_PRIVATE'::text))` |
| financial_account_definitions_liability_class_check | check | `CHECK ((liability_class = ANY (ARRAY['unsecured'::text, 'secured'::text, 'not_applicable'::text, 'unknown'::text])))` |
| financial_account_definitions_pkey | primary key | `PRIMARY KEY (id)` |
| financial_account_definitions_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| financial_account_definitions_connection_id_provider_accoun_key | `UNIQUE btree (connection_id, provider_account_ref)` |
| financial_account_definitions_pkey | `UNIQUE btree (id)` |
| idx_financial_accounts_user | `btree (user_id)` |

## financial_consents

Element `TE-DB-financial_consents` · declared at `server/db.js:2113` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('financial_consents_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `provider_id` | text | NOT NULL |  |
| 4 | `status` | text | NOT NULL | `'active'::text` |
| 5 | `permitted_account_classes` | jsonb | NOT NULL | `'[]'::jsonb` |
| 6 | `granted_at` | bigint | NOT NULL |  |
| 7 | `revoked_at` | bigint | yes |  |
| 8 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| financial_consents_pkey | primary key | `PRIMARY KEY (id)` |
| financial_consents_status_check | check | `CHECK ((status = ANY (ARRAY['active'::text, 'revoked'::text, 'expired'::text])))` |
| financial_consents_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| financial_consents_pkey | `UNIQUE btree (id)` |
| idx_financial_consents_user | `btree (user_id)` |

## financial_output_shares

Element `TE-DB-financial_output_shares` · declared at `server/db.js:2169` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('financial_output_shares_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `org_id` | bigint | NOT NULL |  |
| 4 | `output_type` | text | NOT NULL |  |
| 5 | `output_payload` | jsonb | NOT NULL |  |
| 6 | `source_account_ids` | jsonb | NOT NULL | `'[]'::jsonb` |
| 7 | `data_scope` | text | NOT NULL | `'ORGANIZATION_SHARED'::text` |
| 8 | `consent_statement` | text | NOT NULL |  |
| 9 | `revoked_at` | bigint | yes |  |
| 10 | `created_at` | bigint | NOT NULL |  |
| 11 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| financial_output_shares_data_scope_check | check | `CHECK ((data_scope = 'ORGANIZATION_SHARED'::text))` |
| financial_output_shares_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| financial_output_shares_pkey | primary key | `PRIMARY KEY (id)` |
| financial_output_shares_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| financial_output_shares_pkey | `UNIQUE btree (id)` |
| idx_financial_output_shares_member | `btree (user_id)` |
| idx_financial_output_shares_org | `btree (org_id)` |
