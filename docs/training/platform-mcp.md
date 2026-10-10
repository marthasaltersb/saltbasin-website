# Training spec - Platform MCP server: connect an AI agent as yourself, same permissions as the website, parity map

Audience: a person using the platform and a test agent driving a real browser plus a command line. Every step says exactly what to do and what you should see. All data is fictional (member **Test Member**, companies **Northwind Freight**, **Harbor Logistics**, **Fabrikam Test**, roles **Principal Value Architect**, **Staff Revenue Engineer**, technology **Ledgerly ERP**).

Version 1 · 2026-10-09 · change spec: `docs/changes/platform-mcp.md`

## Where things are

- **World Shell**: `/world`. Top bar **SALT BASIN / Your World** with tabs **World**, **Journeys**, **Classic Tools**. The **Journeys** tab is a list of cards.
- **Connected Agents** (card subtitle **Tokens for AI agents (MCP)**): full-screen page with **← Back to World** and the sections **How to connect**, **Create an access token**, **Your tokens**, **Tools an agent can call**. Available to every signed-in user.
- **Capabilities** (card subtitle **Website, API and MCP parity**): administrators only. Summary tiles, the filter buttons **All capabilities** / **Gaps only**, and one card per capability with three cells **Website**, **API**, **MCP**.
- **Career Placement Agents** card: panel with **+ Add**, the **TRACKED (n)** list, and for a selected opportunity the section **APPLICATION OUTPUTS** (cards with **Edit draft**, **Approve for QR**, **Unlink**).
- **Career Master** card: **Manual Intake** tab, **Tools (n)** button, **+ Add**.
- **MCP client**: `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN> list` prints one tool name per line then `<n> tools`; `... call <tool> '<json>'` prints `isError: true|false` then the result as JSON. It exits 1 and prints `CONNECT FAILED: ...` only when the server refuses the connection or the token. It uses the official `@modelcontextprotocol/sdk` client over Streamable HTTP. `<API_BASE>` is the address the browser's `/api` requests go to (the **MCP address** shown on the Connected Agents page, without the trailing `/mcp`).
- **Expected non-2xx responses** (anything else is a failure): `400` on `POST /api/platform/tokens` in J1.3, J1.4 and E.1 (the validation alerts); `409` on `POST /api/resume-outputs/:id/share` in J5.2 (the finalization gate). External font/CDN requests may fail offline and `favicon.ico` may 404; ignore those.
- Interfaces, per capability: website path, API route and MCP tool are listed on **Capabilities**; the same table is in `server/lib/capabilityParity.js`.

## Preconditions

1. [P.1] A fresh database is booted once and seeded (`npm run seed`); `node scripts/create-test-member.mjs` has run, giving the member `member@test.local` (password `TestPass!2345`, display name **Test Member**, platform and career terms accepted, no forced password change) and the administrator `betsy@test.local` (password = the test environment's `ADMIN_INITIAL_PASSWORD`, terms accepted). No other data exists.
2. [P.2] The API and the web client run, the browser opens the web client, and the viewport is 1280x900 (desktop pass) or 390x844 with touch (phone pass). Browser sessions are reused: sign in once per account and keep the session (sign-in is rate limited).
3. [P.3] Tokens from earlier steps are kept by the tester under the names **TOKEN_A** (Research assistant), **TOKEN_B** (Admin tool probe), **TOKEN_C** (Admin probe). A token is read from the page when it is created; it is never shown again.
4. [P.4] Each pass (desktop, phone) starts from its own fresh database; a pass never reuses tokens or data from the other pass.

## Journey 1 — Create an access token in the website

1. [J1.1] Sign in as the member at `/login`, open `/world`, click **Journeys**. Expect a card **Connected Agents** with the subtitle **Tokens for AI agents (MCP)**.
2. [J1.2] Click the card **Connected Agents**. Expect a page with **← Back to World**, the heading **Connected Agents**, the sections **How to connect**, **Create an access token**, **Your tokens** (containing **You have no access tokens yet.**) and **Tools an agent can call**, and under **MCP address** a value ending in `/mcp`.
3. [J1.3] Click **Create token** with the name empty. Expect a red alert reading **Give the token a name so you can recognise it later.**
4. [J1.4] Type **Research assistant** in **Token name** and click **Create token** with no scope ticked. Expect a red alert reading **Choose at least one scope for the token.** Expect six scope checkboxes: **career.read**, **career.write**, **outputs.approve**, **release.read (administrators only)**, **release.loop.read (administrators only)**, **release.loop.write (administrators only)**.
5. [J1.5] Tick **career.read**, **career.write** and **outputs.approve** (not release.read), click **Create token**. Expect a box reading **Copy your token now. It will not be shown again.** containing a token that starts with `sbpat_` (keep it as **TOKEN_A**), and in **Your tokens** an entry **Research assistant** with the pill **Active**, the line **Scopes: career.read, career.write, outputs.approve**, the text **Last used never** and **0 tool calls**.
6. [J1.6] Click **I have copied it**, reload the page, open **Journeys → Connected Agents** again. Expect the box to be gone, the full token text to appear nowhere on the page, and the entry to show only the first 12 characters of the token followed by `...`.
7. [J1.7] On this page, at the current viewport, expect no horizontal scrolling (the page is not wider than the viewport) and the **Create token** button to be at least 44 pixels tall.

## Journey 2 — Connect an MCP client and list the tools

1. [J2.1] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> list`. Expect exit code 0 and exactly these 96 tool lines in this order, then `96 tools`: `career_master_read`, `career_opportunities_list`, `career_opportunity_create`, `career_opportunity_open`, `application_outputs_list`, `application_output_open`, `application_output_new_draft_version`, `output_versions_list`, `output_version_read`, `output_versions_compare`, `application_output_approve_for_qr`, `application_output_revoke_qr`, `application_package_import`, `shared_output_resolve`, `career_opportunity_update_details`, `application_outputs_unlinked_list`, `application_output_link`, `application_output_unlink`, `cover_letter_open`, `cover_letter_agent_turn`, `cover_letter_settings_read`, `cover_letter_settings_save`, `cover_letter_opportunities_list`, `cover_letter_job_rec_save`, `cover_letter_generate`, `cover_letter_package_build`, `cover_letter_turns_list`, `resume_rollups_read`, `resume_rollup_preview`, `career_atom_rollups_read`, `career_experience_definitions_read`, `career_experience_definition_save`, `career_experience_definition_delete`, `career_proficiency_override_save`, `career_proficiency_override_clear`, `proficiency_rules_read`, `proficiency_override_set`, `proficiency_override_clear`, `technology_category_set`, `proficiency_formula_save`, `proficiency_formula_select`, `certification_mapping_save`, `shared_output_live_read`, `career_agent_hub_read`, `career_opportunity_scores_record`, `career_opportunity_approve`, `career_opportunity_advance_stage`, `career_research_run`, `career_pipeline_verify`, `career_verification_current_read`, `career_verification_current_save`, `career_agent_schedule_read`, `career_agent_schedule_save`, `career_outreach_read`, `career_outreach_start`, `career_outreach_research_contacts`, `career_outreach_draft_message`, `career_outreach_message_save`, `career_outreach_merge_outcome`, `career_resume_generate`, `career_resume_output_save`, `career_opportunity_resumes_list`, `career_resume_queue_generate`, `career_auto_queue_outputs`, `career_cover_letter_generate`, `career_cover_letter_output_save`, `career_output_view`, `career_outputs_email`, `resume_outputs_list`, `resume_output_generate`, `resume_output_staleness`, `resume_output_versions`, `resume_output_status_set`, `finalization_check`, `cover_letter_packages_list`, `cover_letter_job_text_set`, `cover_letter_draft_for_opportunity`, `cover_letter_packages_assemble`, `cover_letter_turns_read`, `cover_letter_metrics_read`, `career_rollups_read`, `career_rollup_preview_read`, `career_intake_documents_list`, `career_intake_linkedin_pull`, `career_intake_runs_list`, `career_intake_run_create`, `career_intake_run_execute`, `career_semantic_template_read`, `career_mappings_classify`, `career_mappings_lineage`, `career_mappings_commit`, `career_bounded_agent_action`, `career_record_list`, `career_record_create`, `career_record_update`, `career_record_delete`. No tool whose scope is release.read, release.loop.read or release.loop.write appears (those scopes were not ticked). The count line equals the number of tool lines.
2. [J2.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp list` (no token). Expect exit code 1 and a line starting `CONNECT FAILED` that contains `Missing or malformed access token.`
3. [J2.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token sbpat_not-a-real-token list`. Expect exit code 1 and a line starting `CONNECT FAILED` that contains `This access token is not recognised.`

## Journey 3 — Read through MCP and see the same data in the website

1. [J3.1] In the website open **Journeys → Career Placement Agents**, click **+ Add**, enter Job title **Principal Value Architect** and Company **Northwind Freight**, click **Track**. Expect the detail view with the section **APPLICATION OUTPUTS** containing a card titled **Cover Letter — Principal Value Architect at Northwind Freight**. Click **← Tracked list**: expect **TRACKED (1)** and a row **Principal Value Architect**.
2. [J3.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_opportunities_list`. Expect `isError: false` and a result with exactly one opportunity whose `metadata.jobTitle` is `Principal Value Architect`, whose `entities[0].canonicalName` is `Northwind Freight` and whose `currentStage` is `discovered`. Keep its `id` as **OPP_A**.
3. [J3.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_opportunity_open '{"opportunityId": <OPP_A>}'`. Expect `isError: false`, `opportunity.id` equal to OPP_A, exactly one entry in `outputs` with `title` `Cover Letter — Principal Value Architect at Northwind Freight`, `status` `draft` and `provenance.sourceLabel` `Generated from your Career Master` (the same card the website showed in J3.1).
4. [J3.4] In the website open **Journeys → Career Master → Manual Intake → Tools (0) → + Add**, enter NAME WHEN USED **Ledgerly ERP**, CATEGORY **ERP**, FIRST USED (YEAR) **2019**, # ROLES **2**, leave HOW IT WAS USED — PROFICIENCY CATEGORY at **(none)**, click **Save**. Expect the button **Tools (1)** and a row **Ledgerly ERP**. Click **← Back to World**.
5. [J3.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_master_read`. Expect `isError: false`; `tools` has exactly one entry that contains `Ledgerly ERP`; `jobs`, `skills`, `engagements`, `domains` and `certifications` are all empty lists.

## Journey 4 — Write through MCP and see the change in the website

1. [J4.1] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_opportunity_create '{"jobTitle": "Staff Revenue Engineer", "companyName": "Harbor Logistics"}'`. Expect `isError: false`, `currentStage` `discovered`, `metadata.jobTitle` `Staff Revenue Engineer` and `metadata.placeholder` `true`. Keep its `id` as **OPP_B**.
2. [J4.2] In the website reload `/world`, open **Journeys**. Expect the card **Career Placement Agents** to read **2 tracked · 7 agents**. Open it: expect **TRACKED (2)** and a row **Staff Revenue Engineer** with the tag **PLACEHOLDER**.
3. [J4.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call application_outputs_list '{"opportunityId": <OPP_B>}'`. Expect `isError: false` and exactly one output titled `Cover Letter — Staff Revenue Engineer at Harbor Logistics`. Keep its `id` as **LETTER_B**.
4. [J4.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call application_output_open '{"outputId": <LETTER_B>}'`. Expect `isError: false`, `id` equal to LETTER_B, `status` `draft` and `content.format` `document_blocks`.
5. [J4.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call application_output_new_draft_version '{"outputId": <LETTER_B>, "content": {"format": "document_blocks", "version": 1, "header": {"name": "Test Member", "headline": "", "contact": ""}, "blocks": [{"type": "paragraph", "text": "Dear Hiring Team, this draft was saved by an agent."}]}}'`. Expect `isError: false` and a result whose `parentVersionId` equals LETTER_B. Keep its `id` as **V2**.
6. [J4.6] In the website click the row **Staff Revenue Engineer**. Expect the cover letter card to read **version 2 of 2**, with in its provenance **Version 2 of 2 (edited from version 1)** and **v1 Draft > v2 Draft**.
7. [J4.7] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call application_output_new_draft_version '{"outputId": <V2>, "content": {"format": "document_blocks", "version": 1, "header": {"name": "Test Member", "headline": "", "contact": ""}, "blocks": [{"type": "paragraph", "text": "Dear Hiring Team, this draft was saved by an agent."}]}}'` (the same content as J4.5, now against the new version). Expect `isError: true` and an error with `status` 400, `code` `bad_request` and `message` `No changes to save.`

## Journey 5 — Approve for QR through the finalization gate, from both interfaces

1. [J5.1] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call application_output_approve_for_qr '{"outputId": <V2>}'`. Expect `isError: true` and an error with `status` 409, `code` `tool_category_required`, `message` `1 technology needs a proficiency category before this output can be finalized.` and `details.tools[0].label` `Ledgerly ERP`.
2. [J5.2] In the website, on the cover letter card of **Staff Revenue Engineer** click **Approve for QR**, then **Confirm approval**. Expect a dialog **Set how each technology was used** listing **Ledgerly ERP** with a dropdown. Choose the option that starts with **Hands-on**, click **Save to Career Master and continue**. Expect the badge **APPROVED - QR LIVE**, the line **QR link is live on version 2** and a link whose address starts with `/r/` (keep the address as **QR_PATH**).
3. [J5.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call application_output_new_draft_version '{"outputId": <V2>, "content": {"format": "document_blocks", "version": 1, "header": {"name": "Test Member", "headline": "", "contact": ""}, "blocks": [{"type": "paragraph", "text": "Dear Hiring Team, this is the version approved by an agent."}]}}'`. Expect `isError: false` and `parentVersionId` equal to V2. Keep its `id` as **V3**.
4. [J5.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call application_output_approve_for_qr '{"outputId": <V3>}'`. Expect `isError: false`, `movedFrom` equal to V2, and a `url` that ends with QR_PATH (the same QR address moved to the newer version).
5. [J5.5] In the website reload `/world`, open **Journeys → Career Placement Agents → Staff Revenue Engineer**. Expect **QR link is live on version 3**, the same link address QR_PATH, and the lineage **v1 Draft > v2 Approved > v3 Approved - QR live (QR)**.

## Journey 6 — Scopes, permissions and errors

1. [J6.1] In the website open **Journeys → Connected Agents**, type **Admin tool probe**, tick only **release.read**, click **Create token**. Expect the once-only token box; keep the token as **TOKEN_B**. Click **I have copied it**.
2. [J6.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_B> list`. Expect exactly the lines `release_tracker_read` and `1 tools`.
3. [J6.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_B> call release_tracker_read`. Expect `isError: true` and an error with `status` 403, `code` `forbidden` and `message` `release_tracker_read is for administrators only. You are signed in as a member.` (the token carries the scope, but the member may not do what the website would refuse).
4. [J6.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_B> call career_master_read`. Expect `isError: true` and an error with `status` 403 and `code` `scope_not_granted` whose message contains `"career.read" scope`.
5. [J6.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call no_such_tool`. Expect `isError: true` and an error with `status` 404, `code` `unknown_tool` and `message` `There is no tool named "no_such_tool".`
6. [J6.6] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_opportunity_open '{"opportunityId": "abc"}'`. Expect `isError: true` and an error with `status` 400, `code` `invalid_arguments` and `message` `"opportunityId" must be a whole number of at least 1.`
7. [J6.7] Run `node scripts/create-test-member.mjs --email gated@test.local --out <creds file>` (fictional second member, terms accepted). Sign in as gated@test.local in the website, open Journeys -> Connected Agents, type **Gated probe**, tick only **career.read**, click **Create token**; keep the token as **TOKEN_D**. Then withdraw that member's career terms: `curl -s -b <gated member cookie jar> -H "Content-Type: application/json" -d '{"consentType":"career_portfolio","granted":false}' <API_BASE>/api/career/consent`. Expect HTTP 200 and a body containing `"ok":true`.
8. [J6.8] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call career_opportunities_list`. Expect `isError: true` and an error with `status` 428, `code` `career_terms_required` and `message` `Accept the Career Portfolio terms in the website before agents can use your data.`. Run `list` with the same token: expect exit code 0 (listing tools is not a data call).
9. [J6.9] In the gated member's website session, open `/world`. Expect the Career Portfolio terms page (the member is asked to accept again) instead of the Journeys list; accept the terms. Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call career_opportunities_list` again. Expect `isError: false`.

## Journey 7 — An administrator, and another person's data

1. [J7.1] Sign in as the administrator in a second browser session, open `/world`, click **Journeys**. Expect the cards **Connected Agents** (subtitle **Tokens for AI agents (MCP)**) and **Capabilities** (subtitle **Website, API and MCP parity**).
2. [J7.2] Open **Connected Agents**, type **Admin probe**, tick **career.read**, **career.write** and **release.read**, click **Create token**. Expect the once-only token box; keep the token as **TOKEN_C**.
3. [J7.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call release_tracker_read`. Expect `isError: false` and a result whose `releases` is a list (it may be empty on a fresh database).
4. [J7.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_C> call career_opportunity_create '{"jobTitle": "Admin Probe Role", "companyName": "Fabrikam Test"}'`. Expect `isError: false`. Keep its `id` as **OPP_ADMIN**.
5. [J7.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_opportunity_open '{"opportunityId": <OPP_ADMIN>}'`. Expect `isError: true` and an error with `message` `Not your career opportunity.`
6. [J7.6] In the member's browser session open **Journeys**. Expect no card named **Capabilities**.

## Journey 8 — Tool calls are counted

1. [J8.1] In the member's session open **Journeys → Connected Agents**. Expect the entry **Research assistant** to read as many **tool calls** as the number of `call` commands you ran with TOKEN_A in this pass (count every `call` command, including the ones that returned `isError: true` and the unknown tool in J6.5; do not count `list` commands). With every step run once that is 14.

## Journey 9 — Revoke a token

1. [J9.1] On the **Research assistant** entry click **Revoke**. Expect the buttons **Confirm revoke** and **Cancel** on that entry.
2. [J9.2] Click **Cancel**. Expect the entry still **Active** and no **Confirm revoke** button.
3. [J9.3] Click **Revoke**, then **Confirm revoke**. Expect the pill **Revoked**, a line starting **Revoked** with a date, and no buttons left on that entry.
4. [J9.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> list`. Expect exit code 1 and a `CONNECT FAILED` line containing `This access token has been revoked.`
5. [J9.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_opportunities_list`. Expect exit code 1 and `CONNECT FAILED` containing `This access token has been revoked.`
6. [J9.6] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_B> list`. Expect exit code 0 and the line `release_tracker_read` (revoking one token does not affect another).

## Journey 10 — The Capabilities screen shows parity and gaps

1. [J10.1] In the administrator's session open **Journeys → Capabilities**. Expect the heading **Capabilities**, a tile reading `<n> of <m>` with **capabilities work in all three interfaces**, and tiles **website (UI) gaps**, **MCP gaps**, **API gaps**.
2. [J10.2] Count the capability cards with **All capabilities** selected: expect m cards. Click **Gaps only**: expect exactly m minus n cards. Click **All capabilities**.
3. [J10.3] Find the card **Approve an output for its QR link**. Expect its cells to read **Website ready**, **API ready** (showing `POST /api/resume-outputs/:id/share`) and **MCP ready** (showing `application_output_approve_for_qr`).
4. [J10.4] Find the card **Import an application package**. Expect the cells **Website ready** (showing the path ending `My Resume > Import an application package`), **API ready** (showing `POST /api/resume-outputs/import-package`) and **MCP ready** (showing `application_package_import`), and no highlighted gap cell. With **Gaps only** selected expect the message that there are no gaps (zero cards).
5. [J10.5] Find the card **Create, list and revoke access tokens**. Expect its MCP cell to read **MCP not offered** with the reason **Credentials are managed by a signed-in person in the website; a token can never mint or revoke tokens.**
6. [J10.6] At the current viewport expect the page to have no horizontal scrolling and each filter button to be at least 44 pixels tall.

## Journey 11 — The parity check script

1. [J11.1] Run `node scripts/check-interface-parity.mjs`. Expect exit code 0, a first line starting `Interface parity:`, and the last line `OK: the registry matches the code.` When the first line reports any gap count above 0 a `Gaps:` list follows it; when all three gap counts are 0 there is no `Gaps:` line.
2. [J11.2] Run `node scripts/check-interface-parity.mjs --strict`. Expect exit code 0, a first line `Interface parity: 72 of 72 capabilities work in all three interfaces (website UI gaps: 0, MCP gaps: 0, API gaps: 0).`, no `Gaps:` line, and the last line `OK: the registry matches the code.`
3. [J11.3] Run `node scripts/check-interface-parity.mjs --self-test`. Expect exit code 0, three lines starting `DETECTED:` (an API route with no capability row, a removed shipped tool, a row pointing at a missing tool) and the last line `SELF-TEST OK: all 3 injected problems were detected.`
4. [J11.4] Run `node scripts/check-interface-parity.mjs --json`. Expect exit code 0 and JSON whose `problems` is an empty list and whose `summary.total` equals m from J10.1.

## Edge cases

- [E.1] In **Create an access token**, type a name, tick one scope, type **0** in **Expires in (days, optional)**, click **Create token**. Expect a red alert reading **Expiry must be between 1 and 365 days.** and no new token in the list.
- [E.2] Run `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <TOKEN_B>" <API_BASE>/mcp` (a GET request). Expect `405` (the server is stateless: JSON-RPC requests are sent with POST).
- [E.3] Run `curl -s -o /dev/null -w "%{http_code}" <API_BASE>/mcp` (no token). Expect `401`.
- [E.4] Run `curl -s -o /dev/null -w "%{http_code}" <API_BASE>/api/platform/tokens` (no session cookie). Expect `401`: an access token page and its API need a signed-in person.
- [E.5] On **Connected Agents**, **Tools an agent can call** lists all eleven tool names (the ten from J2.1 and `release_tracker_read`), each with its scope.
- [E.6] On **Connected Agents**, at the current viewport, expect each scope checkbox row and each **Revoke** button (on the active **Admin tool probe** entry) to be at least 44 pixels tall.
