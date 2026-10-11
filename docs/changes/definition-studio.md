# Change spec — Definition Studio: compose modules and products on a configurable process canvas

Feature key: `definition-studio` · Release: `2026-10-10-production-hardening` (0.3.0) · Version 1 (built) · 2026-10-10
Training spec: `docs/training/definition-studio.md` (version 1)
Status: built on branch `feature/seven-layer-theory`; validated locally against a fresh database (see "Verified").

## Owner direction

> "I want to be able to login to the website, and use the definition studio to define everything needed to
> build out the career module through the definition studio, leveraging the process builder prototype but
> even the process builder prototype needs to be configurable." — Betsy, 2026-10-10

Earlier the same day: the Composer interface is the **Definition Studio**; it ships with every Salt Basin
module and has two modes — Compose (create new products, apps and features, plus each module's
implementation Score) and Implement (a client's guided, self-assisted setup, on the same canvas). And:
"anything with a name needs a unique identifier — plain name and an L number — and an API layer name."

## Traces to

| Earlier spec / code | How this builds on it |
| --- | --- |
| Seven-Layer Theory spec v0.1 (`.claude/skills/salt-basin-seven-layer-theory/reference/master-build-prompt.md`, commit `90c0183`) | §11 asks to extend the existing builder; DEC-SLT-01 (tracker) names this prototype as that builder. |
| Process flow builder prototype + spec (`docs/baseline/intake/2026-10-10-process-flow-builder/`, commit `079415f`) | Ported, not rewritten. Every change in the page is marked "Definition Studio port". |
| Decision log DEC-SLT-03, -16, -19, -20, -24 (`docs/salt-basin-seven-layer-theory-progress.md`) | Identifier rule, Composer/Arranger roles, Career as the pilot module. |
| `SALT_BASIN_MODULES` (`server/lib/provisioningPolicyRegistry.js`) | One Studio workspace per module; nothing new to register a module. |
| `config_state` versioned settings pattern (`releaseLoopDefinition.js`) | Studio settings: version +1 per save with a required note. |
| Render bindings / agent runner lazy-schema pattern | New tables created lazily, never in bootstrap. |
| `gtm/anthropicClient.js`, `agentLlmUsage.js` | Server-side drafting with usage recorded, replacing the prototype's browser call to the Messages API. |

## Reuse-first audit (salt-basin-channel-journey-architecture)

| Concept | Classification |
| --- | --- |
| Studio workspace per module | REUSES EXISTING SUBSTRATE — `SALT_BASIN_MODULES`, no table. |
| Studio settings | REUSES EXISTING SUBSTRATE — `config_state` row `definition_studio_config`. |
| Drafting agent | REUSES EXISTING SUBSTRATE — platform-default `agent_definitions` row `definition_studio_drafter` (insert-if-missing), `agent_llm_usage`. |
| Audit | REUSES EXISTING SUBSTRATE — `audit_log` via `audit()`. |
| `definition_studio_documents` + `definition_studio_document_versions` | NEW TABLE, JUSTIFIED — versioned, per-workspace canvas documents written by a browser page. Not a process (rod_type), not rules (Current), not a shared setting (`config_state` has no per-key history or workspace scope). Projecting composed flows into Notes, Currents and gates is later phases of the seven-layer build. |
| Composed product (`product:<apiName>`) | Stored as a Studio document in the `platform` workspace. Deliberately **not** a `SALT_BASIN_MODULES` entry: a composed product becomes grantable only through a separate, reviewed change. |

## What changed (version 1, build)

### Data model
- `definition_studio_documents` (workspace_key, doc_key, kind, current_version, created/updated/deleted) and
  `definition_studio_document_versions` (append-only content, hash, note, author). Created lazily by
  `ensureDefinitionStudioSchema()`.
- Autosaves by the same person within 10 minutes fold into one draft version; a note always starts a new
  version; restoring adds a new version; removing is a soft delete that keeps every version.

### Server
- `server/lib/definitionStudioConfig.js` (pure): default settings reproducing the prototype (3 levels,
  7 shapes, 6 field sections / 22 fields, execution and concurrency types, pain root causes, geometry sizes),
  validation and the identifier rule — every named item has `name`, an L-number `id` (`FLOW-L2-SHAPE-008`)
  and a fixed snake_case `apiName`; ids and API names never change; items are switched off, never removed.
- `server/lib/definitionStudio.js`: workspaces, product creation (`PRODUCT-L0-NNN`), documents, versions,
  restore, settings, server-side drafting. Audit entries are written inside these functions, so the website
  and MCP record the same thing.
- `server/routes/definitionStudio.js` at `/api/definition-studio` (admin): `GET /canvas`, `GET|PUT /config`,
  `GET /workspaces`, `POST /products`, `GET /documents`, `GET|PUT|DELETE /document`,
  `GET /document/versions`, `POST /document/restore`, `POST /agent-draft`.
- MCP: 10 `definition_studio_*` tools, scopes `definitions.read` / `definitions.write`; parity rows in
  `capabilityParity.js` (canvas page and agent drafting carry an `mcpExclusion` with the reason).

### Client
- `prototypes/definition-studio/definition-studio.html`: the prototype, served only through
  `GET /api/definition-studio/canvas`, which injects settings and workspace. Changes: storage bridge to the
  platform with a visible save state; shapes, step fields, execution types, pain root causes, geometry sizes
  and level names from settings; configured shapes remember their API name and show a tag; drafting goes to
  the server; header shows the module or product.
- `src/components/admin/DefinitionStudioPanel.jsx`: World Shell → Journeys → **Definition Studio** (admin,
  `PLATFORM_ISLAND_TABS`, no nav row): workspace picker, **+ New product**, tabs **Canvas**, **Studio
  settings**, **History**.

## Behaviour changes to know
- The Studio is admin-only in this slice (a Composer is an admin). Arranger and end-user permissions
  (DEC-SLT-16, -19) are not built yet.
- Implement mode (a client's instance on the same canvas, DEC-SLT-20) uses the prototype's existing
  **Clients** feature; there is no separate client-facing screen yet.
- Saved flows are not yet projected into Notes, Currents or gate definitions (later seven-layer phases).

## Verified (initial check, 2026-10-10, local fresh Postgres 16)
- `npm run test:definition-studio`: 12 pass. `node scripts/check-interface-parity.mjs`: registry matches
  code (the one remaining gap, `career-scoring-preferences`, predates this change). `vite build` succeeds.
- API: admin 200, member 403, anonymous 401; coalesced and noted versions; restore; soft delete; duplicate
  product refused; settings without a note refused; removing a shape refused with the "switch it off" message;
  drafting without a key returns the plain-words 503.
- Browser (Playwright, Chromium): log in → World Shell → Definition Studio → Career module canvas → place
  Start/end, configured Hand-off and Decision → connect → "Saved to Salt Basin" → reload → nodes restored;
  settings rename/add/save; new product; history and versions; 390px has no horizontal overflow.

## Known limitations
- The canvas page itself is the prototype's desktop layout; on a phone the panel offers **Open full
  screen**, but composing a flow on a 390px screen is cramped.
- Google Fonts and the spreadsheet-import library load from public CDNs, as in the prototype.
- Drafting needs `ANTHROPIC_API_KEY` on the server; without it every field is still editable by hand.

## Fix notes per round
- Round 0 (build): new items' API names now follow their plain name until edited; the settings save bar
  sticks to the bottom only when there are unsaved changes (it covered a quarter of a phone screen).
- Round 1 (validation, 33 pass / 2 pass-with-note / 2 fail): [J3.3] the save-state badge covered the
  **Save specification** button — moved to the bottom left and made click-through. [J3.1] was a spec error:
  the prototype has 22 step fields (pain points moved into their own rows), so the first new field is
  `FLOW-L2-FIELD-023`; training spec corrected before baselining. [J4.4] showing the message inline and as a
  toast follows the platform convention and stays.
