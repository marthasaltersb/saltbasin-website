# Salt Basin Website — Test Scenarios & Test Scripts

**Scope:** 43 deployed backlog items (status = `deployed`) as of 2026-06-07.
**Tester:** Run scenarios in order within each capability group. Use the **Log Test Run** block at the bottom of each script to record results.

## How this doc is organized (matches the admin-panel spec)

Each backlog item gets:

- **Test Scenario** — has: scenario description, requirement it covers, user who should be logged in, dependencies (data / email / config) needed to run the script.
- **Test Script** (child of scenario) — has: steps, expected outcomes, how to verify, and a Log Test Run block (Pass / Fail / Blocked + defect notes).

When a script fails, the defect notes feed a new `backlog_items` row with `kind='defect'` and `parent_id` set to the failing scenario's backlog item.

## Test users / environments

| Role | Login | Where it lives |
|---|---|---|
| Admin | `betsysalter@saltbasin.net` / `ADMIN_INITIAL_PASSWORD` from `.env` | https://saltbasin.net/admin/login |
| Test member | Create one via `/signup` before run begins (suggest `tester-member@saltbasin.net`) | https://saltbasin.net/signup |
| Test lead | Create by submitting any public form with `tester-lead@saltbasin.net` | https://saltbasin.net/lead/:publicId |
| Public visitor | No login | https://saltbasin.net |

**Shared dependencies for the whole run:**

1. Brevo API key live + sender `betsysalter@saltbasin.net` verified.
2. Inbox access to `betsysalter@saltbasin.net` (Zoho) AND `tester-lead@saltbasin.net` AND `tester-member@saltbasin.net`.
3. Render backend + Netlify frontend both green; warm the backend with one request before starting (cold start ~30s).
4. Test member + test lead created in advance (see table above).
5. Admin browser: Chrome desktop primary, plus Safari iOS or Chrome Android for mobile-flagged scenarios.

---

# Group 1 — Platform Foundation

## Scenario 1: CMS admin login & draft→publish workflow

- **Requirement covered:** Backlog #1 — *Configurable CMS with admin login and draft/publish workflow*
- **User logged in:** Admin
- **Dependencies:** Admin credentials in `.env`; at least one editable page exists (Home).

### Test Script

**Steps:**
1. Go to `/admin/login`, enter admin email + password, submit.
2. In the admin sidebar, open the Home page in the editor.
3. Edit a hero headline; click **Save Draft**.
4. Open `/` in an incognito tab — confirm public copy is unchanged.
5. Back in admin, click **Publish**.
6. Refresh the incognito tab on `/`.

**Expected outcomes:**
- Step 1: redirect to `/admin` with the sidebar visible.
- Step 3: draft persists across refresh; public site still shows old copy.
- Step 6: public site shows the new copy.

**How to verify:** Compare hero copy between admin draft state and incognito `/`; confirm only post-publish reflects the change. Confirm `updated_at` bumped on the page row (visible in admin pane footer).

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 2: Pre-launch landing gate

- **Requirement covered:** Backlog #2 — *Password-protected pre-launch landing gate*
- **User logged in:** Public visitor (no login)
- **Dependencies:** Pre-launch gate toggled ON in admin config; gate password known to tester.

### Test Script

**Steps:**
1. In admin, enable pre-launch gate and set a known password. Save.
2. Open incognito tab, navigate to `/`.
3. Submit a wrong password.
4. Submit the correct password.
5. Reload `/` in the same incognito tab.

**Expected outcomes:**
- Step 2: gate screen shown, public marketing site NOT visible.
- Step 3: error message, still gated.
- Step 4: real site loads.
- Step 5: still unlocked (cookie persists).

**How to verify:** DevTools → Application → Cookies shows the gate-unlock cookie set after step 4.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 3: Block library composes page sections

- **Requirement covered:** Backlog #3 — *Block library for composable page sections*
- **User logged in:** Admin
- **Dependencies:** A page in draft state to test on.

### Test Script

**Steps:**
1. Open admin editor for any draft page.
2. Add a **Hero** block, then a **Text** block, then an **Image** block.
3. Reorder so Image is first, then Hero, then Text.
4. Save draft and view preview pane.
5. Delete the Image block; save; refresh preview.

**Expected outcomes:**
- Each block renders correctly in the preview pane.
- Reorder reflects in preview without page refresh.
- Deleted block disappears from preview.

**How to verify:** Preview matches editor block order; the page's `blocks` JSON in the network tab includes only the remaining blocks.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 4: Brand tokens + Strategic Operator palette applied

- **Requirement covered:** Backlog #4 — *Brand tokens + Strategic Operator palette*
- **User logged in:** Public visitor (no login)
- **Dependencies:** None.

### Test Script

**Steps:**
1. Open `/` in browser.
2. Open DevTools → Computed styles on the hero heading.
3. Check page background, button background, and link color against the Strategic Operator palette (deep navy `#1B2A3B`, ochre `#C4843A`, sage `#A8B89A`).
4. Open `/admin/login` — same palette applied.

**Expected outcomes:**
- All sampled colors match brand tokens; no off-palette colors on home or admin login.

**How to verify:** DevTools shows colors resolve from CSS variables (e.g., `var(--sb-navy)`), not raw hex values inline.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 5: Postgres-backed CMS reads/writes survive restart

- **Requirement covered:** Backlog #5 — *Supabase Postgres migration (from SQLite)*
- **User logged in:** Admin
- **Dependencies:** Supabase project live; `DATABASE_URL` env var set on Render.

### Test Script

**Steps:**
1. Log into admin, edit a page, publish.
2. From the Render dashboard, manually restart the backend service.
3. Wait for backend health to come back (~30s).
4. Refresh `/` in incognito.

**Expected outcomes:**
- After restart, the published change is still present (proves persistence is in Supabase, not in-memory).

**How to verify:** `/api/pages/home` JSON returned by the backend shows the new block content after restart.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 2 — Multi-tenant CMS

## Scenario 6: Member admin parity (same shell, scoped data)

- **Requirement covered:** Backlog #6 — *Member admin parity*
- **User logged in:** Test member
- **Dependencies:** Test member account exists; admin account exists.

### Test Script

**Steps:**
1. Log in as test member, open `/member`.
2. Note the sidebar tabs visible to the member.
3. In a separate browser session, log in as admin and open `/admin`.
4. Compare sidebar shells — both should use the same AdminShell.
5. As member, edit a page on the member site.
6. In the admin session, navigate to admin pages list — confirm member's page is NOT visible to admin's editor (separate tenant scope).

**Expected outcomes:**
- Identical shell components and styles for member and admin.
- Member sees only their own pages/leads; admin does NOT see member's content (and vice versa).
- Member sees no admin-only tabs (Backlog, Net Works roster).

**How to verify:** Network calls from member admin go to `/api/users/me/...`-scoped routes; admin calls go to `/api/...` global routes.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 7: Member brand-color overrides scoped to /u/:slug

- **Requirement covered:** Backlog #7 — *Member brand-color overrides*
- **User logged in:** Test member
- **Dependencies:** Test member account with known slug (e.g., `/u/tester`).

### Test Script

**Steps:**
1. Log in as test member, open Config → Brand Colors.
2. Set primary color to a distinct value (e.g., `#FF6600`).
3. Save.
4. Open `/u/tester` in incognito.
5. Open `/` in same incognito tab.

**Expected outcomes:**
- `/u/tester` reflects the new orange palette.
- `/` (Salt Basin home) is UNAFFECTED — Strategic Operator palette intact.

**How to verify:** DevTools computed style on `/u/tester` hero = `#FF6600`; on `/` = the Salt Basin navy.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 8: Member BYO Anthropic API key

- **Requirement covered:** Backlog #8 — *Member BYO Anthropic API key (for future Config Agent)*
- **User logged in:** Test member
- **Dependencies:** Valid Anthropic API key (use a throwaway test key, not production).

### Test Script

**Steps:**
1. Log in as test member, open Config → API Keys.
2. Paste an Anthropic key, save.
3. Refresh; confirm the key is masked (e.g., `sk-ant-...XYZW`) and not echoed back in plaintext.
4. Replace with a clearly invalid key (e.g., `sk-ant-invalid`), save.
5. (If a "Test Key" button exists) click it.

**Expected outcomes:**
- Valid key saves and is masked on reload.
- Invalid key either rejected on save or flagged on test.
- Key never appears in plaintext in the DOM or network response after save.

**How to verify:** DevTools → Network → response body for `/api/users/me/config` shows masked key only.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 9: New member gets default starter site

- **Requirement covered:** Backlog #9 — *Default member starter site (Home / About / Contact)*
- **User logged in:** Brand-new member (sign up during the test)
- **Dependencies:** Use a fresh email (e.g., `tester-member-2@saltbasin.net`).

### Test Script

**Steps:**
1. Go to `/signup`, create a new member account.
2. Immediately after signup, visit `/u/<new-slug>`.
3. Inspect the page list in member admin.

**Expected outcomes:**
- New member's public profile shows Home / About / Contact pages with sensible placeholder copy.
- Admin page list shows 3 starter pages in `draft` or `published` state.

**How to verify:** `/api/users/<id>/pages` returns ≥ 3 page rows immediately after signup.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 41: Member Templates Phase A — 3 starter templates

- **Requirement covered:** Backlog #41 — *Member Templates Phase A — 3 starter templates seeded*
- **User logged in:** Test member
- **Dependencies:** Test member exists.

### Test Script

**Steps:**
1. Log in as test member, open Templates / Page library.
2. Browse the 3 starter templates.
3. Apply one template to a new page; save draft; publish.
4. Open the public profile to see the rendered template.

**Expected outcomes:**
- Exactly 3 starter templates are visible.
- Applying a template populates the new page with the template's block structure.
- Published page renders the template visually.

**How to verify:** `/api/templates` returns 3 entries; new page's `blocks` JSON matches the template's blocks.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 3 — Lead Capture & Identity

## Scenario 10: Lead capture with match-and-merge dedup

- **Requirement covered:** Backlog #10 — *Lead capture with email + phone + match-and-merge dedup*
- **User logged in:** Public visitor (no login) for submission; Admin to verify.
- **Dependencies:** Brevo live (lead gets confirmation email); admin inbox accessible to see notification.

### Test Script

**Steps:**
1. Open `/` in incognito; submit Contact form with `tester-lead@saltbasin.net`, name "Tester A", phone `555-123-4567`.
2. Note the confirmation modal — copy the lead URL + one-time password.
3. Submit the same Contact form again with the same email but different name "Tester B" and phone `(555) 123-4567`.
4. Submit a **third** time using a DIFFERENT email but same phone digits.
5. Log in as admin → Leads panel. Find `tester-lead@saltbasin.net`.

**Expected outcomes:**
- Step 2: modal shows lead URL + password exactly once.
- Step 3: no new lead row created; existing lead gets a new activity entry.
- Step 4: still no new lead row (matched by phone digits).
- Step 5: admin sees ONE lead with 3 activity rows, prior_notes preserves earlier messages.

**How to verify:** `/api/leads` from admin shows lead count grew by exactly 1 across the 3 submissions. Lead's `prior_notes` JSON contains the earlier message bodies.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 11: Password-protected lead record at /lead/:publicId

- **Requirement covered:** Backlog #11 — *Password-protected lead record at /lead/:publicId*
- **User logged in:** Lead (using the URL + password from Scenario 10)
- **Dependencies:** Completed Scenario 10 (gives valid lead URL + password).

### Test Script

**Steps:**
1. Open the lead URL from Scenario 10 in a fresh incognito window.
2. Enter the wrong password.
3. Enter the correct password.
4. Refresh.
5. Try guessing a different `publicId` in the URL.

**Expected outcomes:**
- Step 2: error message, no record shown.
- Step 3: lead record visible (activity log, contact info, etc.).
- Step 4: still authenticated (session cookie persists).
- Step 5: 404 / not-found (no enumeration possible).

**How to verify:** Network response is 401 for wrong password; 200 with record JSON for correct; 404 for unknown publicId.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 12: Lead → member conversion flow

- **Requirement covered:** Backlog #12 — *Lead → member conversion flow*
- **User logged in:** Lead (then converts to member)
- **Dependencies:** Authenticated lead session from Scenario 11.

### Test Script

**Steps:**
1. From the authenticated lead view, click "Become a member" (or equivalent CTA).
2. Complete the signup form (set a new password).
3. After signup, navigate to `/member`.
4. As admin, verify the lead row links to the new member row.

**Expected outcomes:**
- Conversion succeeds without re-asking for email.
- New member has access to `/member` dashboard.
- Admin sees the lead row linked to (or merged with) the member row.

**How to verify:** Admin Leads panel shows the lead with a "converted → member" status / member_id reference.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 13: Lead view shows email log

- **Requirement covered:** Backlog #13 — *Lead view shows email log*
- **User logged in:** Lead
- **Dependencies:** At least one email already sent to that lead (confirmation from Scenario 10 counts).

### Test Script

**Steps:**
1. Open authenticated lead view.
2. Scroll to the email log section.
3. From admin, trigger a new transactional email to that lead (e.g., resend confirmation).
4. Refresh the lead view.

**Expected outcomes:**
- Email log lists the initial confirmation email with timestamp + status.
- After step 3, the new email appears in the log within a refresh.

**How to verify:** Email log entries match rows in `lead_emails` table for that lead.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 4 — Email Infrastructure

## Scenario 14: Zoho mailbox active for betsysalter@saltbasin.net

- **Requirement covered:** Backlog #14 — *Zoho mailbox at betsysalter@saltbasin.net*
- **User logged in:** Tester needs Zoho webmail access to that mailbox.
- **Dependencies:** Zoho Forever Free plan still active; DNS MX records pointing to Zoho.

### Test Script

**Steps:**
1. From a personal email account, send a test message to `betsysalter@saltbasin.net`.
2. Open Zoho webmail and check the inbox.
3. Reply from Zoho.
4. Confirm the reply arrives at the personal account.

**Expected outcomes:**
- Inbound mail received in Zoho within 1 minute.
- Outbound reply delivered to the personal account.
- DMARC report does not flag the reply as failing.

**How to verify:** Use `dig MX saltbasin.net` (or https://mxtoolbox.com) to confirm MX → Zoho; Gmail's "Show original" on the reply shows DKIM + SPF pass.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 15: Brevo transactional sending replaces Resend

- **Requirement covered:** Backlog #15 — *Brevo transactional email (swap from Resend)*
- **User logged in:** Admin
- **Dependencies:** `BREVO_API_KEY` set on Render; sender verified in Brevo.

### Test Script

**Steps:**
1. From the public Contact form, submit as `tester-lead@saltbasin.net`.
2. Open Brevo dashboard → Transactional → Logs.
3. Confirm the outbound email shows in Brevo's logs (not Resend).
4. Check `tester-lead@saltbasin.net` inbox for the confirmation email.

**Expected outcomes:**
- Brevo log shows the send with status `delivered`.
- Email arrives within 2 minutes.
- No Resend API calls in server logs.

**How to verify:** Render logs grep for "brevo" should appear; grep for "resend" should be empty.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 16: Lead confirmation email + Betsy notification

- **Requirement covered:** Backlog #16 — *Lead confirmation email + Betsy notification*
- **User logged in:** Public visitor for submission; Admin/Tester to verify both inboxes.
- **Dependencies:** Access to `tester-lead@saltbasin.net` inbox AND `betsysalter@saltbasin.net` inbox.

### Test Script

**Steps:**
1. Submit Contact form with `tester-lead@saltbasin.net`, name "Tester A".
2. Check `tester-lead@saltbasin.net` inbox.
3. Check `betsysalter@saltbasin.net` inbox.

**Expected outcomes:**
- Lead inbox: confirmation email containing lead URL + one-time password.
- Betsy inbox: notification email with lead name, email, message excerpt.
- Both delivered within 2 minutes.

**How to verify:** `lead_emails` table has two rows for this submission: one to the lead, one to Betsy.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 17: Admin-configurable email identity + notification settings

- **Requirement covered:** Backlog #17 — *Admin-configurable email identity + notification settings*
- **User logged in:** Admin
- **Dependencies:** Brevo allows the sender to be changed (verified domain).

### Test Script

**Steps:**
1. Open admin Config → Email Settings.
2. Change "From name" to a known marker (e.g., "Salt Basin Test 2026").
3. Change notification recipient to a tester address you can access.
4. Submit a public form to trigger an email.
5. Verify the From name and recipient.
6. Restore original values.

**Expected outcomes:**
- From name shown in the inbox matches the new value.
- Notification arrives at the tester recipient (not the original).
- Restoring values takes effect on the next send.

**How to verify:** Email headers (View original / Show source) show the configured "From" name; Brevo log shows the configured "To".

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 5 — Salt Basin Net Works

## Scenario 18: Net Works opt-in banner on Salt Basin home

- **Requirement covered:** Backlog #18 — *Net Works opt-in banner on Salt Basin home page*
- **User logged in:** Public visitor (no login)
- **Dependencies:** At least 2 members opted into Net Works.

### Test Script

**Steps:**
1. Open `/` in incognito on desktop.
2. Scroll to the Net Works banner.
3. Wait through the scroll-snap rotation (or scroll horizontally).
4. Resize browser to mobile width (~375px).
5. Click a member card.

**Expected outcomes:**
- Banner shows opted-in member cards (logo + company + blurb).
- Horizontal scroll-snap works smoothly.
- Mobile width keeps the banner usable.
- Clicking a card navigates to `/u/<slug>`.

**How to verify:** `/api/net-works/members` returns only members with `net_works_opted_in=true`; banner DOM has one card per returned member.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 19: Member opt-in card (logo, company, blurb)

- **Requirement covered:** Backlog #19 — *Member opt-in card*
- **User logged in:** Test member
- **Dependencies:** Test member with logo upload ability.

### Test Script

**Steps:**
1. Log in as test member → Config → Net Works.
2. Toggle "Opt in to Net Works" ON.
3. Upload a logo (PNG ≤ 1MB), set company name + 1-sentence blurb. Save.
4. Open `/` in incognito.
5. Toggle OFF in member config; refresh `/`.

**Expected outcomes:**
- After opt-in, member's card appears in the banner.
- Logo, company name, blurb all rendered correctly.
- After opt-out, the card is gone from `/`.

**How to verify:** `/api/net-works/members` includes / excludes the test member matching the opt-in flag.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 6 — Public Site Content

## Scenario 20: Founder-first hero with mission split

- **Requirement covered:** Backlog #20 — *Founder-first hero with mission split*
- **User logged in:** Public visitor (no login)
- **Dependencies:** None.

### Test Script

**Steps:**
1. Open `/` in desktop incognito.
2. Verify hero shows founder image/intro on one side, mission copy on the other.
3. Resize to mobile (~375px wide).

**Expected outcomes:**
- Desktop: split hero with founder + mission visible.
- Mobile: sections stack cleanly; no overflow, no horizontal scroll.
- Headlines use Cormorant Garamond; body uses Inter.

**How to verify:** DevTools computed font-family on hero h1 = Cormorant Garamond; on body = Inter.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 21: Industries × Domains wheel (interactive)

- **Requirement covered:** Backlog #21 — *Industries × Domains wheel (interactive)*
- **User logged in:** Public visitor (no login)
- **Dependencies:** None.

### Test Script

**Steps:**
1. Open `/` on desktop, scroll to the wheel.
2. Hover over each industry segment.
3. Click an industry segment.
4. Test keyboard navigation (Tab + Enter) into the wheel.
5. Resize to mobile.

**Expected outcomes:**
- Hover highlights the segment.
- Click reveals matching domain/services beneath or in a popover.
- Keyboard focus visible and operable.
- Mobile shrinks wheel to fit; remains tappable.

**How to verify:** SVG segment elements have `tabindex` and ARIA labels; touch targets ≥ 44×44 px on mobile.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 22: Timeline + Case Studies + Technology blocks render

- **Requirement covered:** Backlog #22 — *Timeline + Case Studies + Technology blocks*
- **User logged in:** Public visitor (no login)
- **Dependencies:** None.

### Test Script

**Steps:**
1. Open `/` and scroll through all three sections.
2. Click each case study card.
3. Click each technology item if linkable.
4. Verify the timeline displays chronological entries.

**Expected outcomes:**
- Timeline shows years in order with descriptions.
- Case study cards link to `/output/case-study/:slug`.
- Technology block renders all listed tools/stacks.
- No layout jank on slow 3G simulated load.

**How to verify:** Network → Throttling: Slow 3G → reload; sections appear without layout shift (CLS < 0.1).

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 23: References request flow

- **Requirement covered:** Backlog #23 — *References request flow*
- **User logged in:** Public visitor (no login) for submission; Admin to verify.
- **Dependencies:** Brevo live (email notification fires).

### Test Script

**Steps:**
1. Open `/` → References section → click "Request references".
2. Fill the form with `tester-lead@saltbasin.net`, name + reason.
3. Submit.
4. Check tester inbox and `betsysalter@saltbasin.net` inbox.
5. As admin, open Leads panel.

**Expected outcomes:**
- Confirmation modal shown.
- Tester receives confirmation email.
- Betsy receives notification email tagged as a references request.
- Lead created/updated with `source = references_request`.

**How to verify:** `/api/leads` shows the lead with `source` field set; `lead_emails` table has the two send rows.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 7 — Output Pages

## Scenario 24: Print-friendly Resume output page

- **Requirement covered:** Backlog #24 — *Print-friendly Resume output page*
- **User logged in:** Member or authenticated lead (gated)
- **Dependencies:** A populated resume for the logged-in user.

### Test Script

**Steps:**
1. Log in as the gated user.
2. Open `/output/resume`.
3. Use the browser print preview (Ctrl/Cmd+P).
4. Save as PDF.
5. Sign out and try `/output/resume` again.

**Expected outcomes:**
- Authenticated view renders resume with print-styled layout.
- Print preview is single-column, no nav chrome, no broken page breaks within a section.
- Saved PDF is selectable text (not raster).
- Signed-out user sees gated preview, not full content.

**How to verify:** Print preview hides header/footer chrome; CSS `@media print` rules apply (DevTools → Rendering → Emulate CSS media → print).

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 25: Proposal output (Diagnostic / Embedded / Advisory)

- **Requirement covered:** Backlog #25 — *Proposal output*
- **User logged in:** Member or authenticated lead
- **Dependencies:** A lead/member with proposal data.

### Test Script

**Steps:**
1. Open `/output/proposal/diagnostic`.
2. Open `/output/proposal/embedded`.
3. Open `/output/proposal/advisory`.
4. Try `/output/proposal/notatype`.
5. Print-preview each variant.

**Expected outcomes:**
- Each `:type` route renders the matching proposal variant content.
- Unknown type returns 404 (or graceful fallback) — not a crash.
- Print-styled for each variant.

**How to verify:** Each route response includes the variant-specific copy headers; DOM contains variant marker (e.g., `data-variant="embedded"`).

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 26: Case Study + One-pager outputs

- **Requirement covered:** Backlog #26 — *Case Study + One-pager outputs*
- **User logged in:** Member or public visitor (depends on gate config)
- **Dependencies:** At least one published case study with `slug`.

### Test Script

**Steps:**
1. Open `/output/case-study/<slug>`.
2. Open `/output/one-pager`.
3. Open `/output/case-study/does-not-exist`.
4. Print-preview both valid routes.
5. Copy a deep-link from the case study and share to a different browser session.

**Expected outcomes:**
- Both routes render properly; deep-link works in fresh session.
- Unknown slug returns 404 / not-found message.
- Print preview is single-column, no nav chrome.

**How to verify:** `/api/case-studies/<slug>` returns the case study JSON; DOM headline matches.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 8 — Admin Experience

## Scenario 27: Admin sidebar + editor + preview pane

- **Requirement covered:** Backlog #27 — *Admin sidebar + editor + preview pane*
- **User logged in:** Admin
- **Dependencies:** A page in draft state.

### Test Script

**Steps:**
1. Log in as admin.
2. Click each sidebar tab in order; confirm each loads its panel.
3. Open a page in the editor; edit a field.
4. Observe preview pane updates.
5. Resize the editor/preview split (if supported here too).

**Expected outcomes:**
- All sidebar tabs load their panel within 2s.
- Edits reflect in preview within ~500ms.
- No console errors in DevTools.

**How to verify:** DevTools Console clean across all tab loads; preview iframe re-render matches latest editor state.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 28: Net Works admin tab (member roster)

- **Requirement covered:** Backlog #28 — *Net Works admin tab (member roster)*
- **User logged in:** Admin
- **Dependencies:** At least 2 members exist; at least 1 opted into Net Works.

### Test Script

**Steps:**
1. Open admin → Net Works tab.
2. View the roster.
3. Toggle a member's opt-in status from admin side.
4. Confirm change reflected on `/`.
5. Restore original opt-in state.

**Expected outcomes:**
- Roster shows all members with current opt-in flag.
- Admin toggle propagates to the public banner.
- No errors when toggling rapidly.

**How to verify:** `/api/net-works/members` returns updated opt-in flag after toggle.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 29: Mobile admin shell

- **Requirement covered:** Backlog #29 — *Mobile admin shell (collapsible sidebar, stacked panels)*
- **User logged in:** Admin (on a phone or DevTools mobile emulation)
- **Dependencies:** Real phone preferred; otherwise Chrome DevTools device toolbar at iPhone 14 / Pixel 7.

### Test Script

**Steps:**
1. On mobile viewport (< 768px), log in as admin.
2. Confirm sidebar starts collapsed.
3. Open sidebar; pick a tab.
4. Edit a page; switch to preview.
5. Rotate landscape ↔ portrait.

**Expected outcomes:**
- Sidebar is collapsible and tappable.
- Editor and preview stack vertically; no horizontal scroll.
- Rotating doesn't break layout.

**How to verify:** Lighthouse mobile run on `/admin` scores ≥ 80 on Best Practices; no overflow flagged.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 43: Adjustable + responsive Split view (drag-resize divider)

- **Requirement covered:** Backlog #43 — *Adjustable + responsive Split view*
- **User logged in:** Admin
- **Dependencies:** A draft page open in editor.

### Test Script

**Steps:**
1. Log in as admin, open a page editor.
2. Drag the divider between editor and preview left, right, center.
3. Refresh — does the chosen split persist?
4. Resize the browser window narrow.
5. Repeat on mobile breakpoint.

**Expected outcomes:**
- Divider drags smoothly, no jumping.
- Split position persists across refresh (localStorage).
- Below mobile breakpoint, divider switches to stacked layout automatically.

**How to verify:** localStorage key (e.g., `adminSplitRatio`) stores the value after drag.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 44: Brand colors bug fixed + Salt Basin admin palette

- **Requirement covered:** Backlog #44 — *Brand colors bug fixed + Salt Basin admin palette wired*
- **User logged in:** Admin
- **Dependencies:** None.

### Test Script

**Steps:**
1. Log in as admin → confirm admin chrome uses the Salt Basin palette (deep navy, ochre accents).
2. In Config, change a brand-token value, save.
3. Confirm the admin chrome respects the change OR remains on Salt Basin (depending on spec).
4. Reset to defaults.
5. Compare admin and `/u/tester` palettes side-by-side — they should NOT collide.

**Expected outcomes:**
- Admin defaults to Salt Basin Strategic Operator palette regardless of any member-side overrides.
- No regressions to the original brand-colors bug (which was: member overrides leaking into admin).

**How to verify:** DevTools computed CSS variables on `/admin` resolve to Salt Basin values even after setting member overrides.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 45: Calendar date pickers in EditorPane

- **Requirement covered:** Backlog #45 — *Calendar date pickers for date-shaped fields*
- **User logged in:** Admin
- **Dependencies:** A page or item with a date field (e.g., timeline entry, case study date).

### Test Script

**Steps:**
1. Open editor for a content type with a date field.
2. Click the date input → calendar widget opens.
3. Pick a future date; save.
4. Re-open; pick a past date; save.
5. Try entering text directly into the field.

**Expected outcomes:**
- Calendar opens on focus/click.
- Selected date stored in ISO format on the backend.
- Display format is human-friendly (e.g., "Jun 7, 2026").
- Manual text entry either accepted (parsed) or rejected with clear feedback.

**How to verify:** Network `POST /api/...` body shows date as ISO 8601 string.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 46: AdminShell TDZ crash hotfix — admin page loads

- **Requirement covered:** Backlog #46 (defect) — *Hotfix: TDZ crash in AdminShell*
- **User logged in:** Admin
- **Dependencies:** None.

### Test Script

**Steps:**
1. Open `/admin/login` in a clean incognito window.
2. Log in.
3. Open DevTools Console before navigating further.
4. Click through every sidebar tab.
5. Hard refresh on each tab.

**Expected outcomes:**
- No "Cannot access X before initialization" or similar TDZ error.
- No red console errors.
- Each tab renders.

**How to verify:** Console clean across all tabs; the previously-failing tab loads on hard refresh.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 9 — Deployment Infrastructure

## Scenario 30: Render backend + Netlify frontend split

- **Requirement covered:** Backlog #30 — *Render (backend) + Netlify (frontend) hosting split*
- **User logged in:** Admin / Tester with access to Render + Netlify dashboards
- **Dependencies:** Render + Netlify dashboard access; both services live.

### Test Script

**Steps:**
1. Open `https://saltbasin.net` — confirm Netlify serves the static SPA.
2. Open DevTools Network and watch an API call (e.g., login).
3. Confirm the API call goes to the Render backend URL (or proxied through saltbasin.net).
4. Check Render and Netlify dashboards for healthy status.

**Expected outcomes:**
- Netlify serves HTML + JS bundles.
- API requests resolve to the Render backend (visible in network request URL or via response headers).
- Both dashboards show last deploy as successful.

**How to verify:** `curl -I https://saltbasin.net` headers show Netlify; `curl -I <render-backend-url>/api/health` shows Render.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 31: Render deploy monitor + auto-deploy verification

- **Requirement covered:** Backlog #31 — *Render deploy monitor + auto-deploy verification*
- **User logged in:** Tester with GitHub + Render access
- **Dependencies:** GitHub Actions workflows enabled; UptimeRobot or equivalent monitor wired.

### Test Script

**Steps:**
1. Push a trivial (no-op) commit to `main`.
2. Watch Render dashboard for the new deploy.
3. Watch the GitHub Action that verifies the deploy.
4. (Optional) Simulate a failing deploy in a side branch or check past failure history.

**Expected outcomes:**
- Render auto-deploys within 5 minutes.
- GitHub Action verifies deploy and reports success.
- A failure would auto-open a GitHub issue (verify from past run, do not intentionally break prod).

**How to verify:** GitHub Action run log shows the verify step passing; Render service "Last deploy" timestamp updates.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 32: Netlify build.ignore + frontend-deploy approval gate

- **Requirement covered:** Backlog #32 — *Netlify build.ignore + frontend-deploy approval gate*
- **User logged in:** Tester with Netlify access
- **Dependencies:** `netlify.toml` configured with `build.ignore` script.

### Test Script

**Steps:**
1. Make a commit touching only `server/` files; push.
2. Open Netlify dashboard.
3. Confirm Netlify SKIPS the build (no frontend assets changed).
4. Make a commit touching `src/`; push.
5. Confirm Netlify DOES build this time.

**Expected outcomes:**
- Backend-only commits do not consume Netlify build credits.
- Frontend-touching commits trigger a build.
- The `build.ignore` script's logs show the skip reason.

**How to verify:** Netlify deploy log shows "Build cancelled by build.ignore script" for the server-only commit.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 10 — Security & Data

## Scenario 33: Admin password rotation tooling

- **Requirement covered:** Backlog #33 — *Admin password rotation tooling*
- **User logged in:** Admin (then re-login with new password)
- **Dependencies:** Local repo clone; ability to run `scripts/rotate-admin-password.mjs`; `.env` editable.

### Test Script

**Steps:**
1. Run `node scripts/rotate-admin-password.mjs` (follow its prompts).
2. Note the new password in the script output.
3. Update `.env` if needed; restart backend.
4. Log out of admin; log back in with the OLD password.
5. Log in with the NEW password.

**Expected outcomes:**
- Old password rejected after rotation.
- New password works.
- Script never writes plaintext password to git-tracked files.

**How to verify:** `git status` after running script shows no plaintext password additions; `bcrypt` hash in DB has updated.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 34: Data Notice page + inline disclaimers

- **Requirement covered:** Backlog #34 — *Data Notice page + inline disclaimers*
- **User logged in:** Public visitor (no login)
- **Dependencies:** None.

### Test Script

**Steps:**
1. Open `/data-notice`.
2. Open `/` → Contact form. Confirm an inline disclaimer linking to `/data-notice`.
3. Open `/lead/<publicId>` — confirm inline disclaimer.
4. Open `/signup` — confirm inline disclaimer.

**Expected outcomes:**
- `/data-notice` renders the full notice cleanly.
- Inline disclaimers appear on all data-collection forms with link to `/data-notice`.

**How to verify:** Page source includes a link with `href="/data-notice"` on each form.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 11 — Observability & Quality

## Scenario 35: Cold-start UX with branded loader

- **Requirement covered:** Backlog #35 — *Cold-start UX with branded loader*
- **User logged in:** Public visitor (no login)
- **Dependencies:** Render free-tier backend cold (let it idle ≥ 15 min, or use Render dashboard "Suspend → Resume").

### Test Script

**Steps:**
1. Ensure the Render backend is cold (no requests for 15 min).
2. Open `/` in a fresh incognito tab.
3. Observe the loading state during the cold-start delay.
4. Wait until the page renders fully.
5. Refresh — second load should be warm and fast.

**Expected outcomes:**
- Cold-start shows the branded Salt Basin loader, not a blank white page.
- Loader includes brand mark / typography consistent with the site.
- After warm, second load is < 1s.

**How to verify:** DevTools Network shows the first API request taking 20-30s; the loader is visible during that time.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Group 12 — Requirements & Test Management

## Scenario 40: JIRA Phase A — read-only import

- **Requirement covered:** Backlog #40 — *JIRA Phase A — read-only import*
- **User logged in:** Admin
- **Dependencies:** JIRA API credentials available; test JIRA project accessible.

### Test Script

**Steps:**
1. Log in as admin → JIRA Import panel.
2. Configure connection (URL + token) for the test JIRA project.
3. Run an import.
4. View imported items in the backlog view.
5. Confirm imports are read-only (no editing back to JIRA).

**Expected outcomes:**
- Import succeeds and pulls in tickets with title, status, description.
- Imported items are visible but flagged as JIRA-sourced.
- No write-back attempts to JIRA from the UI.

**How to verify:** Imported items have a `external_ref` field starting with the JIRA project key (e.g., `JIRA-123`); no `PUT /api/jira/...` calls fired from the admin UI.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 42: Scrum Agent Phase A — chat scaffold with real Claude responses

- **Requirement covered:** Backlog #42 — *Scrum Agent Phase A*
- **User logged in:** Admin
- **Dependencies:** `ANTHROPIC_API_KEY` set; Anthropic account in good standing.

### Test Script

**Steps:**
1. Log in as admin → Scrum Agent panel.
2. Send a simple prompt ("Summarize the backlog by capability").
3. Confirm a real, contextual response from Claude.
4. Send a follow-up that depends on the prior message.
5. Reload the page and resume the conversation.

**Expected outcomes:**
- Responses are real Claude completions (not canned).
- Conversation state persists at least within session (and across reload if spec'd that way).
- Errors (rate limit, invalid key) surface with a clear message, not silent fail.

**How to verify:** Network → `/api/scrum-agent/chat` returns 200 with a Claude-format response body; intentionally invalidate the key briefly to confirm the failure UX.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

## Scenario 47: Patch Notes output (/output/patch-notes)

- **Requirement covered:** Backlog #47 — *Patch Notes output*
- **User logged in:** Public visitor (no login)
- **Dependencies:** At least one backlog item with status changes in the last week.

### Test Script

**Steps:**
1. Open `/output/patch-notes`.
2. Verify the page lists recent deployed items grouped by date or capability.
3. Confirm only `status='deployed'` items appear (no in-progress or pending leaks).
4. Print preview.
5. Resize to mobile.

**Expected outcomes:**
- Patch notes list deployed items with title + brief summary + date.
- No drafts or pending items leak through.
- Print-styled cleanly.
- Mobile layout readable.

**How to verify:** `/api/backlog/` filtered to `status=deployed` and the page DOM count matches.

**Log Test Run:**
- [ ] Pass  •  [ ] Fail  •  [ ] Blocked
- Defect notes (if fail): _________________________________________
- Tester / date: ________________________________________________

---

# Defect intake (for when a script fails)

When any **Log Test Run** above is marked **Fail**, file a new defect:

1. Open admin → Backlog → **New Item**.
2. Set:
   - `kind = defect`
   - `parent_id` = the deployed item ID this scenario covers
   - `capability_id` = same capability group as the parent
   - `title` = "Defect: [scenario name] — [one-line symptom]"
   - `summary` = what failed (paste defect notes from the script)
   - `requirementDetail` = repro steps (copy from the script's "Steps")
   - `acceptanceCriteria` = the failing "Expected outcomes" line
   - `status = pending`
   - `priority` = p0 if blocking core flow, p1 otherwise
3. Save. The defect now appears as a child of the deployed item in the backlog tree.

# Run log summary (fill in after run)

| Group | Scenarios | Pass | Fail | Blocked | Notes |
|---|---|---|---|---|---|
| 1 — Platform Foundation | 5 | | | | |
| 2 — Multi-tenant CMS | 5 | | | | |
| 3 — Lead Capture & Identity | 4 | | | | |
| 4 — Email Infrastructure | 4 | | | | |
| 5 — Net Works | 2 | | | | |
| 6 — Public Site Content | 4 | | | | |
| 7 — Output Pages | 3 | | | | |
| 8 — Admin Experience | 7 | | | | |
| 9 — Deployment Infrastructure | 3 | | | | |
| 10 — Security & Data | 2 | | | | |
| 11 — Observability & Quality | 1 | | | | |
| 12 — Requirements & Test Management | 3 | | | | |
| **Totals** | **43** | | | | |
