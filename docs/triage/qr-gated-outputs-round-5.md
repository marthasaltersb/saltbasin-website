# Triage: qr-gated-outputs, round 5

Reproduction: by source inspection of integration head f76786c (static string literals; no browser run by this agent). The validator's screenshots show the same strings. No code changed.

## T1 (recurrence, round 2, 3, 4 T1) - J2.1 Read-only note - class defect
- Step J2.1 (baseline v2, spec line 89) expects "Read-only - no edits can be made here." (hyphen).
- Root cause: src/components/admin/MyResumePanel.jsx:1109 hard-codes `Read-only — no edits can be made here.` (em dash). The line number moved (1062, 1065, now 1109); the text never changed. Branch release-loop/qr-gated-outputs-fix-r4 (e7a28dd) holds only notes, no code; the fix was never written.
- Not a spec_error: the change spec and the earlier T3 decision (conform product text to the spec's hyphen) agree with the step.
- Fix: replace ` — ` with ` - ` in that JSX string only (leave the comment at line 1100). It is the only rendered occurrence in src.

## T5 (recurrence, round 2, 3, 4 T5) - E.5 sign-in limit message - class defect
- Step E.5 (spec line 201) expects "Too many attempts - please try again in 15 minutes".
- Root cause: server/routes/auth.js:28, `authLimiter` message uses an em dash.
- Tripping after 6 attempts is expected (limiter shared by login, sso/discover, reset-request and counts successful sign-ins per IP); not a defect.
- Fix: replace ` — ` with ` - `. Other specs (cover-letter-agent, in-app-release-loop) mention "Too many attempts"; grep that none asserts the em dash before changing.

Both are one-string edits dropped from the fix list for four rounds. The fix agent must be told explicitly to include both and verify by grep that the em-dash forms are gone.

## Validator observations
- Classic Tools path / P.1 "sign in as administrator" vs member account: owner direction (member, from World Shell) conflicts with spec text; the P.1 amendment needs a reviewer. Not re-proposed here.
- Approver display name for member: allowed by spec wording; nothing.
- No Draft card for J10.3, E.1, E.2, E.4: already proposed as A5 (unapplied); nothing new.
- MCP parity matched UI (no MCP_GAP). docx contents not re-inspected: covered by A3. E.5 early trip and net::ERR_ABORTED: explained, nothing.
