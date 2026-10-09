---
name: release-loop
description: Required release process for every session that changes code — build, initial check, integrate, browser validation that follows the feature's training spec literally, triage, fix, re-validate until every journey passes, with change specs, training specs, test results, triage notes and a release log. Use whenever a session has made or is about to make code changes, before pushing, or when asked to "run the release loop", "validate", "triage", or "push when tests pass".
---

# Release loop

```
build ─▶ initial check ─▶ integrate ─▶ validate (browser, follows the training spec)
                                          │ pass ─▶ done
                                          ▼ fail
                                        triage ─▶ needs a business definition ─▶ ask the owner
                                          │ fixable
                                          ▼
                                         fix ─▶ integrate ─▶ validate again (with the fix notes) …
```

## For every feature

1. **Specs while building.**
   - `docs/changes/<feature>.md`: version, date, *Traces to* (earlier specs and commits it builds on),
     what changed, behaviour changes, limitations, fix notes per round.
   - `docs/training/<feature>.md`: preconditions with fictional data, numbered journeys with exact
     expected results. Another agent will follow it literally, so it doubles as the user guide.
2. **Initial check:** build passes, the app starts on a fresh database, and you walk your own journeys
   once.
3. **Validate:** a separate agent (or person) follows the training spec in a real browser and logs each
   step as pass or fail. Log each step to the tracker as it happens:
   `node tools/release-tracker-kit/log.mjs step <stepsRoot> <feature> <round> <journey> <step> pass|fail "<expected>" "<seen>"`.
4. **Triage** each failure. Reproduce it, find the root cause, and classify it as `defect`, `spec_error`,
   `environment` or `needs_business_definition`. Link a returning bug to its earlier ID.
5. **Fix** the root cause, re-walk the failed steps, and write fix notes. Then validate again.
6. **Stop** when every journey passes, when an item needs a business definition (ask the owner the exact
   question), or at the round limit. At the limit the feature is recorded as **not passed**, with its open
   items.
7. A bug that survives [2] fix attempts goes to a person.

## Logs and push

- Results: `docs/test-results/<feature>/round-N.md`. Triage: `docs/triage/<feature>-round-N.md`.
  Release log: `docs/release-log/<release>.md`.
- Report each stage to the tracker with `log.mjs start|result|fail`, and run `sync.mjs` after each
  stage.
- Push only when the release log shows every feature passed, or the owner says otherwise.

## Non-negotiables

- A script check never replaces the browser journey.
- A blank, clipped or unexplained screen is a failure, even without an error.
- Never skip, weaken or delete a journey step to get green. A wrong spec is fixed in the spec, with the
  reason.
- Nothing fails silently. Failed, refused and partial commands are logged with the state they left.
- Public repo: fictional data only.
