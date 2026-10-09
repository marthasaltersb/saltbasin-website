# 3. The rules it was built under

These are the Salt Basin rules this work followed, written so they apply to any project. Each has a
reason; keep the reason when you adapt the rule.

## Design rules

1. **Reuse before you build.** Before any new table or mechanism, check whether an existing record type,
   relationship type, event type, tracked interaction or additive column already fits. A new table
   needs a written reason. *Why: parallel mechanisms drift apart, and the second one is always the one
   nobody maintains.* (Skill: `reuse-first-audit`.)
2. **Configuration, not code.** If changing something for another person, organization, product or
   industry would mean editing source code, it belongs in configuration, a versioned definition or seeded
   data instead. *Why: the platform must serve people whose rules you haven't met yet.* (Skill:
   `config-audit`.)
3. **No setup that only an API can reach.** Everything a person can configure has a screen. *Why: if only
   a developer can change it, it isn't really configurable.*
4. **History is append-only.**
   - Records are retired, not deleted.
   - Changes are written as events, through one write path.
   - Corrected evidence is superseded, not overwritten.
   - Each event keeps two clocks: when it was recorded, and when it happened.

   *Why: audit history you can lose is not audit history.*
5. **Never reinterpret old data silently.** Data is tagged with the definition version it was read
   under. A new definition is a new version, never a rewrite. *Why: members' existing data must mean
   tomorrow what it meant today.*
6. **Registries are append-only.** Keys people's data depends on are never renamed or removed; they are
   retired from pickers instead. *Why: a renamed key orphans every record that used it.*
7. **Agents propose, people decide.** Agents can plant seeds and propose changes. Only a person grows a
   seed, approves a feature or approves a write-back to an outside database. *Why: accountability needs a
   person; also, agent boundaries are not sandboxed yet, so never claim they are.*

## Honesty rules

8. **Never fabricate.**
   - A missing value shows as "not recorded", never as zero or a guess.
   - An empty state is honest.
   - A translation that doesn't exist falls back to the original, clearly labelled.
9. **No silent failures.**
   - A job that ends without a result is shown as failed.
   - A write-back that fails says so.
   - A feature is never "done" while failures are unreconciled.
10. **Business questions go to the owner, as exact questions.** Anything classed "needs a business
    definition" is escalated, never guessed.
11. **Say what is real.** Label every part as working, demo, designed or not built.

## Release rules

12. **Every code change goes through the release loop:** build → initial check → integrate → browser
    validation that follows the training spec literally → triage → fix → re-validate, until every journey
    passes.
13. **Specs trace to what came before.** Each change spec has a *Traces to* section naming the earlier
    spec versions and commits it builds on.
14. **Never weaken a test to get green.** No skipping, disabling or deleting a journey step. A wrong spec
    is fixed in the spec, with the reason.
15. **A bug that survives the fix-attempt limit goes to a person** (default 2) and leaves the automated
    loop.
16. **Push only when the release log shows every feature passed**, or the owner says otherwise.

## Data and privacy rules

17. **Public repositories hold fictional data only.** No real people, employers, customers or
    application targets in specs, logs, fixtures or examples.
18. **Boards carry labels, statuses, summaries and counts, never transcript text.** The kit checks this
    with a sentinel string in its test fixture.
19. **Secrets never go in the repo.** API keys and tokens live in environment variables or the host's
    secret store, and OAuth tokens are stored encrypted.

## Design-system rules (Salt Basin's own; replace with yours)

20. One shared 3D object family (the crystal family) is reused everywhere; it is never forked per screen.
21. Brand colours are tokens. Salt Basin's hot pink is only ever a line, mark or border, never a fill.
22. Every colour has light and dark values, and pages work at phone width.
