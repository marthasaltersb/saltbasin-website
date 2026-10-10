# Scope review: qr-gated-outputs, round 5

Base: 9e729b6 (first parent of the earliest qr-gated-outputs merge aa14653). Both items are static strings, so reproduction was a `git show 9e729b6:<file>` grep (no server boot needed). No code changed, nothing started, no database created. Consistent with the round 4 decision (base e0ea466).

| Id | Scope | Evidence |
|---|---|---|
| T1 | pre_existing | `Read-only — no edits can be made here.` exists at 9e729b6 (src/components/admin/MyResumePanel.jsx:1042). Predates the feature. Still needs a code fix to a hyphen to match frozen step J2.1 (spec line 89); recurring because the fix was never applied. |
| T5 | pre_existing | `authLimiter` message `Too many attempts — please try again in 15 minutes` exists at 9e729b6 (server/routes/auth.js:28). Predates the feature. Still needs a hyphen fix for frozen step E.5 (spec line 201). |
