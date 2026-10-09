# Triage: qr-gated-outputs, round 4

Reproduction: by source inspection of the integration head (2fabc8e); the strings are static literals, so no browser run was needed. Not run in a browser by this agent.

## T1 (recurrence, round 2 and 3 T1) - J2.1 Read-only note - class defect
- Step J2.1 (baseline v2, spec line 89) expects "Read-only - no edits can be made here." (hyphen).
- Root cause: `src/components/admin/MyResumePanel.jsx:1065` (the earlier reports said 1062) hard-codes `Read-only — no edits ...` with an em dash. Fix round 2 changed only the toast at line 636 (see docs/changes/qr-gated-outputs.md T3 note: product text is changed to match the spec text), never this line.
- Not a spec_error: no change spec or owner direction asks for an em dash here, and the same feature's earlier decision (T3) was to conform the product to the hyphen.
- Fix: replace ` — ` with ` - ` in that one string. It is the only occurrence in `src`.

## T5 (recurrence, round 2 and 3 T5) - E.5 sign-in limit message - class defect
- Step E.5 expects "Too many attempts - please try again in 15 minutes" (hyphen).
- Root cause: `server/routes/auth.js:28`, the `authLimiter` message uses an em dash. Fix round 2 did not touch it.
- The trip after 6 attempts is expected, not a defect: the limiter is shared by login, sso/discover and reset-request and counts successful sign-ins per IP.
- Fix: replace ` — ` with ` - ` in the message. Grep shows it is the only occurrence under `server`.

Both fixes are one-character-class string edits. The fix agent must be told explicitly to include both items; they were dropped from the fix list in round 2 and again in round 3.

## Validator observations
No new steps proposed. F2-8 (docx), F2-10 (MCP), F2-6 and F2-12 are already covered by amendments A1-A5 (rejected ones await resubmission per their notes) and are not product defects. The E.5 early-trip note is explained above.
