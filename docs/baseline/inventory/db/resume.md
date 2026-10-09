# Database — `resume` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## resume_member_reasons

Element `TE-DB-resume_member_reasons` · declared at `server/db.js:3137` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('resume_member_reasons_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `reason` | text | NOT NULL |  |
| 4 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| resume_member_reasons_pkey | primary key | `PRIMARY KEY (id)` |
| resume_member_reasons_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rmr_user | `btree (user_id, created_at DESC)` |
| resume_member_reasons_pkey | `UNIQUE btree (id)` |

## resume_output_projections

Element `TE-DB-resume_output_projections` · declared at `server/db.js:933` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('resume_output_projections_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `preset_id` | text | NOT NULL |  |
| 4 | `preset_name` | text | yes |  |
| 5 | `included_sections` | jsonb | NOT NULL | `'[]'::jsonb` |
| 6 | `career_state_fingerprint` | text | NOT NULL |  |
| 7 | `atom_count` | integer | NOT NULL | `0` |
| 8 | `generated_at` | bigint | NOT NULL |  |
| 9 | `effective_career_state_at` | bigint | NOT NULL |  |
| 10 | `output_status` | text | NOT NULL | `'draft'::text` |
| 11 | `lineage_root_id` | bigint | yes |  |
| 12 | `target_job_description` | text | yes |  |
| 13 | `targeting_result` | jsonb | yes |  |
| 14 | `created_at` | bigint | NOT NULL |  |
| 15 | `career_opportunity_rod_id` | bigint | yes |  |
| 16 | `generated_content` | jsonb | yes |  |
| 17 | `output_type` | text | NOT NULL | `'resume'::text` |
| 18 | `source` | text | NOT NULL | `'ai_generated'::text` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| resume_output_projections_career_opportunity_rod_id_fkey | foreign key | `FOREIGN KEY (career_opportunity_rod_id) REFERENCES journey_data_rods(id) ON DELETE SET NULL` |
| resume_output_projections_lineage_root_id_fkey | foreign key | `FOREIGN KEY (lineage_root_id) REFERENCES resume_output_projections(id) ON DELETE SET NULL` |
| resume_output_projections_pkey | primary key | `PRIMARY KEY (id)` |
| resume_output_projections_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_resume_output_projections_lineage | `btree (lineage_root_id)` |
| idx_resume_output_projections_user | `btree (user_id, created_at DESC)` |
| resume_output_projections_pkey | `UNIQUE btree (id)` |

## resume_temp_access

Element `TE-DB-resume_temp_access` · declared at `server/db.js:3120` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('resume_temp_access_id_seq'::regclass)` |
| 2 | `email` | text | NOT NULL |  |
| 3 | `token` | text | NOT NULL |  |
| 4 | `request_context` | text | yes |  |
| 5 | `org` | text | yes |  |
| 6 | `role_type` | text | yes |  |
| 7 | `question` | text | yes |  |
| 8 | `missing_info` | text | yes |  |
| 9 | `terms_accepted` | boolean | NOT NULL | `false` |
| 10 | `lead_id` | bigint | yes |  |
| 11 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 12 | `expires_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| resume_temp_access_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL` |
| resume_temp_access_pkey | primary key | `PRIMARY KEY (id)` |
| resume_temp_access_token_key | unique | `UNIQUE (token)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rta_email | `btree (email)` |
| idx_rta_token | `btree (token)` |
| resume_temp_access_pkey | `UNIQUE btree (id)` |
| resume_temp_access_token_key | `UNIQUE btree (token)` |
