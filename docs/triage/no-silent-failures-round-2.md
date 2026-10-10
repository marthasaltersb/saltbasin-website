# Triage: no-silent-failures, round 2

Baseline: v2. No BASELINE_MISMATCH. No earlier triage items for this feature in this loop; amendments none.

| Id | Step | Class | Root cause |
|---|---|---|---|
| T-R2-1 | J0.2, J0.3, J3.4 (toast) | spec_error | Step demands an em dash and a "green" toast; the product string and style are the shared, previously approved ones |
| T-R2-2 | J5.2 (and J4.1 by same path) | defect | /output/resume fetches Career Master with no owner, so the server returns the platform admin's data |
| T-R2-3 | E.4 | spec_error | Ambiguous noise list (aborted requests, 409 count) |
| T-R2-4 | J4.1 (MCP_GAP) | defect | /api/output-templates is not governed and has no MCP tool |
| T-R2-5 | J1.3 observation | coverage_gap | Load-failure toast is plain (success-style), not red |
| T-R2-6 | P1 observation | spec_error | Says "test admin"; admin has no Career Master / My Resume |

## T-R2-1 Toast text and colour (J0.2, J0.3, J3.4) - spec_error
- Product: `src/components/admin/MyResumePanel.jsx:656` `toast.success('Approved - private QR link created (copied to clipboard).')` (ASCII hyphen). Same string at `src/components/OpportunityOutputsSection.jsx:129`.
- `toast.success` has no green style by design: `src/lib/toast.js` + `src/brand.css:455` (navy, gold border). Only `toast.error` was restyled (T2, `docs/changes/no-silent-failures.md` line 86), and that change spec never asks for a green success toast or a new string.
- Prior approved, passing specs expect the hyphen: `docs/training/qr-gated-outputs.md` lines 101, 156, 170. The step is therefore wrong, not the product. The em dash exists in `docs/training/no-silent-failures.md` lines 70 and 110 and in cover-letter-agent.md J2.6 / proficiency-rules-and-live-qr.md (those specs belong to other features and are not touched here; reviewer may want to align them too).
- Traces to: change spec "toast.success has role=status; only errors are red"; qr-gated-outputs v-latest J-steps.
- Fix agent: none needed. (Alternative if owner wants an em dash and green success style: that is a product style decision, not in any spec.)

Amendments (J0.2 line 70, J3.4 line 110):
- J0.2 before: `a toast "Approved — private QR link created (copied to clipboard)."` after: `a toast "Approved - private QR link created (copied to clipboard)." (plain hyphen; the normal navy success toast)`.
- J0.3: the step says "the same success toast", so no wording change beyond J0.2's.
- J3.4 before: `a green toast "Approved — private QR link created (copied to clipboard)." followed by a **red** toast` after: `the navy success toast "Approved - private QR link created (copied to clipboard)." followed by a **red** toast`.

## T-R2-2 Resume output draws the wrong member's Career Master (J5.2) - defect (T1 / F1-2 still open)
- `src/components/Output.jsx:1176`: `useOutputTemplateConfig` fetches `/api/career/master` with `owner` taken only from `?owner=`/`?profile=` (`useOutputOwnerSlug`, line 1148). On plain `/output/resume` owner is `''`.
- `server/routes/careerMaster.js:573-581` `resolveOwnerUserId('')` falls back to `resolveDefaultAdminUserId()`; the file `src/lib/careerMaster.js` header documents exactly this trap. So `ctx.master` (used by `career-trend-bars` and `career-duration-timeline` in `src/lib/outputBlocks.js:869-882`) is the platform admin's master, which has no dated roles: hence "Not enough dated..." and "No dated roles...".
- `/api/career/proficiency` (line 1179) is `requireUser` (`careerMaster.js:1568`) so it returns the signed-in member: why PROFICIENCY is right while trend/timeline are empty. The `/r/` page uses the stored owner, so it draws correctly.
- Reproduce: member with job Northwind Advisory 2019-01 to 2023-06, open `/output/resume`; `GET /api/career/master` without `owner` returns the admin's jobs; with `?owner=me` returns the member's.
- Fix: in `useOutputTemplateConfig` (and `useOutputOwnerSlug` consumers at Output.jsx lines 1370-1402, 1696, 2005 for consistency) use `owner || (signed-in user ? 'me' : '')` once auth has resolved, waiting for auth before fetching so the admin payload is never used for a signed-in member. Also make the fetch refetch when the user id changes. Files: `src/components/Output.jsx`. Do not change the server default (Betsy's public site relies on it).
- Risk to confirm with owner only if desired: a signed-in member opening Betsy's public `/output/resume` link without `?owner` would see their own data; the existing proficiency fetch already behaves this way.

## T-R2-3 E.4 noise list - spec_error (ambiguity; product behaves correctly)
- Observed: `GET /api/career/jobs net::ERR_ABORTED` (page reload required by J1.4 cancels an in-flight request) and four 409s (one per approval attempt that opens the gate; the spec text says "one ... per first approval", which is unclear).
- Amendment E.4 before: `...one HTTP 409 on /api/resume-outputs/<id>/share per first approval that opens the gate dialog; ...Anything else is a finding.` after: `...one HTTP 409 on /api/resume-outputs/<id>/share for each approval attempt that opens the gate dialog (J0.2 attempt, J0.3 if it opens, each J3.x attempt); a request cancelled by navigation or reload (net::ERR_ABORTED) is not a finding; ... Anything else is a finding.` Traces to: change spec "gate returns 409 when technologies lack a category".

## T-R2-4 Output templates have no MCP tool (J4.1, not scored) - defect
- `server/index.js:186` mounts `/api/output-templates`; it is absent from `GOVERNED_ROUTE_FILES` (`server/lib/capabilityParity.js:17`) and `server/lib/mcpToolRegistry.js`, so `scripts/check-interface-parity.mjs` cannot flag it.
- Fix: add `server/routes/outputTemplates.js` to GOVERNED_ROUTE_FILES, add parity rows (list/get/primary/save/set primary), and append MCP tools (e.g. `output_template_list`, `output_template_read`, `output_template_save`, `output_template_set_primary`) that call the same exported functions, plus update `server/data/mcpToolManifest.json`. Registry is append-only. Run `node scripts/check-interface-parity.mjs`.

## Validator observations
- J1.3 plain toast (coverage_gap + defect): `src/components/admin/CareerMasterPanel.jsx:363` uses `toast('Failed to load career master data: ...')`, i.e. the success style, though it is a load failure (the feature's goal: errors look like errors). Fix: `toast.error(...)`. The spec step only gives text, so propose adding a check. Amendment: step J1.3 before `a second toast "Failed to load career master data: Failed to load career catalogs"` after `a second toast, styled as an error (red, role alert), "Failed to load career master data: Failed to load career catalogs"`. Traces to: T2 / change spec "failures must not look like success". NOTE: the amendment only passes after the code fix.
- P1 "sign in as test admin": spec_error. Amend P1 before `sign in as the test admin` (as written) after `sign in as member@test.local (the admin's Classic Tools has no Career Master or My Resume)`. Traces to open bug B12.
- E.2 has no written setup: coverage_gap, amendment add under E.2 the exact setup steps used (clear Pipeline Tracker category via the UI, apply FAULT A, import changed package, approve, then cancel, then RESTORE). Needs a reviewer.
- Duplicate DOM toasts: probably React StrictMode double-invoke or double call; not reproduced in code reading, no step; log as an observation to investigate (likely a duplicate `toast()` call in `act()` of OpportunityOutputsSection or `host` creation). No fix assigned.
- "Back to World" overlaps brand text in Classic Tools desktop: cosmetic, no baseline step; no action this round.
- F1-5 / F1-6 untested: coverage_gap, propose adding steps for other /output pages (case study, one-pager) with a failing master, and the Career Atom sync / audit-write failure paths; needs reviewer and business input on expected wording.
- Seed deadlock concurrent with first boot: environment (tests ran seed during boot); no action.
- Evidence directory naming: environment/process, no action.

## Fix queue (for the fix agent)
1. T-R2-2 (Output.jsx owner resolution) - required for J5.2.
2. J1.3 toast.error in CareerMasterPanel.jsx:363.
3. T-R2-4 MCP/parity for output templates.
Spec-only (reviewer): T-R2-1, T-R2-3, J1.3 wording, P1, E.2.
