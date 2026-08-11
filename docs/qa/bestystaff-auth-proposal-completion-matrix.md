# BestyStaff, identity, memory, and proposal completion matrix

Verified: 2026-08-10

| Requested capability | Authoritative implementation evidence | Verification evidence |
|---|---|---|
| Required intent-aware email, format/domain gates, verification, CAPTCHA, and manual B2B validation | `bestyStaffGateDefinitions.js`, `emailDomain.js`, lead intake/verification routes and configurable agent definitions | Behavior tests BS-01–BS-08; automated gate tests |
| Complete chat context mapped to gate-driving and narrative lead metadata | `stage_gate_metadata`, `context_metadata`, `agent_memory`, lead message transcript and declared metadata field definitions | BS-09 and implementation-contract verifier |
| Early registration and optional pledge conversion eligibility; later B2B contract-output conversion | Configurable conversion evaluator and Square destination response | BS-10–BS-13 and conversion tests |
| Lead/member-scoped BestyStaff with governed customer memory | Scoped agent definitions, immediate member chat feedback capture, scheduled product/org refresh, permission-filtered reads | 28-contract verifier plus memory schema/runtime boot |
| Email history and verification status | Automatic recipient→lead resolution in email dispatch, lead email log, primary/alternate verification rows | BS-08, email implementation contract, database boot |
| Non-bypassable current career terms as first member prompt | Versioned immutable consent actions, user agreement timestamp/version, server 428 gates, UI gate before password/workspace | AU-01–AU-04 and contract verifier |
| Password policy, first-login replacement, history/reuse prevention, reset routing | Password policy/history services, required-password middleware, verified-role/IP reset preferences | AU-05–AU-13 and behavior tests |
| Personal authenticator plus organization SSO routes | Encrypted RFC 6238 TOTP; OIDC discovery/callback with one-time state, nonce, issuer/audience/expiry, verified email and org membership | AU-14–AU-15, syntax/contract verification, migration boot |
| Configurable proposal items, metadata compilation, hierarchical data story/talk track | LoneTree prospect configurator, compiler, immutable version snapshots, recursive expandable detail hierarchy | PR-01–PR-05, production build |
| Delivery, abbreviated PDF, link, email log, notification, collaborator feedback | Proposal delivery route, PDF generator, collaborator rights, component/layer event metadata, explicit draft/publish | PR-03–PR-09 and contract verifier |
| 24-hour reminders and nightly feedback triage | Reminder ledger covers every recipient with no published feedback; nightly 02:00 triage with configurator review | Proposal operations contracts and scheduler check |
| Budgetary/final approvals and proposal→contract conversion | Budgetary caveat path, final approval action registry, contract metadata/commercial terms/performance obligations | Approval/contract contracts and build |
| Breck→LoneTree Revenue journey | Idempotent provisioner and client-basin templates | Live configured DB result: journey `1`, user `17`, stage `proposal`, channel `Revenue` |
| Visual states and responsive login | 12-state manifest and hierarchical proposal UI | Login verified at 390×844, 768×1024, 1280×720 with no overflow/clipping/console errors |

Deployment-owned credentials still determine whether external providers perform a live transaction: Brevo, Square destination, and organization OIDC credentials. The application implements safe unconfigured behavior and does not claim third-party delivery or payment evidence without those credentials.
