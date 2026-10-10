# output-version-history round 4: scope review

Integration head reviewed: f76786c. Feature first merge: f3171a8 (first parent a5f0086 = base). No code changed.
Reuses round-2 decisions (docs/triage/output-version-history-round-2-scope.md); the scope-review.json ids "T1"/"T3" belong to qr-gated-outputs and do not apply here.

| Id | Scope | Owner |
|---|---|---|
| T1 (MY RESUME at 390px) | pre_existing | - |
| T2 (CAREER MASTER at 390px) | pre_existing | - |
| T3 (unreadable saved version) | this_feature | output-version-history |

## T1, T2: pre_existing
Checked at base a5f0086 with git show: AdminShell.jsx has 0 occurrences of `sb-admin-mobile-drawer` / `sb-admin-mobile-menu`, while brand.css already has 13 drawer rules and hides `.sb-admin-topbar-actions` at <=900px (line 622). The CSS came from earlier commits (a875b9b, eb62057) and the markup was never rendered. At HEAD no JSX in src/ renders the drawer either. This feature's diff to AdminShell.jsx/brand.css is unrelated to mobile nav, and a shell-wide mobile tool menu is not part of the version-history request. Verified at source level, not in a built browser (the markup is absent at base, so the tool list cannot be reachable there). Caveat: the feature is only reachable through Classic Tools, so J1.2/J5.1 mobile stay blocked until a separate shell fix, or the owner chooses another path to My Resume for the spec.

## T3: this_feature (needs owner decision)
Product matches the spec (outputVersionHistory.js sets version.error and keeps the version listed; OutputVersionHistory.jsx shows the messages). The gap is the feature's own spec: it requires corrupt stored content, which no interface creates, and DB edits are forbidden by test constraints. Amendments A2, A7 and A10 are all needs_owner (A10 status confirmed). Needs an owner coverage decision: drop or replace the step with a reachable condition, accept cli-only coverage with a written fixture and exact strings, or provide a sanctioned way to produce an unreadable version. Do not edit the spec directly.
