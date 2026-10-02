# Training spec — cover letter for every opportunity, package table of contents, cover-letter agent

Audience: a member using the platform, and a test agent driving a browser. Each step says exactly what to do and what you should see. All data below is fictional (member Casey Rowan, role "Principal Value Architect", company "Northwind Freight").

## Where things are

- **Sign in**: `/login`. You land on the World (`/world`).
- **Classic Tools**: on the World page click **Classic Tools** (top bar). Its tabs are used below: **Career Master**, **Career Placement Agents**, **My Resume**.
- **Cover letters and application packages**: **Classic Tools → My Resume**, the section at the top (above "Resume Output History"). Each tracked opportunity is one row. **Cover-letter settings** is the button in that section's header.
- **Cover-letter agent**: the button **Edit with cover-letter agent** — on an opportunity row, and on every cover-letter row of **Resume Output History**. It opens a full-screen dialog "Cover letter and agent": the letter on the left (paragraphs numbered ¶1, ¶2 …), the chat on the right. Two tabs at the top: **Letter and agent** and **Settings**.
- **Package PDF**: **Download package PDF** on an opportunity row (or **Download PDF** on the package row in Resume Output History).

## Environment (set up by the test harness, not part of the journeys)

- The server runs with **no `ANTHROPIC_API_KEY`** and without a member BYO key. (Journey 7 depends on it; a real key makes Journey 7 not applicable and Journey 4 can then also be run with the real provider.)
- Member creation is invite-only, so the harness creates the member: server env `PUBLIC_MEMBER_SIGNUP_ENABLED=true`, `POST /api/members/signup` with email `casey.rowan@example.test`, display name "Casey Rowan"; then `POST /api/auth/change-password` to `Casey-Rowan-2026-pw!`; then records the career-portfolio terms agreement (`POST /api/career/consent`). Without the last step Classic Tools shows a blank shell until the terms are agreed (known, outside this feature).
- Fresh database. The sign-in limiter allows few attempts; if the login page says "Too many attempts", restart the server.
- A text file `northwind-resume.txt` on the test machine with exactly this content (blank lines matter — each blank-line-separated block is one searchable block):

```
Casey Rowan
Principal Value Architect

SUMMARY

Value architect focused on pricing strategy and renewal forecasting for freight and logistics accounts.

EXPERIENCE

Kubernetes cost governance across 40 clusters, reducing cloud spend by 18 percent.

Contract renewal forecasting for freight accounts, cutting churn surprises by 30 percent.

Executive stakeholder alignment on value realization for multi-year freight contracts.
```

## Preconditions (through the UI)

1. Go to `/login`. Email `casey.rowan@example.test`, password `Casey-Rowan-2026-pw!`, click **SIGN IN ↗**. Expect the World page.
2. Click **Classic Tools**, then the **Career Master** tab, click the card **Manual Intake**, click the **Jobs (0)** button.
3. Click **+ Add**. In the dialog "Add Entry" fill COMPANY `Harbor Logistics`, TITLE `Value Architect`, START DATE `2019`, leave END DATE empty, KEY METRICS & ACHIEVEMENTS `led a pricing redesign that raised contract margin by 4 points`. Click **Save**.
4. **+ Add** again: COMPANY `Brightline Freight`, TITLE `Revenue Operations Lead`, START DATE `2015`, END DATE `2019`, KEY METRICS & ACHIEVEMENTS `built renewal forecasting that cut churn surprises by 30 percent`. **Save**. Expect the button **Jobs (2)**.
5. Click **Tools (0)**, **+ Add**. In the first field (NAME WHEN USED) type `Ledgerly ERP`; leave "How it was used — proficiency category" as **(none)**. **Save**. Expect **Tools (1)**.
6. Click the **Career Placement Agents** tab, click **+ Track Opportunity**. Job Title `Principal Value Architect`, Company `Northwind Freight`, Location `Remote`. Click the submit button **Track Opportunity**. Expect "Tracked Opportunities (1)".

## Journey 1 — The cover letter drafts itself, and can be generated on demand

1. Click the **My Resume** tab. Find the section **Cover letters and application packages**.
   - Expect one row **Principal Value Architect — Northwind Freight · discovered**.
   - Expect the line "No job rec text on this opportunity — the draft uses only the title, company and location."
   - Expect **Cover letter: Draft (#N)** and the buttons **Edit with cover-letter agent** and **Regenerate from template**.
2. Scroll to **Resume Output History**.
   - Expect a row **Cover Letter — Principal Value Architect at Northwind Freight · cover letter** with status **Draft**, and the line "Authors: Casey Rowan".
   - Click **View** on it. Expect the letter: "Dear Northwind Freight hiring team,", an opening paragraph naming "Principal Value Architect role at Northwind Freight (remote)", a paragraph "At Harbor Logistics as Value Architect (2019 – present), led a pricing redesign …", a paragraph "At Brightline Freight as Revenue Operations Lead (2015 – 2019), built renewal forecasting …", a closing paragraph, "Sincerely," and "Casey Rowan". No sentence invents a fact that is not in your Career Master. Click **Close**.
3. In the row, open **Job rec text** (click the word), paste into "Paste the job posting": `Northwind Freight is hiring a Principal Value Architect to own pricing strategy and renewal forecasting for freight accounts, and to align executive stakeholders on value realization.` Click **Save job rec text**.
   - Expect the toast "Job rec text saved. Use “Regenerate from template” to apply it to the cover letter." and the line "Job rec text attached (183 characters)."
4. Click **Regenerate from template**.
   - Expect the toast "Regenerated from the template as a new draft version." and **Cover letter: Draft (#N+1)** (a new number). The history now holds both versions.
   - Open the new version with **View**: the opening now reads "My background lines up with your need for pricing, renewal and forecasting."
5. Click **Cover-letter settings**. Untick **Automatically draft a cover letter when a job opportunity is added**. Click **Save settings**. Expect the toast "Cover-letter settings saved." Click **Hide settings**.
6. Go to the **Career Placement Agents** tab; **+ Track Opportunity**: Job Title `Senior Pricing Analyst`, Company `Fabrikam Logistics`, Location `Chicago`; **Track Opportunity**. Return to **My Resume**.
   - Expect a second row **Senior Pricing Analyst — Fabrikam Logistics** with **Cover letter: none yet** and the button **Generate for this opportunity**. (No draft was made because auto-draft is off.)
7. Click **Generate for this opportunity**. Expect the toast "Cover letter drafted." and **Cover letter: Draft (#N)** on that row; the history has **Cover Letter — Senior Pricing Analyst at Fabrikam Logistics**.

## Journey 2 — The package PDF has a table of contents, cover letter first

1. On the **Principal Value Architect** row click **Add a resume to this package**; in the file chooser pick `northwind-resume.txt`.
   - Expect the toast "Added “northwind-resume.txt” to this package as a resume." and the row line "Package: not built · includes the cover letter + 1 resume output".
2. Click **Build package with contents**. Expect the toast "Package built with a table of contents." and "Package: **Draft** (#N)". The history gains **Application Package — Principal Value Architect at Northwind Freight · application package**.
3. Click **Download package PDF**. Open the PDF (3 pages):
   - Page 1: "Casey Rowan", "APPLICATION PACKAGE — PRINCIPAL VALUE ARCHITECT — NORTHWIND FREIGHT", "Application package: Principal Value Architect — Northwind Freight", the heading **CONTENTS**, and a numbered list with leader dots and page numbers: `1. Cover letter … 2` then `2. Imported Resume — northwind-resume.txt … 3`. The cover letter is entry 1.
   - Page 2 starts "SECTION 1 / Cover letter" followed by the letter text. Page 3 starts "SECTION 2 / Imported Resume — northwind-resume.txt".
   - Every page ends "Page n of 3". In a PDF viewer, clicking a contents entry jumps to its section (the entries are links).
4. On the **Senior Pricing Analyst** row (it has a letter but no resume) click **Build package with contents**. Expect "Package built with a table of contents." Its PDF has 2 pages with `1. Cover letter … 2`.
5. In **Resume Output History** find the Principal Value Architect package row and click **View**. Expect a **Contents** list "1. Cover letter", "2. Imported Resume — northwind-resume.txt" followed by the sections; clicking an entry scrolls to its section. **Close**.
6. (After Journey 6, when the technology gate is satisfied.) On that package row click **Approve for QR**, confirm the browser prompt. Expect the toast "Approved — private QR link created (copied to clipboard)." and a link `/r/<slug>` under the row. Open the link in a new tab: the page shows the same **Contents** list. **Download PDF** on the package row now also shows the QR at the top right of page 1 and the same table of contents.

## Journey 3 — A chat edit satisfied by the package search, no LLM

1. On the Principal Value Architect row click **Edit with cover-letter agent**. Expect the dialog "Cover letter and agent": title "Cover Letter — Principal Value Architect at Northwind Freight", "Version #N · Draft", the letter with ¶1 … ¶10, and on the right "Cover-letter agent" with the scope text: "I can read and change **this cover letter only**. I search only this package (2 outputs + job rec text) — never Career Master, other members or the web. I try the search and rules first and only call a language model (claude-haiku-4-5-20251001) if they can’t do it."
2. Type `Replace "hiring team" with "talent team"` and click **Send**.
   - Expect your message, then a reply with the tags **Answered by rules** and **Awaiting your decision**, the text `Replaced "hiring team" with "talent team" in 2 paragraphs (exact text match).`, the line **LLM: not used**, and a collapsible **Evidence used — package search (n matches)** listing the blocks it searched (for example "Cover letter ¶4: Dear Northwind Freight hiring team,").
   - In the letter, ¶2 and ¶4 show tracked changes: "Hiring" struck through in red and "Talent" underlined in green; each changed paragraph carries a **changed** tag. Buttons **Accept changes** and **Reject** in the reply.
3. Click **Accept changes**. Expect a toast "Accepted — saved as a new draft version (#M). The earlier version is unchanged." The letter reads "Dear Northwind Freight talent team,"; the line under the letter lists one more version than before ("Versions: v1 #… v2 #… v3 #… ← current").
4. Type `Mention Kubernetes cost governance` and **Send**.
   - Expect **Answered by rules**, a message beginning "Added a paragraph after ¶7 quoting what the package says ("Kubernetes cost governance across 40 clusters, reducing cloud spend by 18 percen…") from Resume: Imported Resume — northwind-resume.txt.", **LLM: not used**, and in the letter a green new paragraph "Relevant to this role: Kubernetes cost governance across 40 clusters, reducing cloud spend by 18 percent." marked **inserted**. The Evidence list names the resume.
   - Click **Reject**. Expect a toast "Rejected — the letter is unchanged." and the inserted paragraph disappears.

## Journey 4 — A request that needs the LLM (offline test stub), shown as an edit, not a regenerated letter

1. Click the **Settings** tab (top right of the dialog). Under "Language model" set **Provider** to **Offline test stub (no network, no real model)**. Leave **Model (cheapest available)** at `claude-haiku-4-5-20251001`. Click **Save settings** (toast "Cover-letter settings saved."). Click **Letter and agent**.
2. Type `Make the opening sound more confident` and **Send**.
   - Expect the tags **Answered with the language model** and **Awaiting your decision**, the text "Offline test stub edit — not a real model.", and the line **LLM: used · model offline-test-stub · <n> tokens in / <m> out (estimated) · <t> ms · 1 attempt**. "Evidence used — package search (0 matches)".
   - In the letter exactly one paragraph (¶5, the opening) is marked **changed**, with an appended green insertion ` [Test stub edit for: "Make the opening sound more confident"]`; every other paragraph is unchanged. The summary line says "Replace ¶5."
3. Click **Reject**. The letter has no "Test stub edit" text.
4. Type `Please stub:regenerate the whole letter` and **Send**.
   - Expect the tags **Failed** and **No change** and the message "The model did not return a targeted edit set after 2 attempts (7 operations is more than a targeted edit (maximum 6).). The proposal was rejected and the letter is unchanged." with **LLM: used · model offline-test-stub · … · 2 attempts**. The letter is unchanged.
5. At the bottom of the chat: "This session: <k> messages · <j> used a language model · <a> tokens in / <b> out · <x> accepted, <y> rejected". The counts match what you did (only the stub turns count as language-model turns).

## Journey 5 — Out-of-scope requests are refused with an explanation

Send each message; each reply is red-tinted with the tag **Refused**, **No change**, and **LLM: not used — request refused**:

1. `Rewrite my resume summary` → "I can only change this cover letter. I can read the package’s resumes and job rec text as evidence, but I can’t edit them. Open the resume to change it."
2. `What is Northwind Freight's annual revenue?` → "That isn’t in this package — no text contains: annual. I can only search the cover letter, the package’s resumes and the job rec text, so I can’t look it up anywhere else." (the Evidence list may still show the blocks that mention Northwind Freight).
3. `Search the web for Northwind Freight revenue` → "I can only search the content inside this application package (the cover letter, the package’s resumes and the job rec text). I can’t look anything up on the web, on other sites, or in other people’s data."
4. `Mention blockchain consulting` → "Nothing in this package mentions "blockchain consulting". I can only work from the cover letter, the package’s resumes and the job rec text, and I don’t add facts that aren’t in them. …"
5. `Where do I mention pricing?` → not a refusal: tag **Answered from package search**, "Here is what the package says (n matches, best first). I proposed no change to the letter." with the matching blocks under Evidence.

## Journey 6 — Accepting creates a new version; approved versions are never edited; approval goes through the gate

1. Click **Approve** (top of the dialog).
   - Expect a dialog "Set how each technology was used" listing **Ledgerly ERP** (the tool without a category). Choose any option in the select "How Ledgerly ERP was used" and click **Save to Career Master and continue**.
   - Expect toasts "Saved to Career Master: 1 technology categorised" and "Approved."; the header reads "Version #N · Approved" and the **Publish** button appears.
2. Type `Replace "talent team" with "recruiting team"`, **Send**, then **Accept changes**.
   - Expect the header "Version #M · **Draft**" (a new number) and the version line to show the previous version as "(approved)" and the new one "(draft) ← current". The approved version’s text still says "talent team" (open it from Resume Output History → **View** on the approved row).
3. Click **Close**. In **Resume Output History** both versions are listed: the approved one and the new draft.

## Journey 7 — No API key: a clear message, nothing silently fails

(Requires a server without `ANTHROPIC_API_KEY` and a member without a BYO key — the environment above.)

1. Open the agent dialog → **Settings** → **Provider** = **Anthropic API (uses your configured key)** → **Save settings** → **Letter and agent**.
2. Send `Make the opening sound more confident`.
   - Expect the tags **Could not run** and **No change**; an alert-styled message: "No Anthropic API key is configured. Nothing was sent to a model and the letter is unchanged. Add a key in your Config panel (Bring Your Own Claude) or ask your admin to set ANTHROPIC_API_KEY — or pick the offline test stub under Settings to try the flow."; the line "LLM: not used — not available (see message)". The letter is unchanged and the session line does not count a language-model turn.
3. Requests the rules can satisfy still work with this provider: `Replace "recruiting team" with "talent team"` → **Answered by rules**, **LLM: not used**.

## Journey 8 — Settings are editable and validated

1. **Settings** tab (in the dialog, or **Cover-letter settings** in the My Resume section). Confirm the fields: Provider, Model (cheapest available) with the hint "Default: claude-haiku-4-5-20251001 …", the template fields (Subject line, Salutation, Opening paragraph, three Experience paragraph variants, Skills paragraph, Closing paragraph, Sign-off, the "mention" sentence, Number of experience paragraphs, Include a skills paragraph), and the **Tone presets** Formal, Warm, Direct.
2. Replace the Opening paragraph with `I am writing about the {bogus} role.` and click **Save settings**.
   - Expect a red alert: `Template field "opening" uses an unknown placeholder {bogus}. Allowed: {company} {jobTitle} …` and nothing saved.
3. Restore `I am writing to apply for the {jobTitle} role at {company}{locationClause}. {fitSentence}` and **Save settings** (toast).
4. In **Tone presets → Formal**, the Replacements box contains lines like `a lot of => substantial`. In the chat send `Make it more formal`: expect **Answered by rules**, **LLM: not used**, and edits that expand contractions / apply those replacements — or, when the letter has nothing to change, the message `The "Formal" tone preset found nothing to change in the letter. Presets and their wording rules are editable under Settings.`

## Journey 9 — Phone width (390 × 844)

1. Resize the browser to 390 × 844 and open **Edit with cover-letter agent**.
   - Expect the dialog to fill the screen with no horizontal page scroll; the header buttons wrap onto two lines; the letter is above the chat; scrolling down reaches the chat, the example chips, the message box and **Send**.
2. Send `Shorten paragraph 6`.
   - Expect a reply with **Accept changes** / **Reject** reachable by scrolling and the proposed change visible as tracked changes in the letter above (or the message "… so I proposed no change").

## Edge cases

- **Stale proposal**: with two browser tabs on the same letter, accept a proposal in tab A, then (without refreshing) accept an older proposal in tab B → toast "The letter has a newer version than the one this proposal was made against. Ask again so the edit applies to the current text." Nothing is changed; after the tab refreshes, that older reply is tagged "Superseded — the letter has a newer version" and has no Accept/Reject buttons.
- **Empty message**: **Send** is disabled until text is typed.
- **Another member's letter**: opening a letter id that is not yours (via the URL of the API) answers "Cover letter not found." — the dialog shows "Could not open this cover letter: …".
- **Not a cover letter**: the agent only opens cover letters; a resume id answers "The cover-letter agent only works on cover letters. This output is a resume."
- **No job rec text**: the drafts still file, and the row says so; the agent’s search then covers only the letter and the package’s resumes ("2 outputs + job rec text" becomes "2 outputs, no job rec text attached").
- **Package without a letter**: building a package for an opportunity that has no cover letter files one first (Journey 2 step 4 in a variant where the auto-draft failed). A package key without any cover letter is refused with "This package has no cover letter. Every application package must include one — create it from the opportunity first."
- **A failed automatic draft** is shown on the opportunity row as a red alert "The automatic cover-letter draft failed (<time>): <reason>" with the Generate for this opportunity button available.
