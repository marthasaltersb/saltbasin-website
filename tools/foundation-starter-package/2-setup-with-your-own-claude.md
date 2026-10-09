# 2. Set it up with your own Claude

These steps use **Claude Code** (terminal, desktop app, or claude.ai/code on the web). The copy-paste
prompts for each step are in `prompts.md`.

## Before you start

- A Claude plan that includes Claude Code.
- A Git repository for your project (GitHub is easiest), and Node.js 20 or newer where you run the kit.
- Somewhere to show the board:
  - any static host (GitHub Pages, S3, your own web server), or
  - a claude.ai artifact if you use Claude's published pages.
- The answers to the seven mapping questions, or someone who knows them (see `kit/MAPPING.md`).

## Step 1: Add the kit and the rules to your repo

1. Unzip the package. Copy `kit/` into your repo as `tools/release-tracker-kit/`.
2. Copy `templates/CLAUDE.md.template` to your repo root as `CLAUDE.md`. Fill in the bracketed parts:
   project name, commands, data stores and owner.
3. Copy `templates/skills/*` into `.claude/skills/` in your repo. Claude Code then offers
   `release-loop`, `reuse-first-audit` and `config-audit` as skills.
4. Commit. From now on, every Claude Code session in this repo starts with your rules loaded.

## Step 2: Prove the kit works on fictional data

From `tools/release-tracker-kit/`:

```bash
node make-fixture.mjs /tmp/fx
node sync.mjs --run /tmp/fx/runA --run /tmp/fx/runB --steps-root /tmp/fx/steps --out /tmp/fx/snap.json
node verify-snapshot.mjs /tmp/fx/snap.json /tmp/fx/expected.json   # prints "snapshot matches expected"
node serve.mjs /tmp/fx/snap.json 4173                              # open http://127.0.0.1:4173/
```

You should see four fictional features:
- one passed
- one "needs a person"
- one failed
- one still being validated

## Step 3: Answer the seven questions for your project

1. Copy `tracker.config.example.json` to `tracker.config.json` and set `projectName`, `tagline` and
   `maxFixAttemptsPerBug` (question 7).
2. Write your answers to questions 1–6 in a short `docs/foundation.md`.
3. Ask Claude to check the answers against `MAPPING.md` (prompt 3). Most problems later trace back to a
   missing answer here.

## Step 4: Send real events

Pick one route:
- **Your CI or scripts call `log.mjs`** when a stage starts and ends.
- **A small adapter** turns your tool's status changes (export or webhook) into the same events, using
  your seven answers. Ask Claude to write it (prompt 4).

Then run `sync.mjs --run <run dir> --ledger bug-ledger.json --out snapshot.json` on a schedule or after
each event. `--ledger` keeps every bug on the board permanently.

## Step 5: Publish the board

- **Static host:** publish `index.html` with `snapshot.json` next to it. The page re-reads the snapshot
  every minute.
- **claude.ai artifact:** ask Claude to publish `index.html` with the shared-database capability, and to
  write the snapshot to collection `tracker`, doc `current`, field `json` after each sync (prompt 5).
  Artifacts are private until you share them.

## Step 6: Run your changes through the release loop

For every code change, ask Claude to follow the `release-loop` skill:
1. a change spec and a training spec
2. an initial check
3. browser validation that follows the training spec literally
4. triage, fix, re-test
5. a release log

Push only when everything passed. The board shows the loop live.

## Step 7: Go further (designed, build with Claude when ready)

Use the specs in `specs/` as the starting brief:
- foundations per person and per organization
- seeds that grow into features
- work traced per seed
- scenes built one at a time

Ask Claude to run `reuse-first-audit` and `config-audit` before planning each one (prompt 6). Answer the
open owner questions at the end of each spec first.
