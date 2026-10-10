# qr-gated-outputs round 6 scope review

Base checked: `aa14653^1` (first parent of the earliest qr-gated-outputs merge `aa14653`). Checked by reading the files at that commit with `git show`; no build or database was needed because both items are static string literals. No code changed, nothing committed, no processes or databases started.

## qr-gated-outputs-T1 (J2.1 "Read-only" em dash) - this_feature
- The em dash is already on the base: `MyResumePanel.jsx` at `aa14653^1` has "Read-only — no edits can be made here." (line 1042 there). It dates from commit 9b5ad4f (2026-08-09). Moving the strings to a hyphen is not something the base would do.
- `docs/triage/scope-review.json` already classes T1 as this_feature: the dialog is the view surface J2.1 of this feature's own spec exercises, and the spec says "Read-only - no edits can be made here." I found no contrary evidence, so the decision stands.
- Fix location when owned: `src/components/admin/MyResumePanel.jsx:1109` (replace the em dash with a hyphen).
- Note: the spec wording could equally be amended to match the code. That is a reviewer amendment under spec governance, not an edit by this agent.

## qr-gated-outputs-T5 (E.5 sign-in limit em dash) - pre_existing
- `server/routes/auth.js` at `aa14653^1` has the identical line 28: `message: 'Too many attempts — please try again in 15 minutes'`. It comes from the initial import (a875b9b, 2026-07-10, Betsy Salter). It reproduces without the feature.
- The sign-in rate limiter is not part of this feature's request (import, metadata, approve for QR, slug, QR in PDF/docx, revoke). The spec step E.5 only references it.
- `scope-review.json` has no entry for T5.
- The 6-attempt trip noted in the root cause is the limiter counting all sign-ins per IP, which is expected and not a defect.
- Fix location: `server/routes/auth.js:28`. Alternatively the spec could be amended to the em dash text.

## Process note
- T1 and T5 are the same class of mismatch (spec hyphen vs code em dash) but get different owners: T1 follows the existing recorded decision, and T5 has no feature involvement. The fix branches in earlier rounds held notes only, which is why the fix was never written.
