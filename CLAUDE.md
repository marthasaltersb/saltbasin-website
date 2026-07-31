# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start both Vite (port 5173) and Express (port 3001) concurrently
npm run client     # Vite only
npm run server     # Express only (with --watch hot-reload)
npm run build      # Production Vite build → dist/
npm start          # Production Express server (serves dist/ as static + API)
npm run seed       # Re-seed default admin user + backlog items
```

No test runner is configured. Verification is done via the `/verify` skill against the running app.

To kill a stuck server on Windows: `netstat -ano | findstr :3001` then `Stop-Process -Id <PID>`.

---

## Architecture

### Three-layer platform model

1. **Betsy's site** (`saltbasin.net`) — admin-only CMS, editable via `/admin/*`
2. **Member public sites** (`/u/:slug`) — each member controls their own published profile
3. **Member admin dashboard** (`/member`) — member's own editor, profiles, integrations, product apps

### Data flow: draft → publish

All content (site sections, config) lives in a **draft/published pair**:

| Table | Admin platform | Member |
|---|---|---|
| Site JSON | `site_state` (`draft` / `published`) | `member_sites` (`user_id + kind`) |
| Config JSON | `config_state` (`draft` / `published`) | `member_configs` (`user_id + kind`) |

`AdminShell` uses a `scope` prop (`'admin'` or `'member'`) to switch between the two API sets. Member scope routes to `/api/member-site/*` and `/api/member-config/*`; admin scope routes to `/api/site/*` and `/api/config/*`. The components (EditorPane, PreviewPane, ConfigPanel, Sidebar) are identical — only the API endpoints differ.

### Deployment-safety invariants (member rollout)

Once real members have live content, a platform deploy must never regress or reinterpret their existing data:

- **Block registry is append-only.** Keys in `REGISTRY` (`src/components/blocks/index.jsx`) are never renamed or deleted — a member's existing `section.type` must always resolve to a renderer. Retire a block by removing it from the "add section" picker, not from `REGISTRY`.
- **Schema-versioned JSON.** `member_sites.data` carries `version`, `member_configs.data` carries `schemaVersion` (both stamped defensively on write in `memberSite.js`/`memberConfig.js`). Breaking shape changes are explicit, opt-in per-member migrations keyed off this field — never silent reinterpretation of old JSON.
- **Seed/bootstrap never touches member rows.** `server/data/seed.js` and `db.js bootstrap()` only add columns or insert missing platform-wide rows (`site_state`, `config_state`, the bootstrap admin user) — never `UPDATE` or reseed `member_sites` / `member_configs` / `member_profiles`.
- **Shared config rows members read are additive-only.** `config_state` rows like `admin_nav` and `page_type_definitions` only ever gain entries; existing keys are never renamed or removed once members may reference them.

### Section / block system

The site state JSON is `{ version, pages: { [pageKey]: { key, name, slug, type, status, order, seo, sections: [{ id, type, name, status, bg, fields, fieldMeta }] } } }`.

- `page.seo` (`{ title, description, canonical, ogImage, noIndex }`) is an optional, additive page-level key — added 2026-07-16 for the SEO/structured-data layer, not populated on any pre-existing page. `server/lib/seo.js`'s `buildSeoTags()` computes sane fallback tags when it's absent; both `src/lib/useSeoHead.js` (client `<head>` updates on route change) and `server/lib/seoMiddleware.js` (server-side HTML injection for link-unfurling bots, prod-only) call it. Edited via the "SEO & Sharing" card in `EditorPane.jsx`'s page-settings branch — every field's `onChange` must spread `page.seo` first since `AdminShell.jsx`'s `updatePage()` is a shallow merge.

- `pages` is a **keyed object** (keyed by page key), not an array — despite the shape sometimes being described as `pages: [...]`. Always normalize with `Object.values(data.pages)` (or check `Array.isArray` first) before iterating; don't assume either shape blindly. Confirmed against the real published `site_state` row 2026-07-16.
- Section content lives under **`section.fields`**, not `section.content` — every block in `src/components/blocks/index.jsx` reads `const f = section.fields || {}` (51 occurrences repo-wide, zero occurrences of `section.content` anywhere in `src/` or `server/`). `fieldMeta` is a real, documented sibling key but is currently unused in production data (0 of 23 live sections carry it as of 2026-07-16) — don't assume it's populated without checking.
- `src/components/blocks/index.jsx` — `REGISTRY` map of `type → Component`. `RenderSection` dispatches by `section.type`. All blocks accept `{ section, config, mode, memberSlug }`.
- `mode` is `'public'` or `'preview'` — preview shows draft/soon banners that the public site never shows.
- `src/data/capabilityTags.js` — `SOURCE_TYPES`, `MERGED_FIELD_DEFAULTS`, `TAG_CATEGORIES` for the field metadata system. Every field in a section can carry `section.fieldMeta[fieldKey]` with `{ sourceType, mergedFrom, sources, capabilityTags, description }` — schema exists and is wired into the blocks, but isn't yet populated in any live section.
- CTA fields have **no standardized naming convention** across blocks — `home-hero` uses `cta1Label`/`cta1Link`, `services` uses `s1Cta`, `assessments` uses `a1Price`, `creative-decor` uses a bare `cta1`. Each block invented its own key names, so nothing outside that block's own render logic can reliably enumerate "the CTAs on this page." Do not assume a `cta{N}Label`/`cta{N}Link` pattern is universal when writing tooling against section fields.

### Admin shell tab routing

`AdminShell` reads the nav structure from `config_state` id=`'admin_nav'` (seeded in `db.js` bootstrap). The `TAB_COMPONENTS` registry in `AdminShell.jsx` maps `componentId` strings to React components. Adding a new admin tab requires: import the component, add it to `TAB_COMPONENTS`, update the nav seed in `db.js` (or the config via the UI).

The `'content'` and `'config'` componentIds are handled inline in AdminShell (not via `TAB_COMPONENTS`) because they need shell state.

### Database adapter

`server/db.js` exports a `db` object that mimics the `node:sqlite` prepared-statement API but wraps the async `postgres` npm package:

```js
await db.prepare(sql).get(...params)   // returns first row or null
await db.prepare(sql).all(...params)   // returns array
await db.prepare(sql).run(...params)   // returns { lastInsertRowid, changes }
await db.exec(sql)                     // raw exec (no params)
db.raw                                 // direct tagged-template postgres client
```

**Critical**: `postgres` rejects `undefined` params — always pass `null` for absent optional values.

**Critical**: for a parameter bound to a `JSONB` column (with or without an explicit `::jsonb` cast in the SQL), always pass the raw JS value (object/array/string/number) — **never** `JSON.stringify()` it first. `db.prepare(sql).run/get/all(...)` wraps `sql.unsafe(query, params)`, and a pre-stringified string double-encodes: the column ends up holding a JSON *string scalar* containing the JSON text, not the actual object (`jsonb_typeof(col)` shows `'string'` instead of `'object'`/`'array'`). This corrupts silently — every reader does `row.col?.someKey || default`, and a JS string has no such property, so it just falls through to the default instead of erroring. Confirmed by direct reproduction 2026-07-27; audited and fixed across the codebase that day (see the "jsonb param convention" note at the top of `db.js`). Columns that are plain `TEXT` (`site_state.data`, `config_state.data`, `member_profiles.draft`/`published`, `org_sites.data`, `org_configs.data`) are unaffected and correctly keep using `JSON.stringify()` — check the column's actual `CREATE TABLE` type before treating a `JSON.stringify()` call as a bug.

SQL uses `$1, $2` numbered placeholders (not `?`). All timestamps are `BIGINT` milliseconds (`Date.now()`), not SQL timestamps.

Schema migrations run at every boot via idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` calls at the bottom of `db.js bootstrap()`. Add new columns there.

### Authentication

Cookie name: `sb_admin`. `getUserFromCookie(req)` in `server/auth.js` validates the session token against the `sessions` table. It is **async** — every route helper that calls it must be `async` and must `await` the result. Forgetting `await` produces a Promise where a user object is expected, causing `.id` to be `undefined` and postgres to throw `UNDEFINED_VALUE`.

Pattern used in all route files:

```js
async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}
// In route handler:
const user = await requireAuth(req, res);
if (!user) return;
```

### Email

`server/lib/email.js` sends via **Brevo** (not Resend). When `BREVO_API_KEY` is not set, it falls back to stdout logging and returns `{ ok: true, stub: true }` — the calling route still returns `{ ok: true }`, so missing email config is silent from the client's perspective.

### OAuth + credential security

`server/lib/crypto.js` — AES-256-GCM encrypt/decrypt. Key from `TOKEN_ENCRYPTION_KEY` env var (64 hex chars = 32 bytes). All OAuth tokens and external DB credentials are stored encrypted in `oauth_connections.access_token_enc`.

`server/lib/oauthProviders.js` — 14-provider config. `zuora` and `marketo` use `grantType: 'client_credentials'` (no user redirect). Providers with `requiresTenantUrl` (Snowflake, SAP, Oracle, Tableau, Workday) need member-supplied base URLs passed as query params to the connect endpoint.

Current OAuth routes still write to `member_oauth_connections` (the legacy table). The newer `oauth_connections` table adds `profile_scope` + `profile_id` scoping but the route hasn't been migrated yet.

### Profile system

Three-layer: `personal_profiles` (1:1 with `users`) → `org_memberships` → `organization_profiles`. `personal_org_links` lets self-employed users link their personal profile to their LLC org. `product_licenses` + `data_entitlements` gate access to Salt Basin products (finbridgeco, handoveros) by org.

### Key env vars

```
DATABASE_URL             Supabase Postgres connection string
SESSION_SECRET           Cookie signing secret
TOKEN_ENCRYPTION_KEY     64 hex chars — required for OAuth token encryption
APP_BASE_URL             https://saltbasin.net in production (OAuth callback base)
BREVO_API_KEY            Transactional email — falls back to stdout stub if unset
ANTHROPIC_API_KEY        Powers the member agent + BestyStaff agent
```

OAuth provider keys follow the pattern `{PROVIDER}_CLIENT_ID` / `{PROVIDER}_CLIENT_SECRET` for all 14 providers (MICROSOFT, SALESFORCE, QUICKBOOKS, LINKEDIN, HUBSPOT, SUPABASE, SNOWFLAKE, TABLEAU, ZUORA, DEALHUB, MARKETO, SAP, ORACLE, WORKDAY).

### Frontend conventions

- All API calls go through `src/lib/api.js` — always `credentials: 'include'`, always JSON.
- Toast notifications via `src/lib/toast.js` — `toast.success(msg)` / `toast.error(msg)`.
- Admin styles via `src/components/admin/adminStyles.js` — inline style objects, no CSS modules.
- CSS variables (colors, fonts) defined in `src/brand.css` under `--sb-*` prefix (not `index.css` — corrected 2026-07-16).
- No test framework. No TypeScript. ESM throughout (`"type": "module"` in package.json).

### Theme system

`src/brand.css` defines 6 named themes via `[data-theme="..."]` blocks: `strategic` (default), `glow-light`, `glow-dark`, `momentum-warm`, `lagoon`, `prospect` (added 2026-07-16 — light cream/parchment/paper palette, teal/gold structure). Each theme overrides both the raw `--sb-*` tokens every existing block already reads and the semantic `--sb-theme-*` roles. `data-theme` is set on the page root in `PublicSite.jsx`/`PublicProfile.jsx` from `config.theme` (default `'strategic'`); admin chrome (`/admin/*`) never gets a `data-theme` attribute and always renders Strategic Operator. Picked via the shared `ThemeSwatch` picker in `ConfigPanel.jsx` (`THEME_OPTIONS`), identical for admin and member scope. New members default to `'prospect'` (`server/data/defaultMemberConfig.js`); existing members keep whatever they had.

**Two independent override layers, both must agree**: `config.theme` (named palette) and `config.brand.{primary,accent,ink,paper}` (raw hex overrides — always wins over the selected theme when non-empty). `defaultMemberConfig.js`'s `brand` defaults are empty strings, not hardcoded hex — pinning every new member to one theme's exact values via a "default" override was a real regression, found and fixed 2026-07-16 (`PublicSite.jsx` had the same bug even worse: a fully hardcoded, non-`config`-driven override block that silently defeated the theme picker entirely for Betsy's own site). Pink/rose is **never** a background, text, or button fill in any theme — mark/underline/border only (`.sb-pink-mark`/`.sb-pink-underline`/`.sb-pink-border`), one shared hot-pink hue (`--sb-pink-500` family) reused at different tints across themes, by explicit product decision — don't introduce a per-theme pink hue without checking this first.

### Career Channel Rod

The legacy `career_jobs/skills/tools/engagements/domains/certifications/deals` tables (per-user via `user_id`) remain the actual editing surface (`server/routes/careerMaster.js`'s CRUD routes, used by `CareerMasterPanel.jsx`/`MyResumePanel.jsx`). Anything member-facing/public reads from the **Career Channel Rod** instead (`journey_data_rods` where `rod_type='career_master'`, evidence in `journey_rod_evidence`) — a field-mapping "Career Atom" layer (`server/lib/careerAtomRegistry.js`) kept live-synced with the legacy CRUD by `server/lib/careerAtomMigration.js`'s `syncSingleEntry`/`removeEntryEvidence` (called from `careerMaster.js`'s shared `makeResourceRouter` on every create/update/delete, 2026-07-16). `server/lib/careerAtomRollups.js`'s `buildCareerAtomRollupCatalog()` reconstructs entries from evidence and computes `skills_by_category`/`jobs_by_industry`/`tools_by_wheel_bucket` groupings, exposed at `GET /api/career/atom-rollups?owner=<slug>|me` — this is what the public `careerRollupShowcase` block (`src/components/blocks/CareerProspectBlocks.jsx`) renders, not the legacy `/api/career/rollups` (which stays as the separate, admin-facing `careerExplorer` block's data source). A member with no Career Master rows gets an honest empty state, never fabricated numbers. The separate **Resume Output Projection** system (`server/lib/resumeProjection.js`, `server/routes/resumeOutputs.js`, `/api/resume-outputs`) reads the same Channel Rod evidence for a different purpose (fingerprinting/staleness of generated resume documents) but as of 2026-07-16 has no automated trigger populating it for most members — a known, separate gap, not fixed by the sync above (which only ensures the rod/evidence exist, not that a resume projection has been generated).

### React rules of hooks

All hooks (`useState`, `useMemo`, `useEffect`) must be declared **before** any conditional early return. This caused a blank-screen bug in `EditorPane.jsx` — be vigilant when adding hooks to components that have early null-guards.

### Output routes

`/output/*` routes render print-isolated documents (resume, case study, one-pager, build summary). They use `visibility: hidden` on `<body>` with `visibility: visible` on `#sb-resume-print-root` to isolate print CSS. These are not authed — they read from published state or URL params.
