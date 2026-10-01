# Database — `lead` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## lead_activity

Element `TE-DB-lead_activity` · declared at `server/db.js:334` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('lead_activity_id_seq'::regclass)` |
| 2 | `lead_id` | bigint | NOT NULL |  |
| 3 | `source` | text | NOT NULL |  |
| 4 | `cta_location` | text | yes |  |
| 5 | `message` | text | yes |  |
| 6 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| lead_activity_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| lead_activity_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_lead_activity_lead | `btree (lead_id, created_at DESC)` |
| lead_activity_pkey | `UNIQUE btree (id)` |

## lead_email_addresses

Element `TE-DB-lead_email_addresses` · declared at `server/db.js:1294` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('lead_email_addresses_id_seq'::regclass)` |
| 2 | `lead_id` | bigint | NOT NULL |  |
| 3 | `email` | text | NOT NULL |  |
| 4 | `email_type` | text | NOT NULL | `'personal'::text` |
| 5 | `org_name` | text | yes |  |
| 6 | `is_primary` | boolean | NOT NULL | `false` |
| 7 | `subscribed` | boolean | NOT NULL | `true` |
| 8 | `verified` | boolean | NOT NULL | `false` |
| 9 | `verified_at` | bigint | yes |  |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| lead_email_addresses_lead_id_email_key | unique | `UNIQUE (lead_id, email)` |
| lead_email_addresses_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| lead_email_addresses_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_lea_lead | `btree (lead_id)` |
| lead_email_addresses_lead_id_email_key | `UNIQUE btree (lead_id, email)` |
| lead_email_addresses_pkey | `UNIQUE btree (id)` |

## lead_email_verifications

Element `TE-DB-lead_email_verifications` · declared at `server/db.js:1513` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('lead_email_verifications_id_seq'::regclass)` |
| 2 | `lead_id` | bigint | NOT NULL |  |
| 3 | `email` | text | NOT NULL |  |
| 4 | `token_hash` | text | NOT NULL |  |
| 5 | `expires_at` | bigint | NOT NULL |  |
| 6 | `verified_at` | bigint | yes |  |
| 7 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| lead_email_verifications_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| lead_email_verifications_pkey | primary key | `PRIMARY KEY (id)` |
| lead_email_verifications_token_hash_key | unique | `UNIQUE (token_hash)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_lead_email_verification_lead | `btree (lead_id, email)` |
| lead_email_verifications_pkey | `UNIQUE btree (id)` |
| lead_email_verifications_token_hash_key | `UNIQUE btree (token_hash)` |

## lead_emails

Element `TE-DB-lead_emails` · declared at `server/db.js:318` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('lead_emails_id_seq'::regclass)` |
| 2 | `lead_id` | bigint | NOT NULL |  |
| 3 | `to_email` | text | NOT NULL |  |
| 4 | `from_email` | text | NOT NULL |  |
| 5 | `subject` | text | NOT NULL |  |
| 6 | `body_text` | text | yes |  |
| 7 | `body_html` | text | yes |  |
| 8 | `provider` | text | NOT NULL |  |
| 9 | `status` | text | NOT NULL |  |
| 10 | `provider_id` | text | yes |  |
| 11 | `error` | text | yes |  |
| 12 | `sent_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| lead_emails_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| lead_emails_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_lead_emails_lead | `btree (lead_id, sent_at DESC)` |
| lead_emails_pkey | `UNIQUE btree (id)` |

## lead_messages

Element `TE-DB-lead_messages` · declared at `server/db.js:310` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('lead_messages_id_seq'::regclass)` |
| 2 | `lead_id` | bigint | NOT NULL |  |
| 3 | `role` | text | NOT NULL |  |
| 4 | `content` | text | NOT NULL |  |
| 5 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| lead_messages_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| lead_messages_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| lead_messages_pkey | `UNIQUE btree (id)` |

## lead_sessions

Element `TE-DB-lead_sessions` · declared at `server/db.js:1284` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `token` | text | NOT NULL |  |
| 2 | `lead_id` | bigint | NOT NULL |  |
| 3 | `expires_at` | bigint | NOT NULL |  |
| 4 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| lead_sessions_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| lead_sessions_pkey | primary key | `PRIMARY KEY (token)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_lead_sessions_lead | `btree (lead_id)` |
| lead_sessions_pkey | `UNIQUE btree (token)` |

## lead_visits

Element `TE-DB-lead_visits` · declared at `server/db.js:387` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('lead_visits_id_seq'::regclass)` |
| 2 | `lead_id` | bigint | NOT NULL |  |
| 3 | `visit_key` | text | NOT NULL |  |
| 4 | `entry_path` | text | yes |  |
| 5 | `first_message` | text | yes |  |
| 6 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| lead_visits_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| lead_visits_lead_id_visit_key_key | unique | `UNIQUE (lead_id, visit_key)` |
| lead_visits_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_lead_visits_lead | `btree (lead_id, created_at DESC)` |
| lead_visits_lead_id_visit_key_key | `UNIQUE btree (lead_id, visit_key)` |
| lead_visits_pkey | `UNIQUE btree (id)` |
