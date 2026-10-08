# Change spec — cover letter for every opportunity, package table of contents, cover-letter agent

Version 1 · 2026-10-02 · branch `release-loop/cover-letter-agent-build` (built on integration head `dd3f321`)

## Traces to

- `docs/changes/proficiency-rules-and-live-qr.md` (commits `a0ff84a`, `f1ad622`, `b1ae2d3`) — the finalization gate (`assertReadyToFinalize` / `useToolCategoryGate`) that approving a letter or package goes through, the QR page that renders an approved package, and the "no silent failures" rule (`8fc685e`, `dd58da6`).
- CLAUDE.md → "Tailored application packages + QR-gated sharing" — `document_blocks` v1, `resume_output_projections` lineage, `application_package:<key>:<variant>` preset ids, approval/QR rules. Everything here files ordinary `resume_output_projections` rows; nothing parallel.
- CLAUDE.md → "Career Placement Agents" — `career_opportunity_target` rods (`careerOpportunityRollups.js`), `resume_output_projections.career_opportunity_rod_id` (the existing opportunity↔output link, `db.js` 2026-08-07).
- `2086080`, `dd3f321` — the release-loop process this spec follows.

## What changed, in one paragraph

Every tracked job opportunity now gets a cover letter: a deterministic, template-driven draft (no LLM) is filed into the member's outputs the moment the opportunity is created, and a **Generate for this opportunity** button files one on demand. The combined application package is now assembled into one document with a **numbered table of contents** (page numbers and clickable links in the PDF, links in the digital view and on the QR page), always led by the cover letter. A **cover-letter agent** — a side chat on a cover letter — edits that one letter through iterative edit operations: it searches only the letter's own package, tries deterministic rules first, calls the cheapest configured language model only if those cannot satisfy the request, and shows every proposal as tracked changes the member accepts (new draft version) or rejects. Template, model and tone presets are edited on a settings screen.

## Data model (additive only)

| Where | What |
| --- | --- |
| `cover_letter_settings` (new table) | One row per member: `settings JSONB` = `{ autoDraft, provider, model, template{…}, tonePresets[…] }`, `updated_at`. Own table because `career_experience_definitions` seeds per type on "has any row" — a new row type would suppress other seeds. Never seeded; defaults live in code (`DEFAULT_SETTINGS`). |
| `cover_letter_agent_turns` (new table) | One row per chat turn: `session_key`, `projection_id` (letter version it was made against), `lineage_root_id`, `opportunity_rod_id`, `request_text`, `route` (`rules` \| `llm` \| `search_only` \| `refused` \| `blocked` \| `failed`), `outcome_message`, `search_hits JSONB`, `proposed_ops JSONB`, `status` (`proposed` \| `accepted` \| `rejected` \| `none`), and the LLM record: `llm_called`, `model`, `provider`, `input_tokens`, `output_tokens`, `tokens_estimated`, `latency_ms`, `llm_attempts`, plus `result_projection_id` (the new version an accept created) and timestamps. **This is the table the session/contribution trends read**: group by `session_key` / `user_id` for LLM-vs-rules turns, tokens and latency (`metricsSummary()` and `GET /api/cover-letters/metrics` are the first consumer). |
| `resume_output_projections` | No schema change. New values only: `output_type='cover_letter'` rows with `source='generated'` and `preset_id='cover_letter:opp-<rodId>'` (one lineage per opportunity); the combined package is `output_type='application_package'`, `preset_id='application_package:opp-<rodId>:combined'`. The opportunity link is the existing `career_opportunity_rod_id`. |
| `document_blocks` v1 content | Two new block types, **`toc`** and **`section_start`** (`{title, anchor, number, sourceOutputId}`), plus a top-level `package` object (`kind:'application_package'`, section list with source output ids) on combined packages, and an optional `role` on paragraph blocks (`date`, `salutation`, `body`, …). Additive; the renderer and `DocumentBlocksView` ignore what they do not know. |
| `journey_rod_events` | New `event_type`s on an opportunity rod: `cover_letter_drafted`, `cover_letter_autodraft_failed`, `job_rec_text_updated`. Job-rec text is stored in the rod's existing `metadata.notes` (JSONB merge). |

No existing row is rewritten; nothing is seeded for members; the block registry is untouched.

## Server

- `server/lib/opportunityHooks.js` — post-create hook seam. `careerOpportunityRollups.createCareerOpportunity()` calls it after the rod exists (the **only** edit to a shared lib file, 3 lines).
- `server/lib/coverLetterAutoDraft.js` — registers the hook; `ensureCoverLetterForOpportunity(userId, rodId, {force})` builds and files the draft (force = new draft version in the same lineage); `setJobRecText()`; failures are recorded as an event and shown in the UI, never swallowed.
- `server/lib/coverLetterTemplate.js` — defaults, `validateSettings()` (unknown placeholders, bad model names and malformed tone presets are refused with a message), `getSettings`/`saveSettings`, `buildCoverLetterContent()` (pure: template + job-rec fields + Career Master entries from `getCareerAtomEntries`; BM25 picks which jobs/skills to cite; a clause whose data is missing is omitted, nothing is invented).
- `server/lib/packageSearch.js` — local deterministic search: tokenise + light stemming + **BM25** over the blocks of the letter's package; `packageMemberRows()` is the single definition of package membership; `jobRecText()`; `buildPackageLibrary()`.
- `server/lib/coverLetterRules.js` — the deterministic resolver (pure): scope refusals (edit the resume / look beyond the package or on the web), tone presets, `replace "X" with "Y"`, delete a paragraph / remove a phrase, swap / move paragraphs, shorten (filler removal + drop the sentence least related to the job rec), `mention <thing>` (quotes the best matching resume/other-document block — never the job rec, which says what the employer wants, not what the member did), find / "where do I mention …" (search-only answer), and otherwise `needs_llm` with the paragraphs the model may touch.
- `server/lib/coverLetterEdits.js` — operations `replace` / `insert_after` / `delete` / `move`, validation (≤6 ops, ≤1500 chars, paragraph exists), `applyOps`, word-level `buildDiff`, and `assertTargetedEditSet()` (LLM output must stay inside the paragraphs it was given and must not rewrite ≥60% of the letter).
- `server/lib/coverLetterLlm.js` — providers `anthropic` (existing `getAnthropicKey()` = member BYO key or `ANTHROPIC_API_KEY`; forced `propose_edits` tool call; daily run cap via `checkAndRecordRunAllowance('cover_letter_agent','llm_edit')`) and `stub` (offline, deterministic, labelled everywhere). Context sent = request + ≤5 search hits (≤300 chars each) + only the affected paragraphs. Output that is not a targeted edit set is rejected and retried once with the reason; a second rejection fails the turn visibly with usage still recorded. No key → turn route `blocked`, nothing sent.
- `server/lib/coverLetterAgent.js` — `openLetter`, `runTurn` (search → rules → LLM → record), `decideTurn` (accept = `createResumeOutputProjection` with `regenerateFromId`, i.e. a **new draft version**; refuses if a newer version exists; rejects restore nothing because nothing was changed), `listTurns`, `metricsSummary`. The agent can only read/modify the one letter; package outputs are read-only evidence.
- `server/lib/packageAssembly.js` — `assembleApplicationPackage()`: cover letter first (filed from the template if the opportunity has none — "always includes the cover letter"), then each resume of the opportunity (or `application_package:<key>:*` siblings), as numbered sections after a title block + `toc`. Re-assembly files a new draft version; unchanged members file nothing.
- `server/lib/outputRendering.js` — `toc` / `section_start` rendering; packages are laid out **twice** (pass 1 records the page each section starts on, pass 2 prints them), each TOC entry is a `GoTo` link to a named destination, every page gets "Page n of N". Documents without these blocks render exactly as before.
- `server/lib/resumeProjection.js` — one-word change: `source:'generated'` is allowed without a Career Master fingerprint (a letter can be drafted for a member with no Career Master yet; it then simply has no experience paragraphs).
- `server/lib/applicationPackages.js` — `toc` / `section_start` added to the accepted block types.
- `server/routes/coverLetters.js` (`/api/cover-letters`, member-scoped): `GET|PUT /settings`, `GET /opportunities`, `PUT /opportunities/:id/job-rec`, `POST /opportunities/:id/cover-letter` (`{force}`), `POST /opportunities/:id/package`, `POST /packages/assemble` (`{packageKey}` for imported sets), `GET /letters/:id`, `GET|POST /letters/:id/turns`, `POST /turns/:id/accept|reject`, `GET /metrics`. **Approve / publish / QR are not here**: they stay on `PATCH /api/resume-outputs/:id/status` and `POST /api/resume-outputs/:id/share`, which already run `assertReadyToFinalize`.

## Client

- `src/components/admin/CoverLetterPackagesPanel.jsx` — section "Cover letters and application packages" at the top of **My Resume**: one row per tracked opportunity (job-rec text editor, cover letter state, **Generate for this opportunity** / **Regenerate from template**, **Edit with cover-letter agent**, **Add a resume to this package** (existing import endpoint), **Build package with contents** / **Rebuild package**, **Download package PDF**) and **Cover-letter settings**.
- `src/components/admin/CoverLetterWorkbench.jsx` — the side-chat editor (letter with numbered ¶, tracked changes, versions; chat with evidence, "LLM: not used / used · model · tokens · ms", Accept / Reject; session metrics; Approve / Publish via `useToolCategoryGate().run`; a Settings tab). Opened from the history row button **Edit with cover-letter agent** or from the panel.
- `src/components/admin/CoverLetterSettings.jsx` — template, provider, model (default = cheapest Claude model, `claude-haiku-4-5-20251001`), auto-draft switch, tone presets (rename, contractions, `find => replace` lines, add/remove).
- `src/components/DocumentBlocksView.jsx` — renders `toc` (numbered links) and `section_start`.
- Edits to existing files: `MyResumePanel.jsx` (+11 lines: mount panel, history button, workbench), `api.js` (+12 entries), `DocumentBlocksView.jsx`, `index.js` route mount, `package.json` script `test:cover-letter-agent`.
- `tests/cover-letter-agent.test.js` — 9 pure unit tests (search, rules, edit validation); `npm run test:cover-letter-agent`.

## Behaviour changes to know

- Creating an opportunity by **any** path (Track Opportunity form, spreadsheet import, research agent) now also files a cover letter draft (unless the member switched auto-draft off in settings). A failure to draft is recorded and shown on the member's row, and never fails the opportunity creation.
- The pre-existing LLM-based "Generate Cover Letter for This Opportunity" in the World Shell rail is untouched; it produces a different shape (`openingHook` / `bodyParagraphs`). The agent opens those too (they are converted to paragraphs on the first accepted edit) and packages include them.
- The package TOC lists **sections**, not individual resumes inside one section; a package with a cover letter and two resumes has three entries.
- The member's name/email appear in the letter header (their own data, as every other output).
- The agent never sees Career Master. Facts reach the letter only from the template (Career Master at draft time) or from text already in the package.

## Integration hook points (for the World Shell / Career-Master-bound-output branches)

1. **Reading the opportunity↔output link** — `findOpportunityLetter()` in `server/lib/coverLetterAutoDraft.js` and `collectPackageSections()` / `peekOpportunityPackage()` in `server/lib/packageAssembly.js` (all three query `career_opportunity_rod_id`). If the other branch adds a link table, change those queries only.
2. **Writing the link** — the `careerOpportunityRodId` argument in `ensureCoverLetterForOpportunity()` and in `assembleApplicationPackage()` (`createResumeOutputProjection(...)`); add the link-table insert next to them.
3. **Package membership for the agent's confinement** — `packageMemberRows()` in `server/lib/packageSearch.js`. This is the *only* place that decides what the agent may search.
4. **Opportunity creation** — `runOpportunityCreatedHooks()` in `createCareerOpportunity()`; a new creation path that does not call `createCareerOpportunity` should call `runOpportunityCreatedHooks({userId, rodId})`.
5. **World Shell UI** — mount `<CoverLetterWorkbench outputId onClose onChanged />` (self-contained; needs only a cover-letter output id) wherever linked draft outputs are listed; the rail's cover-letter button can call `api.generateOpportunityCoverLetter(rodId)` (template, no LLM) instead of / next to the LLM generator, and its package button `api.assembleOpportunityPackage(rodId)`.
6. **Career-Master-bound outputs with overrides** — the template reads Career Master through `loadLetterInputs()` in `coverLetterTemplate.js`; swap that one function if outputs gain bound/overridden Career Master values.

## Verified (initial check, 2026-10-02, fresh database, Chromium via Playwright)

- `npm run build` passes; server boots on a fresh database (new tables created, no warnings); `npm run test:cover-letter-agent` 9/9.
- All journeys of `docs/training/cover-letter-agent.md` walked once on desktop (1366×950) and the 390×844 check: 48/48 steps pass; no page errors. Expected non-2xx/aborted requests only: `409` on the first Approve (the technology gate), `400` on saving a template with an unknown placeholder, the aborted PDF navigation of a download; sandbox-only: the three.js CDN is unreachable (Crystal Orbit), and one unrelated `404` resource that also loads on the public home page.
- Package PDF checked with `pdftotext`/`pypdf`: contents list with page numbers, `GoTo` link annotations to named destinations, "Page n of N" on every page, QR present once approved.
- Real Anthropic SDK path exercised against a local stand-in for the Messages API (no key, no network): request used the configured model, forced `propose_edits`, sent only the two affected paragraphs; token counts parsed from `usage`; a whole-letter rewrite was rejected on both attempts with usage summed (`attempts: 2`). Not exercised: a real model response.

## Known limitations

- No manual typing/editing in the workbench — all changes go through the agent (by design for this slice); the letter is read-only text there.
- Tone presets are word/phrase rules (what the member wrote in Settings), not style transfer; "make it sound more X" for an unknown X goes to the language model.
- `shorten` is rule-based (filler words, one low-relevance sentence); it can propose no change.
- Rules parse English phrasings listed in the training spec; other phrasings fall through to the LLM (or the "blocked/no key" message).
- The stub provider is a visible Settings choice; it is for tests and demos and says so in every reply.
- Token counts for the stub are estimates (chars/4) and are marked "(estimated)".
- Package assembly does not yet include the member's Career Master charts; a combined package is text sections only.
- Observed, not changed: a member who has not accepted the career-portfolio terms sees a blank Classic Tools shell (`/api/member-config/draft` answers 428); the training preconditions record the agreement first.

## Fix notes per round

(none yet)
