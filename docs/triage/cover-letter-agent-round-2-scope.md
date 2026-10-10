# Scope review: cover-letter-agent round 2

Base for reproduction: 312f128 (first parent of merge a5e7883, which merged release-loop/cover-letter-agent-build / 4be0bec).
Reuse: docs/triage/cover-letter-agent-round-1-scope.md (T1 pre_existing, T8 and T9 this_feature) and scope-review.json B3/B11. No contrary evidence found.
No code changed, nothing committed. No server or database was started; each decision rests on commit history and source at the named commits, which is deterministic for these items.

| id | scope | owner | evidence |
|---|---|---|---|
| T1 | pre_existing | - | Same as round 1. `git blame` of src/brand.css lines 630-631 (the `.sb-admin-topbar-actions` hide at <=900px) is eb62057 (2026-08-09), long before the base 312f128; the mobile drawer CSS has no JSX consumer at the base either. 4be0bec never touched AdminShell.jsx or the nav CSS. The My Resume tab is not part of this feature's request. |
| T10 | this_feature | cover-letter-agent | The hyphen toast was set by 73505f4, a fix on this feature's branch to satisfy three other specs. The remaining mismatch is the em dash in J2.6 of docs/training/cover-letter-agent.md, this feature's own spec. Spec error; needs an amendment (hyphen), not a product change. |
| T9 | this_feature | cover-letter-agent | Request says the agent is reachable from the World Shell opportunity view; round 1 already classified it this_feature (B3, B11). J10.1 now exists in baseline v2 (A1). Defect in this feature's own deliverable. |
| T8 | this_feature | cover-letter-agent | The two capabilityParity.js rows (cover-letter-turn-decide, cover-letter-add-resume) were introduced by 4be0bec's routes/coverLetters.js. Whether they stay MCP exclusions is an owner decision (needs_business_definition), but the capability and the open question belong to this feature. Owner question: should accept/reject of an agent proposal and add-resume-to-package (file upload) get MCP tools, or stay website-only? |
| T11 | other_feature | qr-gated-outputs | The "Import an application package" card (data-testid="package-import") was added to MyResumePanel.jsx by 47cddd6 (platform-mcp fix round 1, 2026-10-09) to give the application-package import (d78bcda, qr-gated-outputs) a UI entry point. 4be0bec did not add or restyle it. The card is the application-package import surface, so the owning feature is qr-gated-outputs (introducing commit is platform-mcp's, which is not a listed feature key). |
| F1-12 | other_feature | qr-gated-outputs | `git blame` of DocumentBlocksView.jsx:31 (`'Not yet approved'` whenever metadata.approvedBy is empty) is d78bcda (2026-10-02, QR-gated outputs authorship metadata). 4be0bec's only edits to DocumentBlocksView.jsx/outputRendering.js are unrelated (PDF keywords/ApprovedBy refactor). Reproduces on the base for any Approved row without approvedBy. |
| T13 | this_feature | cover-letter-agent | Product matches the change spec; docs/training/cover-letter-agent.md J6.2/J6.3 order (open the approved version from Resume Output History while the full-screen dialog is open, then close at J6.3) is unreachable. Spec error in this feature's own spec; needs an amendment. |

## Proposed amendments (for the amendment reviewer; specs not edited)
- T10: J2.6 toast text uses a hyphen, matching the product and the qr-gated-outputs, no-silent-failures and proficiency specs.
- T13: reorder J6.2/J6.3 so the dialog is closed before Resume Output History is opened.

## Owner question (T8, needs_business_definition)
Should "accept/reject a proposed edit" and "add a resume to a package from a file" have MCP tools, or remain website-only exclusions? platform-mcp.md lines 72 and 89 say this awaits owner confirmation.
