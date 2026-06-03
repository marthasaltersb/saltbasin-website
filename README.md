# Salt Basin Net Works

The personal site for Betsy Salter / Salt Basin Net Works, with a built-in CMS, Claude-powered editor agent, and BestyStaff public chat.

## Quick start

```powershell
npm install
copy .env.example .env
# edit .env: set ANTHROPIC_API_KEY, SESSION_SECRET, ADMIN_INITIAL_PASSWORD
npm run dev
```

- Public site: http://localhost:5173/
- Admin login: http://localhost:5173/admin/login
- API: http://localhost:3001/api

## Architecture

- **Vite + React 19** front-end (`src/`)
- **Express + better-sqlite3** back-end (`server/`)
- **Cookie sessions** with bcrypt-hashed passwords
- **Draft / Published** state model — admin edits draft, **Publish** promotes it to public
- **Pre-launch landing gate** — single shared password, toggleable in the config panel
- **Strategic Operator** brand palette per Salt Basin Net Works brand standards

## Phases

- ✅ Phase 1 — Foundation (auth, draft/publish, block renderer, social config)
- ⏳ Phase 2 — Drag-and-drop, new block types
- ⏳ Phase 3 — Claude editor agent with scoped tools
- ⏳ Phase 4 — Interactive cards → click-through detail pages
- ⏳ Phase 5 — BestyStaff public chat widget
