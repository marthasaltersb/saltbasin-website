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

### Section / block system

The site state JSON is `{ pages: [{ slug, sections: [{ id, type, status, content, fieldMeta }] }] }`.

- `src/components/blocks/index.jsx` — `REGISTRY` map of `type → Component`. `RenderSection` dispatches by `section.type`. All blocks accept `{ section, config, mode, memberSlug }`.
- `mode` is `'public'` or `'preview'` — preview shows draft/soon banners that the public site never shows.
- `src/data/capabilityTags.js` — `SOURCE_TYPES`, `MERGED_FIELD_DEFAULTS`, `TAG_CATEGORIES` for the field metadata system. Every field in a section can carry `section.fieldMeta[fieldKey]` with `{ sourceType, mergedFrom, sources, capabilityTags, description }`.

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
- CSS variables (colors, fonts) defined in `index.css` under `--sb-*` prefix.
- No test framework. No TypeScript. ESM throughout (`"type": "module"` in package.json).

### React rules of hooks

All hooks (`useState`, `useMemo`, `useEffect`) must be declared **before** any conditional early return. This caused a blank-screen bug in `EditorPane.jsx` — be vigilant when adding hooks to components that have early null-guards.

### Output routes

`/output/*` routes render print-isolated documents (resume, case study, one-pager, build summary). They use `visibility: hidden` on `<body>` with `visibility: visible` on `#sb-resume-print-root` to isolate print CSS. These are not authed — they read from published state or URL params.
