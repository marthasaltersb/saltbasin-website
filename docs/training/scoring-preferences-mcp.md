# Training spec - Opportunity scoring weights: World Shell card, API and MCP tools

Audience: a member using the platform, and a test agent driving a real browser plus a command line. Every step says exactly what to do and what you should see. All data is fictional (member **Test Member**). No opportunity needs to exist: the scoring weights do not depend on any tracked opportunity.

Version 1 · 2026-10-10 · change spec: `docs/changes/scoring-preferences-mcp.md`

## Where things are

- **World Shell**: `/world`. Top bar **SALT BASIN / Your World** with tabs **World**, **Journeys**, **Classic Tools**. The **Journeys** tab is a list of cards.
- **Scoring weights card**: **Journeys** → card **Career Placement Agents** → in the right-hand panel, the button **Scoring Weights** (it reads **Hide Scoring Weights** while open). The card is headed **OPPORTUNITY SCORING WEIGHTS** (shown in capitals) and has eight percentage fields, a line **Total: n%**, the button **Save My Weights** and, only while custom weights are in force, the button **Reset to Salt Basin Default**. The fields, top to bottom, with their default values: **Role scope and altitude** 15, **Strategic operations and transformation** 15, **Revenue systems / Q2R / monetization** 15, **AI validation and data intelligence** 15, **PE / value creation / finance relevance** 15, **Leadership and stakeholder fit** 10, **Transferable industry fit** 5, **Practical fit** 10. Each field's accessible name is `Weight for <label> (percent)`, for example `Weight for Practical fit (percent)`. Opening the card again after leaving the page always shows what is saved.
- **Connected Agents**: **Journeys** → card **Connected Agents** (subtitle **Tokens for AI agents (MCP)**): full-screen page with **← Back to World**, the field **Token name**, the scope checkboxes (**career.read**, **career.write**, ...), the button **Create token**, and after creating, a box **Copy your token now. It will not be shown again.** containing a token that starts with `sbpat_`.
- **MCP client**: `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN> list` prints one tool name per line then `<n> tools`; `... call <tool> '<json>'` prints `isError: true|false` then the result as JSON. `<API_BASE>` is the address the browser's `/api` requests go to, shown on Connected Agents as **MCP address** without the trailing `/mcp`.
- **Interfaces for this capability**: website = the card above; API = `GET`, `PUT`, `DELETE` `/api/career-agents/scoring-preferences` (same route the card calls); MCP = `career_scoring_preferences_read`, `career_scoring_preferences_save`, `career_scoring_preferences_reset`. The save tool's argument is `{"body": {"weights": {"<dimension key>": <fraction>}}}` where fractions total 1.0 (the website shows percentages, the API and MCP use fractions: 15% is `0.15`). Dimension keys, in the card's order: `scope_altitude`, `strategic_ops_transformation`, `revenue_systems_q2r`, `ai_validation_data_intel`, `pe_value_creation_finance`, `leadership_stakeholder_fit`, `transferable_industry_fit`, `practical_fit`.
- **Expected non-2xx responses** (anything else is a failure): none in the browser; the MCP error steps in J2.5 and J2.6 and J5.3 are MCP results with `isError: true`, not browser requests. External font/CDN requests may fail offline and `favicon.ico` may 404; ignore those.

## Preconditions

1. [P.1] A fresh database is booted once and seeded (`npm run seed`); `node scripts/create-test-member.mjs` has run, giving the member `member@test.local` (password `TestPass!2345`, display name **Test Member**, platform and career terms accepted, no forced password change). No other data exists, and the member has no saved scoring weights.
2. [P.2] The API and the web client run, the browser opens the web client, and the viewport is 1280x900 (desktop pass) or 390x844 with touch (phone pass). Browser sessions are reused: sign in once and keep the session (sign-in is rate limited).
3. [P.3] Tokens created in the steps below are kept by the tester under the names **TOKEN_A** (Scoring probe) and **TOKEN_B** (Read only probe). A token is read from the page when it is created; it is never shown again.
4. [P.4] Each pass (desktop, phone) starts from its own fresh database; a pass never reuses tokens or data from the other pass.

## Journey 0 - First login

1. [J0.1] Open `/login` and sign in with `member@test.local` / `TestPass!2345`. Expect the World Shell with **Test Member** and **Member** in the top bar and no password or consent page.

## Journey 1 - See the defaults and change them in the World Shell

1. [J1.1] Click **Journeys**, click the card **Career Placement Agents**, then click the button **Scoring Weights**. Expect the card **OPPORTUNITY SCORING WEIGHTS** with the line **Changes only your own opportunity scores, never another member's.**, the label **Salt Basin default**, the eight fields with values 15, 15, 15, 15, 15, 10, 5, 10 (in the order listed under Where things are), the line **Total: 100%**, the button **Save My Weights** enabled, and no **Reset to Salt Basin Default** button.
2. [J1.2] Set the field **Weight for Role scope and altitude (percent)** to `20`. Expect the line to read **Total: 105% (must total 100% to save)** in red, and **Save My Weights** disabled.
3. [J1.3] Set the field **Weight for Practical fit (percent)** to `5`. Expect **Total: 100%** (no warning text) and **Save My Weights** enabled.
4. [J1.4] Click **Save My Weights**. Expect a success notice **Saved — this changes only your own opportunity scores, never another member’s.**, the label now reading **Your custom weights**, the fields reading 20, 15, 15, 15, 15, 10, 5, 5, and a button **Reset to Salt Basin Default** below **Save My Weights**.

## Journey 2 - The same weights through MCP

1. [J2.1] Click **← Back to World**, then **Journeys → Connected Agents**. In **Token name** type `Scoring probe`, tick **career.read** and **career.write** (and nothing else), click **Create token**. Expect the box **Copy your token now. It will not be shown again.** with a token starting `sbpat_`; keep it as **TOKEN_A**.
2. [J2.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> list`. Expect exit code 0, the three lines `career_scoring_preferences_read`, `career_scoring_preferences_save` and `career_scoring_preferences_reset` among the tool lines, and a final line `<n> tools` where n equals the number of tool lines.
3. [J2.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_scoring_preferences_read`. Expect `isError: false` and a result with `isPersonalOverride` true, `currentKey` `career_match_scoring_v1`, eight `dimensions`, the one with `key` `scope_altitude` having `weight` 0.2 and the one with `key` `practical_fit` having `weight` 0.05 (the values saved in J1.4), and a `platformDefaultDimensions` list in which `scope_altitude` is 0.15.
4. [J2.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_scoring_preferences_save '{"body": {"weights": {"scope_altitude": 0.25, "strategic_ops_transformation": 0.15, "revenue_systems_q2r": 0.15, "ai_validation_data_intel": 0.1, "pe_value_creation_finance": 0.1, "leadership_stakeholder_fit": 0.1, "transferable_industry_fit": 0.05, "practical_fit": 0.1}}}'`. Expect `isError: false`, `isPersonalOverride` true, `scope_altitude` weight 0.25 and `practical_fit` weight 0.1.
5. [J2.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_scoring_preferences_save '{"body": {"weights": {"scope_altitude": 0.2, "strategic_ops_transformation": 0.15, "revenue_systems_q2r": 0.15, "ai_validation_data_intel": 0.1, "pe_value_creation_finance": 0.1, "leadership_stakeholder_fit": 0.1, "transferable_industry_fit": 0.05, "practical_fit": 0.05}}}'`. Expect `isError: true` and an error with `status` 400, `code` `bad_request` and `message` `Weights must sum to 1.0 (got 0.900).`
6. [J2.6] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_scoring_preferences_save '{"body": {"weights": 5}}'`. Expect `isError: true` and an error with `status` 400, `code` `bad_request` and `message` `weights must be an object of { dimensionKey: weight }.`
7. [J2.7] In the browser go **← Back to World**, **Journeys → Career Placement Agents → Scoring Weights**. Expect **Your custom weights** and the fields reading 25, 15, 15, 10, 10, 10, 5, 10 (the MCP save from J2.4; the rejected calls in J2.5 and J2.6 changed nothing), and **Total: 100%**.

## Journey 3 - Reset through MCP

1. [J3.1] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_scoring_preferences_reset`. Expect `isError: false`, `isPersonalOverride` false, `scope_altitude` weight 0.15 and `practical_fit` weight 0.1.
2. [J3.2] In the browser click **← Back to World**, then **Journeys → Career Placement Agents → Scoring Weights**. Expect the label **Salt Basin default**, the fields reading 15, 15, 15, 15, 15, 10, 5, 10, and no **Reset to Salt Basin Default** button.
3. [J3.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_scoring_preferences_reset`. Expect `isError: false` and `isPersonalOverride` false again (resetting when nothing is custom is safe and changes nothing).

## Journey 4 - Reset in the website, confirmed through MCP

1. [J4.1] In the open card set **Weight for Role scope and altitude (percent)** to `20`, **Weight for Practical fit (percent)** to `5`, and click **Save My Weights**. Expect the label **Your custom weights** and the button **Reset to Salt Basin Default**.
2. [J4.2] Click **Reset to Salt Basin Default**. Expect a success notice **Reverted to the Salt Basin default weights.**, the label **Salt Basin default**, the fields reading 15, 15, 15, 15, 15, 10, 5, 10, and the reset button gone.
3. [J4.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call career_scoring_preferences_read`. Expect `isError: false`, `isPersonalOverride` false and `scope_altitude` weight 0.15.

## Journey 5 - A read-only token cannot change weights

1. [J5.1] In the browser go **← Back to World**, **Journeys → Connected Agents**. In **Token name** type `Read only probe`, tick only **career.read**, click **Create token**. Expect the once-only token box; keep the token as **TOKEN_B**.
2. [J5.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_B> list`. Expect the line `career_scoring_preferences_read` and no line `career_scoring_preferences_save` or `career_scoring_preferences_reset`.
3. [J5.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_B> call career_scoring_preferences_save '{"body": {"weights": {"scope_altitude": 0.25, "strategic_ops_transformation": 0.15, "revenue_systems_q2r": 0.15, "ai_validation_data_intel": 0.1, "pe_value_creation_finance": 0.1, "leadership_stakeholder_fit": 0.1, "transferable_industry_fit": 0.05, "practical_fit": 0.1}}}'`. Expect `isError: true` and an error with `status` 403, `code` `scope_not_granted` and a message that names `career.write` and `career_scoring_preferences_save`.
4. [J5.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_B> call career_scoring_preferences_read`. Expect `isError: false` and `isPersonalOverride` false (nothing was changed by J5.3).

## Journey 6 - Fit and tap targets at the current viewport

1. [J6.1] In the browser go **← Back to World**, **Journeys → Career Placement Agents → Scoring Weights**. Expect the page not to scroll sideways (the page is not wider than the viewport) and, in the card, every field and the button **Save My Weights** to be fully visible inside the screen width.
2. [J6.2] On a phone-width pass (390 pixels wide), expect the button **Save My Weights** and the button **Scoring Weights** to each be at least 44 pixels tall. On the desktop pass this step passes when step J6.1 passes.

## Edge cases

- [E.1] A field left empty counts as 0 in the total: clearing **Weight for Practical fit (percent)** from the defaults shows **Total: 90% (must total 100% to save)** and **Save My Weights** is disabled; typing `10` back shows **Total: 100%**.
- [E.2] Weights that total 100% but with a field of `0` are accepted by the card (the dimension then has no influence): set **Weight for Transferable industry fit (percent)** to `0` and **Weight for Practical fit (percent)** to `15`, click **Save My Weights**; expect **Your custom weights** with those values. Click **Reset to Salt Basin Default** afterwards.
- [E.3] `curl -s -w " %{http_code}" http://localhost:<API_PORT>/api/career-agents/scoring-preferences` with no cookie prints an error body followed by status 401 and none of the weights.
- [E.4] Run `node scripts/check-interface-parity.mjs` exits 0 and prints `Interface parity: 110 of 110 capabilities work in all three interfaces (website UI gaps: 0, MCP gaps: 0, API gaps: 0).`
- [E.5] Weights are per member: the weights saved by `member@test.local` never appear for another member (a second member created with `node scripts/create-test-member.mjs --email second@test.local` and signed in shows **Salt Basin default** with 15, 15, 15, 15, 15, 10, 5, 10 while the first member has custom weights).
