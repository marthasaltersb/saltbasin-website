# Reconciliation - career-bound-outputs fix round 3 (branch release-loop/career-bound-outputs-fix-r3, commit 4a70228)

Checked by reading the diff against integration head 07610d5, `npx vite build` (passes), and `docs/test-results/career-bound-outputs/round-3.md`. NOT driven in a browser by this agent (no server or database started, nothing to clean up). Rule applied: an item is resolved only when verified working; code-present but unwalked fixes stay unresolved until the round-4 validator passes them.

| # | Item | Kind | Status |
|---|---|---|---|
| 1 | Fix agent did not browser-walk J1.2, J6.3, J6.10, J11.2, J9.8, J9.10 | process | unresolved |
| J1.2 | Save changes disabled styling | product_defect | code fix present, unwalked: unresolved |
| J6.3 | Queue page dark-on-dark headings | product_defect | code fix present, unwalked: unresolved |
| J6.10/J11.2 | Dialog visible title | product_defect | code fix present, unwalked: unresolved |
| J9.8 | Tool not selectable by name | product_defect | code fix present, unwalked: unresolved |
| J9.10 | Revert makes row vanish | product_defect | code fix present, unwalked: unresolved |
| G1 | E.4 sync failure unreachable from UI | requirement_gap (spec defect) | unresolved |
| G2 | E.5 "red box" vs amber warning box | requirement_gap (spec defect) | unresolved |
| G3 | Convert button stays enabled after conversion (F2-8) | product_defect | unresolved |
| G4 | MCP_GAP: no career-bound / reconciliation MCP tools | requirement_gap | unresolved |
| G5 | Skills/tools/certs overrides invisible in default resume layout (F2-10) | requirement_gap | unresolved (owner decision) |
| G6 | Template overrides stored on the preset, not per document (F1-4/F2-3) | owner_direction_conflict | unresolved (owner decision) |
| G7 | Commit trailer Opus vs Sonnet | process | informational / owner |
| G8 | Residual low-contrast text in World Shell queue page (intro 2.24:1) | product_defect | unresolved |

## 1. No in-browser walk (process)
Evidence: change spec "Fix notes - round 3" says "The in-browser walk ... was NOT run in this fix pass". Build passes. Consequence: none of the six fixes is proven. Proposed fix: round-4 validator walks all six on desktop and 390 px; the fix agent should not claim them fixed.

## Per-step code evidence
- **J1.2**: `CareerBoundOutputEditor.jsx:26-31` `S.btn(tone, disabled)` adds opacity 0.5, not-allowed, grey fill; line 146 passes `saving || !dirty`. Same in `CareerReconciliationPanel.jsx:36-41`; all `disabled` call sites checked pass the flag, except the Convert button is correct but see G3. Needs browser proof that the style reads as disabled and Save enables once dirty.
- **J6.3**: `WorldShell.jsx` `careerReconciliation` has `light: true`; `SimpleEmbedView` wraps it in a `#fff` / `#1b2a3b` container (line 1392). Round-3 failure was rgb(27,42,59) on rgb(13,20,23); this removes the dark background. Unproven: the teal intro and section headings (2.24:1 in round 3) may carry their own colours that are poor on white, see G8. Files: src/components/WorldShell.jsx, src/components/admin/CareerReconciliationPanel.jsx.
- **J6.10 / J11.2**: `MyResumePanel.jsx:1116` adds `h2#career-sources-dialog-title` "Career Sources to Review", referenced by aria-labelledby. Unproven visually (contrast, 390 px header wrap).
- **J9.8**: `OutputTemplateConfigurator.jsx` `disp()` falls back to `nameUsed` for tools; option, label, Career Master line and comparison use it; override stored under `currentName`, which `masterOverrides.js` patches and `Output.jsx:625` shows when it differs from `nameUsed`. Plausible, unproven. Risk: the spec box text `Ledgerly ERP (template)` is now stored as currentName; verify the saved preset and `/output/resume` render.
- **J9.10**: `revert` now sets `setField(null)` and adds the id to `ovPicks[list]` so the row persists and shows the Career Master value with no badge. Applied to the shared `revert` handler (line ~546 uses it too). Unproven after a reload (the failing case: `ovPicks` empty after reload).

Proposed fix for all five: none in code yet; re-validate. If any still fails, the fix agent must run Playwright against a fresh DB first.

## Gaps the reported failures missed
- **G1 E.4**: round 3 UI_GAP. A sync failure cannot be produced from the interface. The spec step is frozen; propose an amendment in `docs/spec-amendments/career-bound-outputs/` (directory does not exist yet) such as a test hook or a server-fault precondition, reviewed by someone other than the proposer. Files: docs/training/career-bound-outputs.md (not to be edited directly).
- **G2 E.5**: product shows an amber warning box (role alert) consistent with the rest of the product; spec says red. Propose amendment "in an amber warning box". Not a product change.
- **G3 F2-8**: `CareerReconciliationPanel.jsx:310` disables Convert only on `busyId` or `openTasks`; `careerBound.js` convertible listing has no converted-output field. Repeated clicks can create duplicate outputs. Fix: report the existing output per package in the convertible list and show "Already converted - open".
- **G4 MCP_GAP**: `server/lib/mcpToolRegistry.js` exists on this branch but has no tools for create/edit/override/revert career-bound outputs, bullet library, package import, task approve/reject, convert, or per-preset master overrides (grep for career_bound/reconcil finds none; `application_output_*` and `resume_rollup*` tools exist). Round 3 said the registry did not exist; that is stale. Interface parity requires tools calling the same functions (`careerBound.js`, `packageReconciliation.js`) with the same permissions, finalize via `assertReadyToFinalize`, never an approve tool that skips it.
- **G5**: change spec Known limitations: resume layout prints jobs only, so skill/tool/cert overrides show nowhere by default. Owner to accept, or add a note in the card, or render those sections.
- **G6**: Known limitation: overrides live on the preset, not on a per-output row, so two documents from one preset cannot differ. The request was per-output overrides; round-3 treats this as by design pending owner confirmation. Owner decision; if rejected, store `masterOverrides` on the `resume_output_projections` row and apply in render/PDF.
- **G7**: two conflicting trailers (Opus in earlier task text, "Co-Authored-By: Claude" in this task). Orchestrator decides; nothing pushed or amended.
- **G8**: round-3 observation: teal intro paragraph 2.24:1 and dark section headings on the queue page; the `light` wrapper likely fixes the background but re-measure; if the panel's own heading colour is cream/teal it will now fail on white. Files: CareerReconciliationPanel.jsx.
- Other change-spec limits (no action): exact-name skill/tool matching; ambiguous role match raised as Add job; approve/publish/QR stay in My Resume history by design.

## Verified
- `npx vite build` passes on the branch.
- No spec or baseline files changed on the branch (diff touches only src/, the change spec, and release-log/triage docs).
