# Triage: qr-gated-outputs, round 2

Source: validator round-2 report (the file was not present at `docs/test-results/qr-gated-outputs/round-2.md` in the integration head 34bd313; only round-1.md exists). Round 1 reported the same J2.1 and J3.3 dash mismatches and no triage file was ever written for them, so these are recurrences of an unresolved round-1 finding.

## Summary

| Item | Step | Class | Root cause |
|---|---|---|---|
| T1 | J2.1 | defect | `MyResumePanel.jsx:1062` uses an em dash |
| T3 | J3.3, J7.1, J8.3 | defect | `MyResumePanel.jsx:636` uses an em dash |
| T2 | J2.1 (header contact) | defect | `DocumentBlocksView.jsx:94` renders an array without a separator |
| T5 | E.5 | defect | `server/routes/auth.js:28` uses an em dash |

No spec_error. The change spec (docs/changes/qr-gated-outputs.md) does not specify the wording, and there is no owner direction for an em dash. The sibling component `OpportunityOutputsSection.jsx:129` already uses "Approved - private QR link created" with a hyphen. The frozen step wording stands, so the product is brought to it. Alternative (not recommended): amend the spec to em dashes in 5 places.

## T1 [J2.1] Read-only note
- Root cause: `src/components/admin/MyResumePanel.jsx:1062`, `Read-only — no edits can be made here.`
- Fix: replace the em dash with " - ".

## T3 [J3.3, J7.1, J8.3] Approve toast
- Root cause: `src/components/admin/MyResumePanel.jsx:636` (`approveForQr`), `'Approved — private QR link created (copied to clipboard).'`. All three steps go through this one function.
- Fix: use " - ". One edit clears three steps.

## T5 [E.5] Sign-in limit message
- Root cause: `server/routes/auth.js:28`, `authLimiter` message `Too many attempts — please try again in 15 minutes`.
- Fix: use " - ". Only docs/training/cover-letter-agent.md mentions the phrase, and only as a substring "Too many attempts", so nothing else depends on the dash.
- Note, not a defect: the limiter (max 10 per 15 min per IP) is shared by `/login`, `/sso/discover` and `/reset-request`, and counts successful sign-ins. The trip after 3 to 5 wrong attempts follows from earlier sign-ins in the same window. The spec already says to sign in once and reuse the session. Environment behaviour, no change.

## T2 [J2.1, header contact] Contact entries run together
- Root cause: the spec's own fixture gives `header.contact` as an array (`["avery@example.test", "Example City"]`, training spec line 43) while the extractor (`scripts/extract-application-package.py:130`) emits a string. `src/components/DocumentBlocksView.jsx:94` renders `{header.contact}` directly, and React concatenates array children with no separator. The PDF path (`server/lib/outputRendering.js:186`) passes the array to pdfkit, which stringifies it with commas, so the PDF only looks right by accident. `src/lib/documentBlocksEditor.js:28` wraps it as `items: [h.contact]`, which would nest an array.
- Fix: one shared normaliser, `Array.isArray(c) ? c.filter(Boolean).join(' · ') : c`, applied in DocumentBlocksView.jsx:94, outputRendering.js:186 and documentBlocksEditor.js:28. Keeps the PDF and the web view consistent. Not a baseline step on its own, so it is reported under J2.1.

## Validator observations
- MCP_GAP (no `server/lib/mcpToolRegistry.js`): belongs to feature `platform-mcp`, not this feature's fix. Not a new step for this baseline. Tracked as an interface-parity gap.
- MOBILE_GAP (Classic Tools tab strip hidden at 390px, `.sb-admin-mobile-menu-button` has no element): real product defect outside this feature's steps. The steps passed via World Shell. Coverage_gap amendment proposed: document the phone route in "Where things are".
- Fixture for a Draft card (J10.3, E.1, E.2, E.4): coverage_gap, proposed in the amendment list below.
- Back to World overlapping the wordmark: pre-existing, nothing for this round.
- B10 (docx stamp path) has no UI or journey: no step possible, nothing to add.
