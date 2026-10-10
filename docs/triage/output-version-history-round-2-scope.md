# output-version-history round 2: scope review

Integration head reviewed: 07e9942. Feature first merge: f3171a8 (first parent a5f0086 = base). No code changed.
Note: the scope-review.json ids "T1"/"T3" belong to qr-gated-outputs and do not apply here; decisions below are fresh.

| Id | Scope | Owner |
|---|---|---|
| T1 (J1.2 mobile) | pre_existing | - |
| T1 (J5.1 mobile) | pre_existing | - |
| T8 | this_feature | output-version-history |
| T3 | this_feature | output-version-history |
| T10 | this_feature | output-version-history |

## T1 (both steps): pre_existing
At base a5f0086, `src/components/admin/AdminShell.jsx` contains zero occurrences of `sb-admin-mobile-drawer` or `sb-admin-mobile-menu-button` (checked with git show | grep -c), while `src/brand.css` already styles them and hides `.sb-admin-topbar-actions` at <=900px. The drawer CSS came from earlier commits (a875b9b, eb62057); markup was never rendered. This feature's merge does not touch the shell's mobile nav. It is also not part of the feature's request (version history). Reproduced at source level, not in a built browser: with the markup absent at base, the tool list cannot be reachable at 390px there either. Caveat: J1.2/J5.1 mobile only reach the feature via Classic Tools, so they stay blocked until a separate shell fix; the spec could alternatively reach My Resume by another path (a spec decision for the owner).

## T8: this_feature
The training spec docs/training/output-version-history.md hardcodes "Riley Fenn" (lines 3, 20, 54, 65, 76, 83, 105) and a signup-flag account. The harness account is Test Member (scripts/create-test-member.mjs). The product correctly shows the approver's display name. Feature's own spec; fixing needs an approved amendment (A5 was rejected on form; resubmit as a separate, step-listed amendment). Consistent with existing decision output-version-history-B14.

## T3: this_feature
Product matches E.2 (outputVersionHistory.js sets version.error and "Cannot compare"; OutputVersionHistory.jsx shows it). The defect is the feature's own spec: it requires corrupting a stored version, which no interface allows and DB edits are forbidden. Needs an owner answer (A2 needs_owner): either drop or replace E.2 with a reachable condition, or provide a sanctioned way to produce an unreadable version.

## T10: this_feature
Spec line 90 says "HEADER fields"; the product labels unchanged lines NAME / HEADING / ROLE / PARAGRAPH. Stale wording in the feature's own spec; product is right. Needs an amendment, not a code change.
