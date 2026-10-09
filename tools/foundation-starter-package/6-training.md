# 6. Training: the walkthrough video and exercises

The video `video/walkthrough.mp4` (3 min 6 s, captions on screen, no audio) walks through the
Salt Basin release tracker demo and the mapping guide. Both use fictional data. To record it again after
changes:

```bash
node video/record-walkthrough.mjs <out-dir>    # needs Playwright + Chromium; ffmpeg for the .mp4
```

The script's `chapters.json` uses the script's own clock, which drifts a few seconds behind the video
when 3D rendering is slow. The times below were read from the recorded video itself.

## Chapters

| Starts at | Chapter |
|---|---|
| 0:00 | Welcome |
| 0:08 | 1 · The board at a glance |
| 0:22 | 2 · The release crystal |
| 0:45 | 3 · Focus on one feature |
| 1:11 | 4 · Summary and alerts |
| 1:27 | 5 · Agents working now |
| 1:37 | 6 · Features |
| 1:46 | 7 · Bugs and their history |
| 1:57 | 8 · Every agent run |
| 2:05 | 9 · How it was built |
| 2:24 | 10 · Bring your own system |
| 2:57 | 11 · Make it yours |

## What each chapter teaches

1. **The board at a glance.** The release loop the board follows, and how fresh the data is.
2. **The release crystal.**
   - The centre is the release, and each gem is a feature coloured by status.
   - Red shards are open bugs, and a pink outline means "needs a person".
   - Teal satellites are agents working right now. Drag to turn the crystal.
3. **Focus on one feature.** Selecting a gem or a feature name filters the whole board. The demo's
   bravo-forms shows both kinds of escalation: a bug that survived two fix attempts, and a business
   question.
4. **Summary and alerts.** Passed vs total, running agents, open and verified bugs, and the "needs a
   person" callout.
5. **Agents working now.** Each running agent's role, feature, current activity and the failures it has
   already seen.
6. **Features.** Latest browser test per feature. "Passed" only when every step of the latest round
   passed.
7. **Bugs and their history.** Found → fix attempts → re-tests. Bugs never leave the board.
8. **Every agent run.** Results and token use. A run with no result is failed, never done.
9. **How it was built.** Events (`log.mjs`) → `sync.mjs` → `snapshot.json` → the board; and the
   one-request-at-a-time method.
10. **Bring your own system.** The seven mapping questions, which become your foundation.
11. **Make it yours.** Where to go next in this package.

## Hands-on exercises

Do these with the kit (`kit/`) and Claude Code. Each one has a result you can check.

1. **Run the fixture.** Follow step 2 of the setup guide.
   *Check:* `verify-snapshot.mjs` prints "snapshot matches expected", and the board shows 1 of 4
   features passed.
2. **Log your own feature.** Use `log.mjs` to start and finish `build:checkout`, then a failing
   `validate:checkout:r1` with 9 of 10 steps, then a triage with one defect `CK-2`. Run `sync.mjs`.
   *Check:* checkout shows "Failing", round 1 9/10, one open bug CK-2.
3. **Make a bug need a person.** Add two fix rounds for CK-2, each followed by a failing re-test whose
   triage item has `recurrenceOf: "CK-2"`.
   *Check:* CK-2 shows "Needs a person" with 2 / 2 fix attempts, and the callout appears.
4. **Answer the seven questions** for a project you know, then paste them into Claude with prompt 3.
   *Check:* Claude names every gap and fills in none.
5. **Read one spec as a builder.** Open `specs/foundation-rods-and-audit-history.md`, then answer three
   of its open owner questions for your organization and write them into your `CLAUDE.md`.
   *Check:* the answers are concrete enough that a builder wouldn't have to guess.

## Facilitator notes

- Start with the video (chapters 1–8). Pause at chapter 3 and ask: "Why did bravo-forms leave the
  automated loop?"
- Run exercises 1–3 live. Most people understand the bug rules only after making a bug need a person
  themselves.
- Finish with chapters 9–11 and exercise 4 as homework.
