# Generated inventory

Everything in this folder **except this README** is generated. Do not edit generated files by hand. Change the source, `scripts/baseline/generate-inventory.mjs`, or `scripts/baseline/module-map.json`, then regenerate.

| File | Contents |
|---|---|
| [summary.json](./summary.json) | Revision, counts, generation notes |
| [module-coverage.md](./module-coverage.md) | Every element → module; UNASSIGNED list (the completeness boundary) |
| [api-endpoints.md](./api-endpoints.md) + `api/` | Endpoints by router file, with guard evidence and a "no guard detected" review list |
| [db-schema.md](./db-schema.md) + `db/` | Declared tables, columns, constraints, indexes, seeded platform rows, tables declared outside bootstrap |
| [ui-routes.md](./ui-routes.md) | React Router routes |
| [modules.md](./modules.md) | First-party source files with exports and importer counts |
| [registries.md](./registries.md) | Block types, admin tabs, theme picker, crystal variants |
| [env-vars.md](./env-vars.md) | Environment variable names and reference sites (no values) |
| [jobs.md](./jobs.md) | Scheduled jobs and timers |
| [design-tokens.md](./design-tokens.md) | CSS custom properties per theme, breakpoints |
| [tests.md](./tests.md) | Test files, runners, case names, npm scripts |
| [documentation.md](./documentation.md) | Documentation files with last-commit dates |
| [traceability-report.md](./traceability-report.md) | Output of the traceability checker |

## How to regenerate (each release)

```bash
# 1. Static parts only (everything except the DB catalog; db/ output is left as-is)
node scripts/baseline/generate-inventory.mjs

# 2. Full, including the declared-schema catalog. Needs a THROWAWAY LOCAL Postgres.
#    The script refuses any non-localhost URL, so it can't be pointed at Supabase.
#    Example on a machine with Postgres 16 binaries:
#      initdb -D /tmp/sbpg -A trust -U postgres && pg_ctl -D /tmp/sbpg -o "-p 55432" start
#      createdb -h localhost -p 55432 -U postgres sb_baseline
DATABASE_URL=postgres://postgres@localhost:55432/sb_baseline \
  node -e "import('./server/db.js').then(()=>process.exit(0))"          # runs bootstrap()
DATABASE_URL=postgres://postgres@localhost:55432/sb_baseline \
ADMIN_EMAIL=scratch@example.test ADMIN_INITIAL_PASSWORD='scratch-only' \
  node -e "import('./server/data/seed.js').then(m=>m.ensureSeeded()).then(()=>process.exit(0))"
BASELINE_CATALOG_DATABASE_URL=postgres://postgres@localhost:55432/sb_baseline \
  node scripts/baseline/generate-inventory.mjs

# 3. Validate references from the authored docs
node scripts/baseline/check-traceability.mjs
```

A regeneration that changes `summary.json` counts or produces UNASSIGNED elements is the signal to update module specs, the module map, and the source register in the same change.

## Known extraction limits

- Guard evidence is pattern-based. "none detected" means *review*, not *unprotected*. Several routes protected by unusual patterns may still show as unguarded, and a guard could be present but ineffective.
- Endpoints registered dynamically (computed paths, loops) aren't detected. Factory sub-routers in the same file are (e.g. `careerMaster.js` `makeResourceRouter`).
- "Imported by 0" can mean dead code, an entry point, or a file loaded via a non-relative path.
- The DB catalog is the schema **this repository declares** on an empty database. It is not the live Supabase schema.
