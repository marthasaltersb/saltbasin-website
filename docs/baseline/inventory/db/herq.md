# Database — `herq` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## herq_comment_insights

Element `TE-DB-herq_comment_insights` · declared at `server/db.js:2710` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `source_type` | text | NOT NULL | `'user note'::text` |
| 3 | `body` | text | NOT NULL |  |
| 4 | `author_or_source` | text | yes |  |
| 5 | `captured_date` | bigint | yes |  |
| 6 | `sentiment` | text | NOT NULL | `'neutral'::text` |
| 7 | `actionability` | text | NOT NULL | `'medium'::text` |
| 8 | `linked_post_refs` | _text | yes |  |
| 9 | `linked_series_refs` | _text | yes |  |
| 10 | `linked_domain_refs` | _text | yes |  |
| 11 | `linked_capability_refs` | _text | yes |  |
| 12 | `follow_up_needed` | boolean | NOT NULL | `false` |
| 13 | `notes` | text | yes |  |
| 14 | `created_by` | bigint | yes |  |
| 15 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| herq_comment_insights_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| herq_comment_insights_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| herq_comment_insights_pkey | `UNIQUE btree (id)` |

## herq_research_inputs

Element `TE-DB-herq_research_inputs` · declared at `server/db.js:2691` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `title` | text | NOT NULL |  |
| 3 | `source_name` | text | yes |  |
| 4 | `source_type` | text | yes |  |
| 5 | `url` | text | yes |  |
| 6 | `retrieved_date` | bigint | yes |  |
| 7 | `stat` | text | yes |  |
| 8 | `why_it_matters` | text | yes |  |
| 9 | `verification_status` | text | NOT NULL | `'needsVerification'::text` |
| 10 | `linked_post_refs` | _text | yes |  |
| 11 | `linked_output_refs` | _text | yes |  |
| 12 | `created_by` | bigint | yes |  |
| 13 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 14 | `credibility_rating` | text | yes |  |
| 15 | `relevance_rating` | text | yes |  |
| 16 | `novelty_rating` | text | yes |  |
| 17 | `signal_type` | text | yes |  |
| 18 | `topic_ref` | text | yes |  |
| 19 | `evidence_status` | text | NOT NULL | `'candidate'::text` |
| 20 | `claim_ref` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| herq_research_inputs_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| herq_research_inputs_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| herq_research_inputs_pkey | `UNIQUE btree (id)` |

## herq_series_versions

Element `TE-DB-herq_series_versions` · declared at `server/db.js:2674` · RLS not enabled · rows after empty-DB bootstrap: 5

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `acronym` | text | NOT NULL | `'HERQ'::text` |
| 3 | `series_title` | text | NOT NULL |  |
| 4 | `classification_type` | text | yes |  |
| 5 | `definition` | text | yes |  |
| 6 | `default_color_token` | text | yes |  |
| 7 | `status` | text | NOT NULL | `'active'::text` |
| 8 | `target_audience_refs` | _text | yes |  |
| 9 | `zero_post_eligible` | boolean | NOT NULL | `true` |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| herq_series_versions_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| herq_series_versions_pkey | `UNIQUE btree (id)` |
