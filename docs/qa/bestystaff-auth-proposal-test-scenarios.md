# BestyStaff, Identity, Consent, and Proposal Test Pack

Version: 2026-08-10.1  
Scope: functionality built from the BestyStaff intake, lead conversion, authentication, career terms, and proposal requests in this chat.

## Execution

```bash
npm run test:bestystaff
npm run verify:bestystaff
$env:VERIFY_BASE_URL='http://localhost:3001'; npm run verify:bestystaff
npm run build
```

Visual runs use [bestystaff-auth-proposal-visual-states.json](../../tests/fixtures/bestystaff-auth-proposal-visual-states.json). Capture each state at all three declared viewports. A visual state passes only when required text and controls are visible, there is no horizontal overflow, focus is not trapped incorrectly, and browser console errors are absent. Never approve a baseline marked `known-failure`.

## BestyStaff intake and lead metadata

| ID | Scenario | Script | Expected result |
|---|---|---|---|
| BS-01 | Required intake order | Start anonymous intake; answer relationship question. | Email is the next required input; CAPTCHA follows email; context consent and discovery cannot precede them. |
| BS-02 | Invalid email format | Submit malformed address. | Lead is not created; inline format error; CAPTCHA does not unlock progression. |
| BS-03 | Career personal email | Select Career Portfolio and submit a consumer-domain personal email. | Email is accepted, verification starts, and personal-email classification is stored in stage-gate metadata. |
| BS-04 | Career custom-domain email | Select Career Portfolio and submit a custom-domain address. | Address may be added, but BestyStaff requests/records the required personal-email path before conversion. |
| BS-05 | B2B custom work email | Select Hire Salt Basin/B2B and submit a custom-domain email. | Work-email gate passes after verification; no generic-domain manual flag. |
| BS-06 | B2B generic email | Select B2B and submit Gmail or another consumer domain. | Address is accepted; `work_email_manual_validation=true`; conversion remains blocked pending manual validation. |
| BS-07 | CAPTCHA failure | Submit invalid/missing CAPTCHA response after email. | Intake cannot proceed and no lead-side action is treated as CAPTCHA-passed. |
| BS-08 | Verification email trace | Create lead with valid CAPTCHA. | UI tells visitor to expect verification; verification email is initiated and attached to lead email history. |
| BS-09 | Context classification | Complete discovery with quotes, signals, urgency, budget, and notes. | Gate-driving values land in `stage_gate_metadata`; narrative-only values land in `context_metadata`; transcript/memory retains all chat context. |
| BS-10 | Early registration without pledge | Confirm early registration and decline payment. | `confirmed_early_registrant=true`; no pledge required; verified email makes career lead conversion-eligible. |
| BS-11 | Pledged registrant | Confirm registration and record pledge. | Pledge and registration survive on lead; later conversion is automatic once remaining gates pass. |
| BS-12 | Nonregistrant career lead | Decline early registration. | BestyStaff continues discovery; lead does not auto-convert. |
| BS-13 | B2B contract timing | Verify custom work email but leave contract output not ready. | Lead remains B2B/proposal-stage and cannot convert until `contract_output_ready=true`. |
| BS-14 | Lead challenge in chat | Open a protected lead URL anonymously. | BestyStaff surfaces the lead login challenge; protected context is not rendered before authentication. |

## Terms and authentication

| ID | Scenario | Script | Expected result |
|---|---|---|---|
| AU-01 | Missing career terms | Login as career member with no consent action. | First rendered member prompt is BestyStaff terms; all other platform APIs return 428 except auth/consent routes. |
| AU-02 | Stale terms | Login with agreement to prior version. | Prompt identifies the update and previous agreement; background actions remain blocked. |
| AU-03 | Complete terms acknowledgement | Check every required acknowledgement and submit. | Immutable consent action stores version, timestamp, IP/user agent context, and acknowledgement keys; workspace unlocks. |
| AU-04 | Terms bypass attempts | Deep-link to member/org/proposal routes and call APIs before agreement. | Every protected action remains blocked; URL navigation does not bypass the server gate. |
| AU-05 | First-login temporary password | Convert/provision a new member and login. | Redirect to `/first-login-password`; all non-auth APIs return 428 until password replacement succeeds. |
| AU-06 | Password criteria | Try short, lowercase-only, numberless, and special-character-free passwords, then a compliant password. | Invalid values list criteria; only compliant value succeeds. |
| AU-07 | Password reuse | Change/reset back to current or one of five historical passwords. | Request fails with `password_reuse_not_allowed`; password and sessions remain unchanged. |
| AU-08 | Wrong current password | Submit valid new password with wrong current password. | 401 response; no password-history row or user update. |
| AU-09 | Reset anti-enumeration | Request reset for existing and nonexistent email. | Both responses are indistinguishable 200 results. |
| AU-10 | Primary-only reset routing | Leave default preferences unchanged and request reset. | Only verified primary address receives the reset message. |
| AU-11 | IP-based reset routing | Configure exact/prefix IP rule for primary + organization/work, then request from matching and nonmatching IPs. | Matching request routes to configured verified roles; nonmatch uses default; unverified destinations never receive secrets. |
| AU-12 | Reset completion | Use valid token with compliant unused password. | Token and sibling tokens are invalidated, sessions deleted, password history updated, and fresh login required. |
| AU-13 | Secret exposure audit | Inspect auth/API responses, logs, lead metadata, and UI. | No password hashes, reset tokens, authenticator secrets, or verification secrets are exposed outside their required delivery channel. |
| AU-14 | Organization SSO | Enter a provisioned organization email and choose organization sign-in. | OIDC discovery starts only for a configured org policy; callback consumes one-time state, validates nonce/issuer/audience/expiry, requires a verified matching email and org membership, and creates one platform session without also requiring password/TOTP. |
| AU-15 | Multiple authentication routes | Provision password, personal authenticator, and organization SSO for one member. | Routes coexist; password+its configured second-factor challenge or organization SSO independently completes one login route. |

## Proposal versioning and collaboration

| ID | Scenario | Script | Expected result |
|---|---|---|---|
| PR-01 | Create budgetary version | Admin creates proposal version for recipient rod. | Sequential immutable version number, `draft` status, budgetary classification, snapshot, and caveat are stored. |
| PR-02 | Create final version | Admin creates final classified version. | Version is separate from budgetary predecessor and does not overwrite it. |
| PR-03 | Deliver version | Deliver an approved/draft version. | Selected version becomes delivered; recipient gets view/comment collaborator rights. |
| PR-04 | Deliver replacement | Deliver a newer version. | Previously delivered version becomes archived with timestamp; it remains queryable and is never deleted. |
| PR-05 | Recipient projection | Login as recipient. | Latest delivered/approved proposal appears with version/class/caveat and configured nine-stage content. |
| PR-06 | Component feedback draft | Enter feedback on a stage/visual layer and save. | Entry stores user, version, component, layer, event context, and timestamps with `draft` status; admin cannot treat it as published. |
| PR-07 | Explicit feedback publish | Publish saved feedback. | Only that user’s drafts for that version become published with timestamp. |
| PR-08 | Cross-user isolation | Attempt to read/write another member’s rod/version by changing identifiers. | 404/403; no data disclosure or mutation. |
| PR-09 | Unsupported delivery transition | Attempt to redeliver archived/contracted version through draft-delivery action. | 409; existing delivered and archived states remain unchanged. |

## Visual acceptance matrix

For every state in the JSON manifest:

1. Seed/select the named fixture identity without using production credentials.
2. Navigate directly to the declared route.
3. Capture 390×844, 768×1024, and 1280×720 screenshots.
4. Assert required/absent text, enabled/disabled primary action, modal/gate layering, focus visibility, and zero horizontal overflow.
5. Record console errors and failed network calls.
6. Save evidence as `artifacts/visual/besty-auth-proposal/<state-id>/<viewport>.png`.
7. Mark pass only after human review. `AUTH-LOGIN` desktop was re-verified at 1280×720 with equal body scroll/client width and zero clipped controls; mobile/tablet captures remain required.

## Not yet testable as complete

The following require deployment credentials or external systems before production evidence can be captured: live organization IdP credentials, mobile/tablet authenticated screenshot capture, live Brevo delivery evidence, a configured Square payment destination, and external approval-provider integrations beyond the built-in approval action registry. Their application paths and safe unconfigured states are implemented; the test pack does not claim a third-party transaction occurred without those credentials.
