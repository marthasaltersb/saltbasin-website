# Triage: qr-gated-outputs, round 3

Both failures reproduce by code reading at integration head b23396d. Neither is a spec problem. The round 2 triage listed both (T1, T5) as defects, but round 2's fix list left them out, so they were never fixed. Both are recurrences, so they keep their ids. Nothing was changed in code or in the spec.

| Id | Step | Class | Root cause |
|---|---|---|---|
| T1 (recurred) | J2.1 | defect | `src/components/admin/MyResumePanel.jsx:1062` hard-codes an em dash in "Read-only - no edits can be made here." |
| T5 (recurred) | E.5 | defect | `server/routes/auth.js:28` authLimiter message uses an em dash |

## T1 [J2.1] Read-only note (recurrence of round 2 T1, never fixed)

- Frozen step (docs/training/qr-gated-outputs.md:89): "Read-only - no edits can be made here." with a hyphen.
- Code (MyResumePanel.jsx:1062): `Generated {...} · Read-only — no edits can be made here.` with an em dash.
- Not a spec_error. The change spec and the owner gave no direction to use an em dash. Nothing in src/ uses the hyphenated form, so the hyphen is the spec's text and the em dash is a code-side drift.
- Fix: replace the em dash with " - " in that JSX string. Keep the "Generated ... ·" prefix as is. This was the only J2.1 content failing. The T2 contact fix is verified.
- Round 2 left the T1 and T5 fixes out of the fix list, so they were never applied. Put both in the round 3 fix list.

## T5 [E.5] Sign-in limit message (recurrence of round 2 T5, never fixed)

- Frozen step E.5: "Too many attempts - please try again in 15 minutes" with a hyphen.
- Code (server/routes/auth.js:28): `message: 'Too many attempts — please try again in 15 minutes'` with an em dash.
- Fix: replace the em dash with " - " in that string. It is the only user-facing em dash in the limiter message. Other em dashes in auth.js are comments or email and error copy that no step covers.
- Observation: the limiter tripped after 6 attempts on a fresh server. Per round 2 T5, that is expected. Login, sso/discover and reset-request share the one limiter, and successful sign-ins count toward it. The harness must reuse sessions, as E.5 itself says. This is not a defect.

## Validator observations (outside the baseline)

None needs a new step.

- MCP_GAP (the platform MCP server and `server/lib/mcpToolRegistry.js` do not exist). This belongs to the separate `platform-mcp` feature. It is tracked there and is not a coverage_gap of this spec.
- No Draft card after J9. Amendment A2 was rejected. The fix is a resubmission, not a product defect, so nothing goes to the fix loop. Same as G2.
- The .docx stamp path has no UI journey and no baseline step. It is a script, not a UI capability. It is noted only; no amendment is proposed this round.
- E.5 tripping early, the J7.1 script timing bug and the boot-time seed race are harness issues, with no product root cause. The harness issues are not product defects.

## Recommendation

Apply the two one-character-class string fixes (T1, T5), then re-validate J2.1 and E.5 on desktop and mobile. All other steps passed this round.
