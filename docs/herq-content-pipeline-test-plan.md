# HERQ Content Pipeline — Test Plan, Scripts & Data Models

Built 2026-08-09/10 (this session). Covers Tasks #1–#16 from the session task list
(#11 — dropping the legacy `output_templates` table — is explicitly deferred, not
part of this build). This doc is the manual test pass to run before/after any
deploy that touches these files, since this repo has no automated test runner
(per `CLAUDE.md`) — verification is always a real click-through.

## Files this covers

| Area | Files |
|---|---|
| Attachments | `server/routes/contentAttachments.js`, `server/lib/contentAttachmentRetention.js` |
| Publications + interactions | `server/routes/contentPublications.js`, `server/lib/approvalGate.js` |
| HERQ core (series/posts/research/items/insights/outputs) | `server/routes/herq.js` |
| Admin UI | `src/components/admin/HerqPanel.jsx`, `HerqOutputConfigurator.jsx`, `PublicationsPanel.jsx`, `PublicationsCalendar.jsx` |
| Output templates/blocks | `src/lib/outputBlocks.js` |
| Schema (now declared — see below) | `server/db.js` (bootstrap, ~line 5413) |

---

## Data models

### `content_attachments` (new table — generic file uploads, any entity)

```sql
CREATE TABLE content_attachments (
  id                    TEXT PRIMARY KEY,        -- 'attachment.<uuid8>'
  entity_type           TEXT NOT NULL,           -- e.g. 'herq_research_input', 'unified_content_item'
  entity_id              TEXT NOT NULL,
  original_filename      TEXT NOT NULL,
  storage_bucket          TEXT NOT NULL,           -- always 'content-attachments'
  storage_key             TEXT NOT NULL,           -- 'users/{uploaded_by}/...' (admin, persistent) or 'temp/{uploaded_by}/...' (non-admin, 30-day)
  mime_type                TEXT,
  file_size                BIGINT,
  notes                    TEXT,
  uploaded_by               BIGINT,                 -- FK-ish to users.id (not enforced)
  created_at                BIGINT NOT NULL,
  retention_expires_at      BIGINT,                 -- NULL = never expires (admin uploads)
  deleted_at                BIGINT,
  retention_error           TEXT                    -- set if the retention worker's delete attempt failed
);
-- indexes: entity_type+entity_id lookup, partial index on pending retention
```

Ownership rule (in `contentAttachments.js`): admins see/manage everything on an
entity; everyone else sees/manages only rows where `uploaded_by = their user id`.

### `content_publications` (new table — scheduled/published posts, HERQ + ads)

```sql
CREATE TABLE content_publications (
  id                    TEXT PRIMARY KEY,
  app_id                TEXT NOT NULL,           -- 'app.herq' or 'app.services' (ads)
  entry_ref              TEXT,                    -- points at unified_content_items.id (gates on this)
  variant_ref             TEXT,
  long_form_ref            TEXT,                   -- site page or unified_outputs row this post links back to; ads skip this
  channel                  TEXT NOT NULL,           -- 'linkedin', 'instagram', etc.
  channel_account_ref       TEXT,
  campaign_ref               TEXT,
  scheduled_at                BIGINT,
  timezone                    TEXT,
  status                       TEXT NOT NULL DEFAULT 'draft',  -- draft/awaiting_approval/approved/scheduled/published/failed
  destination_url               TEXT,
  external_post_id               TEXT,
  actual_published_at             BIGINT,
  failure_reason                   TEXT,
  retry_count                       INTEGER NOT NULL DEFAULT 0,
  metadata                           JSONB NOT NULL DEFAULT '{}',
  created_by                         BIGINT,
  created_at, updated_at             BIGINT NOT NULL
);
```

### `content_interactions` (new table — comments/engagement per publication)

```sql
CREATE TABLE content_interactions (
  id                      TEXT PRIMARY KEY,
  publication_ref          TEXT NOT NULL,          -- FK to content_publications.id
  platform                  TEXT NOT NULL,
  interaction_type           TEXT NOT NULL,          -- 'comment', 'reaction', ...
  occurred_at                  BIGINT NOT NULL,
  external_user_ref             TEXT,
  public_profile_info            JSONB NOT NULL DEFAULT '{}',
  comment_content                 TEXT,
  sentiment                        TEXT,
  response_status                   TEXT NOT NULL DEFAULT 'none',
  attribution_confidence             TEXT NOT NULL DEFAULT 'platform_attributed',
  metadata                            JSONB NOT NULL DEFAULT '{}',
  created_by, created_at              BIGINT
);
```

### Additive columns on existing tables

| Table | Column | Type | Purpose |
|---|---|---|---|
| `unified_content_items` | `parent_item_id` | TEXT | Entry hierarchy/variants (a Theme's child Topics, etc.) |
| `unified_content_items` | `approvals` | JSONB `{}` | `{ level: outcome }` map — see Approval gate below |
| `unified_outputs` | `approvals` | JSONB `{}` | Same shape, for output-level approvals |
| `herq_research_inputs` | `credibility_rating`, `relevance_rating`, `novelty_rating` | TEXT | Evidence ratings |
| `herq_research_inputs` | `signal_type`, `topic_ref`, `claim_ref` | TEXT | Classification / linkage |
| `herq_research_inputs` | `evidence_status` | TEXT default `'candidate'` | See enum below |

**`evidence_status` enum** (`server/routes/herq.js`, `HerqPanel.jsx`):
`candidate → under_review → accepted | accepted_with_qualification | contradicted | rejected | expired | superseded`

**Approval gate** (`server/lib/approvalGate.js`) — 8 possible levels tracked
(`framework`, `research`, `evidence`, `copy`, `visual`, `channel_adaptation`,
`schedule`, `final_publication`), but only 4 are **required** to advance a
publication out of draft: `framework`, `research`, `copy`, `schedule`. Each
level's value is one of: `approved`, `approved_with_edits`, `needs_revision`,
`needs_more_research`, `on_hold`, `cancelled` — only the first two count as
"approved" for gating purposes.

### `unified_content_items.type` values now in use

`post` (original) plus the new hierarchy: `observation`, `season`, `theme`,
`topic`, `framework` — all rows on the same table, `app_id = 'app.herq'`,
differentiated by `type`. No schema change per type; `body`/`metadata` JSONB
carry type-specific shape (a Framework's argument/evidence sequence, a Topic's
core question, etc.) — nothing enforces that shape server-side, so a
malformed `body` for a given type won't error, it'll just render oddly.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts Vite (5173) + Express (3001) together — use this for all manual testing below |
| `npm run seed` | Reseeds default admin user + backlog items (does **not** touch content tables) |
| Retention worker | Not a standalone script — runs inside the Express process, gated by `CONTENT_ATTACHMENT_RETENTION_WORKER_ENABLED=true` (unset/false = skipped entirely, confirm current value before assuming it's running) |

No dedicated seed/fixture script exists yet for HERQ content (series, research,
items, publications) — the scenarios below create data live through the UI or
via `curl`/fetch against the routes directly. If you end up doing this
repeatedly, worth a `scripts/seed-herq-fixtures.mjs` — not built in this pass
since it wasn't asked for.

---

## Test scenarios

Run against `npm run dev`, logged in as the admin user first, then a second
non-admin user where noted (member/client role) to check ownership scoping.

### 1. Attachments (`content_attachments`)
1. **Admin upload persists.** From any HERQ research input or content item, attach a PDF. Confirm `storage_key` starts with `users/{admin_id}/...` and `retention_expires_at` is `NULL` (check via the row, not just the UI).
2. **Non-admin upload expires.** Log in as a non-admin user, upload a file to the same entity. Confirm `storage_key` starts with `temp/{user_id}/...` and `retention_expires_at` is ~30 days out.
3. **Ownership scoping.** As the non-admin user, `GET /api/content-attachments?entity_type=...&entity_id=...` — confirm you only see your own upload, not the admin's. As admin, confirm you see both.
4. **Cross-user download/delete blocked.** As a second non-admin user (not the uploader), try `GET /:id/download` and `DELETE /:id` on the first non-admin's attachment — expect `403`.
5. **Bad file type rejected.** Try uploading a `.exe` or unlisted MIME type — expect a 400 with the "File type not allowed" message, not a silent accept.
6. **25MB limit enforced.** Try a file over the limit — expect multer's rejection, not a hang or 500.
7. **Retention worker (only if `CONTENT_ATTACHMENT_RETENTION_WORKER_ENABLED=true`).** Manually set a test row's `retention_expires_at` to the past, wait for the hourly tick (or trigger the function directly in a scratch script), confirm the file is removed from Supabase Storage and `deleted_at` is set.

### 2. Publications + approval gate (`content_publications`)
8. **Draft blocked without approvals.** Create a `unified_content_items` row (a `post`) with an empty `approvals` JSONB. Try to create/advance a `content_publications` row pointing `entry_ref` at it — expect `409` with `missingApprovals: ['framework','research','copy','schedule']`.
9. **Partial approval still blocks.** Set only `framework` and `research` to `approved` — expect `409` listing just `['copy','schedule']`.
10. **`approved_with_edits` counts as approved.** Set all 4 required levels to a mix of `approved`/`approved_with_edits` — expect the gate to pass (`ok: true`).
11. **Full approval unblocks.** All 4 required levels `approved` — publication should move to `scheduled`/advance without the 409.
12. **`entry_ref` pointing outside `unified_content_items`** (e.g. an ads publication with no HERQ entry) — confirm the gate returns `ok: true` (nothing to check against) rather than incorrectly blocking ads publications.
13. **Calendar drag-to-reschedule.** In `PublicationsCalendar.jsx`, drag a scheduled post to a new day — confirm `scheduled_at` updates and the gate re-runs (moving a gated post shouldn't silently bypass it).
14. **Due-publication transition.** Set `scheduled_at` to a time in the past on an approved post — confirm whatever scheduled-check mechanism exists actually flips status (this is the one piece worth specifically re-reading the scheduler code for before testing, since "due-publication check" wasn't fully detailed in the task description).

### 3. Interactions & performance dashboard
15. **Log an interaction.** `POST /:id/interactions` on a real publication — confirm it appears via `GET /:id/interactions` and rolls up into `GET /dashboard`.
16. **Dashboard with zero data.** Hit the dashboard for a channel/topic with no publications yet — confirm an honest empty state, not a crash or fabricated numbers (matches this repo's stated convention elsewhere).

### 4. HERQ core content
17. **Series update.** `PUT /api/herq/series/:id` as admin — confirm non-admin gets 401.
18. **Post CRUD round-trip.** Create → read → update (change `export_status`) → delete a post. Confirm `series_ref`/`domain_refs` filters on `GET /posts` work.
19. **Content hierarchy.** Create a `season`, then a `theme` with `parent_item_id` pointing at it, then a `topic` under that theme. `GET /items?type=topic&parent_item_id=<theme id>` should return only that theme's topics.
20. **Bad `type` rejected.** `POST /items` with `type: 'not-a-real-type'` — expect 400 listing the valid 5 types.
21. **Research evidence workflow.** Create a research input (`evidence_status` defaults to `candidate`), walk it through `under_review → accepted`, confirm ratings (`credibility_rating` etc.) persist and the UI's color coding matches.
22. **Research → contradicted/superseded.** Confirm these terminal-ish states are selectable and don't block the record from still being viewed/filtered.
23. **Output version history.** Edit a HERQ output's `template_config` twice — confirm `version_history` accumulates (newest first, capped at 20) and editing `config` doesn't clobber a `template_config`-only change (the two are tracked separately per the code).
24. **Output approvals independent of entry approvals.** Confirm `unified_outputs.approvals` and `unified_content_items.approvals` are genuinely separate — approving an output shouldn't silently approve its source entry or vice versa.

### 5. Templates & blocks
25. **Meme template renders.** Build a Meme output using `HERQMeme` — confirm hook/visual-premise/primary+secondary text/caption/accessibility-text fields all render and the accessibility text is actually present in the DOM (not just visually implied).
26. **Newsletter template renders.** Confirm all modular sections (classification, season+theme, core question, research, evidence, framework interpretation, sources, related entries) render when populated and gracefully collapse/hide when a section has no data.
27. **New blocks use brand icons, not stock.** Visually confirm `photo-hero`/`stat-icon-row`/`pill-badge-row` pull Salt Basin icons and the default gradient placeholder — not the stock photography from the original Canva reference.

### 6. Component-level iteration UI
28. **Per-component revision doesn't overwrite approved version.** Mark one component (e.g. a headline) as "preferred," then submit a revision to a *different* component (e.g. the CTA) — confirm the preferred headline's version history is untouched.
29. **Version history per component, not whole-config.** Confirm you can see prior versions of just the paragraph without it dragging in unrelated image-concept history (this was flagged as the trickiest part of the task — worth extra scrutiny).

---

## What I did NOT test in this session

I have not driven any of scenarios 1–29 in a live browser this session — this
document defines the pass, it doesn't report one. Given the approval-gate and
ownership-scoping items (8–14, 3–4) are the highest-consequence if wrong
(wrong gating = unapproved content could publish; wrong scoping = a client
could see another client's uploaded file), I'd prioritize those first if you
only have time for a partial pass before deploying.
