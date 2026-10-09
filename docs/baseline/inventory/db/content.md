# Database — `content` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## content_attachments

Element `TE-DB-content_attachments` · declared at `server/db.js:5808` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `entity_type` | text | NOT NULL |  |
| 3 | `entity_id` | text | NOT NULL |  |
| 4 | `original_filename` | text | NOT NULL |  |
| 5 | `storage_bucket` | text | NOT NULL |  |
| 6 | `storage_key` | text | NOT NULL |  |
| 7 | `mime_type` | text | yes |  |
| 8 | `file_size` | bigint | yes |  |
| 9 | `notes` | text | yes |  |
| 10 | `uploaded_by` | bigint | yes |  |
| 11 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 12 | `retention_expires_at` | bigint | yes |  |
| 13 | `deleted_at` | bigint | yes |  |
| 14 | `retention_error` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| content_attachments_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| content_attachments_pkey | `UNIQUE btree (id)` |
| idx_content_attachments_entity | `btree (entity_type, entity_id)` |
| idx_content_attachments_retention | `btree (retention_expires_at) WHERE ((retention_expires_at IS NOT NULL) AND (deleted_at IS NULL))` |

## content_interactions

Element `TE-DB-content_interactions` · declared at `server/db.js:5860` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `publication_ref` | text | NOT NULL |  |
| 3 | `platform` | text | NOT NULL |  |
| 4 | `interaction_type` | text | NOT NULL |  |
| 5 | `occurred_at` | bigint | NOT NULL |  |
| 6 | `external_user_ref` | text | yes |  |
| 7 | `public_profile_info` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `comment_content` | text | yes |  |
| 9 | `sentiment` | text | yes |  |
| 10 | `response_status` | text | NOT NULL | `'none'::text` |
| 11 | `attribution_confidence` | text | NOT NULL | `'platform_attributed'::text` |
| 12 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 13 | `created_by` | bigint | yes |  |
| 14 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| content_interactions_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| content_interactions_pkey | `UNIQUE btree (id)` |
| idx_content_int_pub | `btree (publication_ref, occurred_at DESC)` |

## content_publications

Element `TE-DB-content_publications` · declared at `server/db.js:5832` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `app_id` | text | NOT NULL |  |
| 3 | `entry_ref` | text | yes |  |
| 4 | `variant_ref` | text | yes |  |
| 5 | `long_form_ref` | text | yes |  |
| 6 | `channel` | text | NOT NULL |  |
| 7 | `channel_account_ref` | text | yes |  |
| 8 | `campaign_ref` | text | yes |  |
| 9 | `scheduled_at` | bigint | yes |  |
| 10 | `timezone` | text | yes |  |
| 11 | `status` | text | NOT NULL | `'draft'::text` |
| 12 | `destination_url` | text | yes |  |
| 13 | `external_post_id` | text | yes |  |
| 14 | `actual_published_at` | bigint | yes |  |
| 15 | `failure_reason` | text | yes |  |
| 16 | `retry_count` | integer | NOT NULL | `0` |
| 17 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 18 | `created_by` | bigint | yes |  |
| 19 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 20 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| content_publications_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| content_publications_pkey | `UNIQUE btree (id)` |
| idx_content_pub_app | `btree (app_id, status)` |
| idx_content_pub_channel | `btree (channel, scheduled_at)` |
| idx_content_pub_entry | `btree (entry_ref) WHERE (entry_ref IS NOT NULL)` |
