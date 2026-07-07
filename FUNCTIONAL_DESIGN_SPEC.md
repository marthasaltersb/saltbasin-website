# Salt Basin Net Works Platform — Functional Design Specification

**Version:** 1.0 · **Date:** 2026-07-03 · **Scope:** Full platform as built (admin CMS, member dashboard, public sites, lead flow, integrations, QA/backlog tooling, HERQ, FinBridgeCo, agents)

**Companion documents:** [TECHNICAL_DESIGN_SPEC.md](TECHNICAL_DESIGN_SPEC.md) · [FUNCTIONAL_TECHNICAL_MAPPING.md](FUNCTIONAL_TECHNICAL_MAPPING.md)

---

## 1. Introduction & Scope

This document specifies the functional behavior of the Salt Basin Net Works platform: what each part of the system does, the rules it enforces, the people who use it, the flows they follow, and the scenarios (including edge cases and failure modes) that define correct behavior. It is written from the perspective of *what the product does*, independent of *how it is implemented* (see the Technical Design Spec for that).

The platform is a multi-tenant operator network: Betsy (the platform owner/admin) runs the canonical Salt Basin site and a set of internal tools; independent "members" (operators, advisors, consultants) each get their own editable public site, admin dashboard, resume/output tooling, and a growing set of product integrations.

### 1.1 Document Conventions

- **Actor** — who performs the action (Visitor, Lead, Member, Admin, System/automated).
- **Rule** — a constraint the system enforces, stated as a testable assertion.
- **Flow** — a numbered, ordered sequence of user-visible steps.
- **Scenario table** — Given/action → Expected result, written so each row can become a QA test case.

---

## 2. Actors & Roles

| Actor | Definition |
|---|---|
| **Visitor** | Unauthenticated person browsing a public site (`/`, `/u/:slug`, `/output/*`). No account. |
| **Lead** | A visitor who has submitted a form (contact, join-network, reference request, resume access request). Has a lead record but no login. Can unlock a password-protected lead view. |
| **Member** | A person with a `users` row, `role='member'`. Owns exactly one editable site/config pair, one slug, one resume, and can hold product licenses, org memberships, OAuth connections. |
| **Admin** | Betsy, `role='admin'`. Full access to the canonical Salt Basin site/config, all admin panels (Backlog, QA, Leads, HERQ, Governance, Lineage, Analytics, Standards, Services, FinBridgeCo, NetWorks), and cross-member visibility (audit, licensing, stats). |
| **System** | Automated actors: the field-lineage capturer, the daily snapshot job, the page-view beacon, the AI agents (Scrum Agent, Member Agent) acting on tool calls. |

---

## 3. Platform Structure

Three layers, per [CLAUDE.md](CLAUDE.md):

1. **Betsy's site** (`saltbasin.net`) — the admin-only canonical CMS, edited at `/admin/*`.
2. **Member public sites** (`/u/:slug`) — each member's published profile, world-readable once published.
3. **Member admin dashboard** (`/member`) — each member's own editor (same UI shell as the admin platform, scoped to their own data).

All editable content follows a **draft → publish** model: nothing a visitor sees is affected until the owner explicitly publishes. This is the single most important functional rule in the system and recurs in every subsystem below.

---

## 4. Subsystem Specifications

### 4.1 Core CMS & Draft/Publish (Site & Config)

**Purpose:** Let an admin or member build a multi-page site out of reusable content blocks ("sections"), edit it privately, preview it, and publish it independently of the draft.

**Actors:** Admin (own site), Member (own site).

**Business Rules:**
- R1: Every site and every config exists as an independent **draft** and **published** pair. Editing the draft never changes what visitors see.
- R2: Publishing copies the entire draft over the published version, including config, atomically from the user's perspective.
- R3: A page has a status; a section has a status: `live` (visible to visitors), `draft` (visible only to the owner in preview), `soon` (visible to visitors as a "Coming Soon" placeholder, but its full content is hidden).
- R4: The public API (`/api/site/published`, `/api/member-site/by-slug/:slug`) never returns draft-status pages or sections — filtering happens server-side, not just in the UI.
- R5: A page must have a unique slug within its site; the home page uses the empty slug.
- R6: A site must always have at least one page — the UI blocks deleting the last page.
- R7: Every field in a section can carry metadata (`fieldMeta`) describing where its value comes from: typed by a human (`user_input`), auto-populated from another record (`merged`), sourced from a linked system (`derived`), or fixed (`direct`). This "source type" is shown to the editor as a badge and is not just decorative — `merged` fields re-derive from their source (e.g., the hero heading defaults to the member's display name) unless overridden.
- R8: Fields marked `auditable` in their metadata get a before/after entry logged whenever they're edited.
- R9: Links inside a section (CTAs, nav) are automatically hidden on the public site if they point to a page that isn't live — an editor never has to manually prune dead links when a page is unpublished.

**Block Catalog (functional surface):** hero, scripture, about, cards, twoCol, resume, socialGrid, contact, text, cta, industries, domains, services, assessments, referencesRequest, joinNetwork, forCompanies, industryWheel, technology, aboutIntro. Each block type has its own content schema (see Technical Spec §2.3 for field-level detail); functionally, all of them respect R3 (status-gated visibility) and R7 (field metadata).

**User Flow — Add a Page:**
1. Owner clicks "Add Page" in the sidebar.
2. Enters a name; slug is auto-derived (editable); chooses page type (standard/landing/blog/shop) and initial status.
3. System rejects a duplicate slug with an inline error.
4. On success, the page is created in the draft with one seeded hero section, and becomes the active page in the editor. Nothing is visible to the public until published.

**User Flow — Add a Section:**
1. Owner selects a page, clicks "Add Section," picks a block type, background color, and initial status.
2. System seeds default content ("Add your content here.") and empty field metadata.
3. Section appears in the sidebar and becomes selected in the editor.

**User Flow — Edit Content:**
1. Owner selects a section; the editor shows section settings (name, background) and every content field.
2. Each field shows a source badge; clicking it opens field-metadata settings (visibility, auditability, field type, description, predefined options, cascading dependent-field rules).
3. Edits are held in the in-memory draft; nothing is saved until "Save Draft."
4. If a field is auditable, every edit is also (fire-and-forget) recorded to the audit trail, independent of Save Draft.

**User Flow — Preview, Save, Publish:**
1. The editor and a live preview pane render side-by-side (or in isolated editor/preview view modes); preview always reflects the in-memory draft, including draft/soon banners not shown to real visitors.
2. "Save Draft" persists the in-memory draft to the database; disabled when there are no unsaved changes.
3. "Discard" reverts in-memory state to the last saved draft.
4. "Publish" — if there are unsaved changes, the owner is prompted to save first; then a confirmation ("Promote draft to public?"); then the draft is copied to published.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Save draft with `pages` missing from the request body | 400 error; draft unchanged |
| 2 | Publish when the draft has zero pages | Publish blocked (409); owner sees error, told to add a page first |
| 3 | Add a page whose derived slug collides with an existing page | Inline error "A page with that slug already exists"; page not created |
| 4 | Delete the only remaining page | Blocked with a toast; at least one page always remains |
| 5 | Two browser tabs edit the same draft concurrently | Last save wins; no conflict warning shown (no locking) — the lineage log is the only record of what was overwritten |
| 6 | A section's status is changed from `live` to `draft` after publish, without publishing again | Public site continues showing the last-published (still-live) version until the owner explicitly publishes again |
| 7 | A CTA in a live section links to a page currently in `draft` status | On the public render, the CTA is filtered out / not treated as a clickable live link; in the admin preview it always shows (so the owner can still edit it) |
| 8 | Field marked `auditable` is edited twice in a row before saving | Two independent before/after entries are recorded, even though only one Save Draft occurs |
| 9 | Owner clicks Publish, cancels the confirmation dialog | No changes committed; draft state preserved |
| 10 | New member has never saved a draft and opens the editor | System auto-seeds a default draft (`defaultMemberSite()`) rather than showing an empty/broken editor |
| 11 | Owner adds a new custom field with a key that already exists on the section | Add is blocked/disabled |
| 12 | Owner requests the admin nav config with duplicate tab IDs across different views | Save is rejected with a validation error naming the duplicate |

---

### 4.2 Authentication & Account Security

**Purpose:** Let people sign up, sign in, recover access, and have their session behave predictably and securely across both the admin and member surfaces (same login screen for both — the server resolves the role).

**Actors:** Visitor (becomes Member via signup or lead conversion), Member, Admin.

**Business Rules:**
- R1: Login, forgot-password, and forgot-email requests are rate-limited (10 attempts per IP per 15 minutes) to blunt credential-stuffing and enumeration attacks.
- R2: Password reset and "recover my email" flows never reveal whether the supplied email/phone exists — the response is always the same regardless.
- R3: A password reset link is single-use and expires after 1 hour; completing a reset invalidates *every* active session for that user (forces re-login everywhere, including any device the attacker/legit-user is using).
- R4: New signups and password changes require a password of at least 8 characters — no other complexity rule is enforced.
- R5: A user can register secondary emails (personal or work); each must be verified via a 6-digit code (15-minute expiry) before it can be used to log in.
- R6: The signup form and password-reset/email-recovery forms are gated by reCAPTCHA v3 (score ≥ 0.5); if reCAPTCHA isn't configured, the check no-ops rather than blocking every user.
- R7: A session lasts 14 days from creation and is tied to a single opaque cookie (`sb_admin`); logging in from a second device does not invalidate the first.

**User Flow — Sign Up:**
1. Visitor enters display name, email, password, optional custom slug.
2. reCAPTCHA runs invisibly; on failure the form shows a generic error.
3. On success, an account, a primary verified email, and a default draft profile (with an auto-generated unique slug) are created; the visitor is immediately logged in and redirected to `/member`.

**User Flow — Log In:**
1. Visitor enters email + password on `/login` (same page serves `/admin/login`, an alias).
2. On success, the server determines role from the account and the client routes to `/admin` (admin) or `/member` (member).
3. On failure, a generic "invalid credentials" error is shown; repeated failures eventually trip the rate limit with a "try again in 15 minutes" message.

**User Flow — Forgot Password:**
1. User requests a reset by email; sees "check your email" regardless of whether the address is on file.
2. If the address exists, an email with a one-hour link arrives.
3. User sets a new password at the link; all of that user's sessions are killed, forcing sign-in with the new password everywhere.

**User Flow — Forgot Which Email:**
1. User supplies a phone number (used because some users only remember the phone number they originally gave as a lead).
2. If a converted lead with that phone exists, the account's email is sent to that email address (not shown on screen — must check inbox).

**User Flow — Secondary Email Verification:**
1. Member adds a secondary email (personal or work) in account settings.
2. A 6-digit code is emailed; entering it within 15 minutes verifies the address; a "resend" option issues a fresh code with a fresh 15-minute window.
3. The original signup email cannot be removed (a user must always retain their primary contact method).

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Login with correct email, wrong password, 11th time within 15 minutes | 429 "Too many attempts — please try again in 15 minutes" |
| 2 | Forgot-password request for an email that doesn't exist | 200 success response identical to a real match; no email sent |
| 3 | Reset link clicked twice (second time after already used) | Second attempt errors "this link has already been used" |
| 4 | Reset link used after 1 hour | Errors "this link has expired — request a new one" |
| 5 | Password reset succeeds while user is logged in on 3 devices | All 3 sessions invalidated; each device is bounced to login on its next request |
| 6 | User submits a 6-digit verification code after the 15-minute window | Errors "code expired — resend to get a new one" |
| 7 | User tries to delete their primary/signup email | Blocked: "cannot remove the primary signup email" |
| 8 | Someone tries to add an email already registered to another account | Blocked: "email already in use" |
| 9 | Signup attempted with an email already registered | 400 "email already registered" |
| 10 | reCAPTCHA not configured on this deployment (dev/staging) | Signup/reset/recovery flows proceed normally (no false blocking) |
| 11 | User requests email recovery with a phone number that has never converted to a member | 200 success shown; no email sent (silent no-op) |
| 12 | Logout is called with no active session cookie | Still returns success (idempotent) |

---

### 4.3 Identity: Personal & Organization Profiles, Product Licensing

**Purpose:** Give every member a personal identity record independent of their public site, let them form or join organizations (LLCs, corporations, client orgs), and gate access to paid Salt Basin products (FinBridgeCo, HandoverOS) per user or per org.

**Actors:** Member, Admin (for licensing).

**Business Rules:**
- R1: A personal profile is 1:1 with a user account and is auto-created on first access (seeded from the account's display name).
- R2: An organization has exactly one **owner** at creation (the creator); subsequent members can be added as owner/admin/member/viewer.
- R3: Only owner/admin roles can invite members, change roles, or edit org details; only the owner can delete the org.
- R4: A member's personal profile can be linked to any organization they belong to (`personal_org_links`), letting a self-employed operator present their personal brand alongside their LLC.
- R5: Product licenses are granted by an admin, are scoped to a user and optionally an org, have a tier and optional expiry, and are soft-revoked (never hard-deleted, so history is preserved).
- R6: Inviting someone to an org by email never reveals whether that email has an account (enumeration protection) — the response is identical either way.

**User Flow — Create an Organization:**
1. Member fills in name, type (LLC/corp/sole proprietor/nonprofit/etc.), description, website.
2. System generates a unique URL slug and creates the org with the member as owner.

**User Flow — Invite a Team Member:**
1. Owner/admin enters an email and picks a role.
2. If the email matches an existing account, that user is added to the org at the chosen role; if not, nothing visibly happens (by design, to prevent probing for registered emails) — no invite email is sent in the current build, so the org owner must separately tell the invitee to sign up first.

**User Flow — Grant a Product License (Admin):**
1. Admin picks a member, product (FinBridgeCo/HandoverOS/Salt Basin Pro), tier, and optional expiry.
2. License appears immediately in the member's "My Licenses" view; expired or admin-revoked licenses silently stop granting access without deleting the historical record.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Non-owner/admin tries to change another member's role in an org | 403 "Insufficient role" |
| 2 | Owner tries to leave/remove themselves from their own org | Same removal endpoint used by anyone removing themselves — allowed; org is left without an explicit new owner (known gap, not auto-reassigned) |
| 3 | Invite sent to an email with no account | 200 success shown to inviter; no account is affected, no notification sent |
| 4 | Admin grants a license with an expiry date in the past | Accepted; license is immediately treated as expired (excluded from "my active licenses") |
| 5 | Member links their personal profile to an org they don't belong to | 403 "Not a member of this org" |
| 6 | Member links to the same org twice | Idempotent — no duplicate link, no error |
| 7 | Admin revokes a license | License marked inactive (soft delete); it disappears from the member's active list but remains in the audit/history record |
| 8 | Someone requests personal profile before one has ever been created | Auto-created on the fly using the account's display name — no error, no empty state |

---

### 4.4 OAuth & Third-Party Integrations

**Purpose:** Let a member connect their own business systems (CRM, ERP, data warehouse, marketing automation, etc.) so their site/config or agent can reference live data instead of manually re-entered numbers.

**Actors:** Member, System (token refresh).

**Supported systems (14):** Microsoft, Salesforce, QuickBooks, LinkedIn, Supabase, Workday, Snowflake, Tableau, Zuora, DealHub, Marketo, HubSpot, SAP, Oracle.

**Business Rules:**
- R1: Most providers use a standard "redirect to provider, come back with a code" flow; two (Zuora, Marketo) authenticate server-to-server with no user redirect at all — the member just supplies account identifiers.
- R2: Five providers (Workday, Snowflake, Tableau, SAP, Oracle) require the member to supply a base tenant URL (and sometimes an account/tenant/subdomain ID) before a connection can be attempted, because their APIs are self-hosted per customer.
- R3: A member can hold at most one connection per provider at a time — reconnecting overwrites the prior connection's tokens and metadata.
- R4: All access and refresh tokens are stored encrypted; nothing in plaintext ever reaches the browser.
- R5: A connection stores whether it may be used for **write** operations (`allow_write`), defaulting to read-only, and this is a member-controlled toggle independent of the OAuth scopes granted by the provider.
- R6: If a token expires and a refresh token exists, the system silently refreshes it on next use; if refresh fails or no refresh token exists, the feature relying on that connection degrades gracefully (the member is prompted to reconnect) rather than crashing.
- R7: Disconnecting a provider is immediate and does not attempt to notify or revoke on the provider's side (a known limitation — the provider-side grant may remain active until the member manually revokes it there too).
- R8: Supabase has a fallback path: if OAuth isn't configured for this deployment, the member can instead paste a personal access token, which is verified against Supabase's API before being stored.

**User Flow — Connect a Standard Provider (e.g., Salesforce):**
1. Member clicks "Connect" next to Salesforce in their integrations list.
2. Browser redirects to Salesforce's login/consent screen.
3. On approval, Salesforce redirects back; the connection appears in the member's list with a friendly label (their Salesforce username/org) and no raw tokens ever shown.
4. Member can toggle "Allow write access" for this connection at any time.

**User Flow — Connect a Tenant-Scoped Provider (e.g., Workday):**
1. Member is prompted for their organization's Workday tenant URL (and tenant ID).
2. Same redirect/consent/callback flow as above, but the auth and token endpoints are built dynamically from the supplied tenant URL.

**User Flow — Connect a Server-to-Server Provider (e.g., Marketo):**
1. Member supplies their Munchkin ID.
2. No browser redirect occurs — the connection is established immediately using client credentials, and the member sees the result right away.

**User Flow — Disconnect:**
1. Member clicks "Disconnect" next to a connected provider.
2. Connection is deleted immediately; any feature depending on it (e.g., a member-agent data query) will fail gracefully next time it's used, prompting reconnection.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Member denies consent on the provider's screen | Redirected back to the platform with an error state, no connection created |
| 2 | Member starts a second OAuth attempt for the same provider before finishing the first | Both may complete; whichever callback lands second overwrites the connection (known race, acceptable given ON CONFLICT upsert semantics) |
| 3 | Access token expires; refresh token is present and valid | Transparent refresh; member never sees an error |
| 4 | Access token expires; refresh token is missing or the provider rejects it | Feature relying on the token fails gracefully; member is guided to reconnect |
| 5 | Member submits Workday connect without a tenant URL | Error surfaced before redirect; connection not attempted |
| 6 | Member pastes an invalid/revoked Supabase personal access token | 400 error, no connection created |
| 7 | Member disconnects a provider that's actively powering a live agent data query | Next query attempt fails cleanly with a "reconnect" prompt rather than crashing the agent |
| 8 | Same OAuth callback URL is replayed (e.g., browser back + refresh) | Second attempt fails (state token already consumed) — no duplicate/ghost connection |
| 9 | Member connects Snowflake with an accountId containing invalid characters | Connection attempt fails at the network/auth-server level; no partial connection stored |
| 10 | Environment is missing a provider's client ID/secret | Connect action returns a configuration error; provider does not appear as connectable (or fails clearly if attempted) |

---

### 4.5 Member & Public Sites

**Purpose:** Give every member a real, ownable public web presence at `/u/:slug`, separate from — but built with the same content system as — Betsy's own site.

**Actors:** Member, Visitor.

**Business Rules:**
- R1: A member's public profile is only reachable once they have published at least once; before that, the URL returns a "not found" experience rather than a broken/empty page.
- R2: Public rendering only ever reads the **published** copy of a member's site and config, never the draft — a half-finished edit can never leak to visitors.
- R3: A member can opt in to being featured on Betsy's own "Net Works" showcase; opting in populates a small public card (slug, name, company, logo, one-line blurb) surfaced on the flagship site.
- R4: Every page view on a published member profile is logged (member slug, page slug, referrer, anonymized visitor) purely for the member's own analytics — this never blocks or slows down the page render.

**User Flow — Publish and View a Public Profile:**
1. Member finishes editing in `/member`, clicks Publish (see §4.1 for the underlying save/publish mechanics).
2. Visitor navigates to `/u/their-slug`; sees the published site with the member's branding/colors.
3. Every page view fires a lightweight, non-blocking analytics beacon.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Visitor navigates to a slug that has never been published | Clean "not found" state, not a raw error |
| 2 | Member unpublishes (edits status to draft) a page that's already live and doesn't republish | Visitors keep seeing the old published version until the member republishes |
| 3 | Two members would generate the same slug from their display name | System appends a numeric suffix (`-2`, `-3`, …) to guarantee uniqueness |
| 4 | Page-view beacon insert fails (e.g., transient DB issue) | Response to the visitor's browser is unaffected; failure is only logged server-side |
| 5 | Member opts in to the Net Works showcase, then unpublishes their site | They should be expected to no longer appear reliably in "published, live" showcase queries once unpublished |

---

### 4.6 Lead Capture & Pledge Flow

**Purpose:** Turn anonymous site visitors into tracked, contactable leads, let them manage and revisit their own submission, and offer a low-friction "pledge my interest" step ahead of full membership conversion. (This subsystem includes the "lead pledge flow" delivered in the most recent commit, replacing an earlier "convert to member" pattern with a two-step pledge-then-convert model.)

**Actors:** Visitor, Lead, Admin.

**Business Rules:**
- R1: Submitting a lead form (contact, join-network, reference request, resume-access request, etc.) always creates or updates exactly one underlying lead record — duplicate submissions by the same email or phone are merged into a single, most-recent-wins record rather than creating clutter.
- R2: Every lead gets a short public ID and a system-generated password, both delivered to the submitter, so they can privately revisit their own record later without creating a full account.
- R3: A lead can add secondary contact emails (e.g., a personal address alongside a work one) to the same record.
- R4: A lead can **pledge** interest in becoming a member — a lightweight, single-click commitment distinct from actually creating an account — and this is idempotent (pledging twice doesn't double-count).
- R5: Converting a lead into a full member requires re-entering the password that was issued at submission time, plus (if configured) a reCAPTCHA check; a lead can only convert once, and only if their email doesn't already collide with an existing account.
- R6: Merging leads never deletes historical data — the older record's notes, prior activity, and merge chain are preserved and attached to the surviving record.
- R7: Submission volume is rate-limited (5 submissions per IP per 60 seconds) to blunt basic bot abuse.

**User Flow — Submit a Lead Form:**
1. Visitor fills out any lead-capturing block on a public page (contact form, "Join the Network," reference request, etc.).
2. On submit, the system checks for an existing lead by email/phone; if found, merges into it (see R1); otherwise creates a new one.
3. Visitor is shown their public lead ID, a link to their private lead view, and the password needed to unlock it — plus a confirmation email with the same.

**User Flow — Revisit a Lead Record:**
1. Visitor opens their `/lead/:publicId` link.
2. If not already unlocked (e.g., no admin session, no valid saved session), they must enter the password they were given.
3. Once unlocked, they see their submission history, any emails sent to them, and can edit their name/phone/answers and manage additional contact emails.

**User Flow — Pledge Interest:**
1. From their lead view, the lead clicks "Pledge my spot."
2. The record is stamped as pledged; the button changes to a confirmed state ("You've pledged — you're on the list").
3. Pledging again is a no-op that reports the existing pledge rather than erroring.

**User Flow — Convert to Member:**
1. Lead clicks to convert, re-enters their lead password (and passes reCAPTCHA if enabled).
2. System creates a full member account carrying over the same password hash, generates a public profile slug, links the lead record to the new user, and logs the lead in immediately, landing them on `/member`.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Same person submits two different forms with the same email | Second submission merges into the first; the merged record retains both messages/answers as prior history |
| 2 | Lead tries to open their record with no password and no saved session | Prompted for password before anything else is shown |
| 3 | Lead enters the wrong password | Rejected with a clear error; no lockout counter mentioned beyond general rate limiting |
| 4 | Lead whose record has already been merged into a newer one is visited directly | Shown a "merged into a newer record" state (410), not a silent 404 |
| 5 | Lead pledges twice | Second pledge returns success with an "already pledged" flag; timestamp is not overwritten |
| 6 | Lead attempts to convert but their email already matches an existing account | Blocked with "an account with this email already exists — sign in instead" |
| 7 | Lead attempts to convert with an email that matches a *verified secondary* email on another account | Blocked, naming the primary email of that account so the lead knows which account to log into |
| 8 | Lead attempts to convert twice | Second attempt blocked — "already converted" |
| 9 | Lead attempts to convert without ever having a password set (a legacy pre-password record) | Blocked — "lead has no password set — cannot confirm conversion" |
| 10 | Visitor submits 6 lead forms within 60 seconds from the same IP | 6th+ submission rejected: "slow down a moment" |
| 11 | Admin views the leads list | Sees all active (non-merged) leads regardless of source, with merge counts and pledge status visible |
| 12 | Same submission includes both a matching email *and* a different but matching phone from two different existing leads | Both matches are merged into whichever is most recently updated; both become historical |

---

### 4.7 Resume & Output Documents

**Purpose:** Provide clean, print-ready, shareable documents (resume, case studies, proposals, one-pagers, build summaries, etc.) that are readable in a browser, printable to PDF, and access-gated for non-members without requiring a full authentication wall.

**Actors:** Visitor, Lead, Member, Admin.

**Business Rules:**
- R1: Output routes are not behind a login wall at the network level — they render for anyone, but content is conditionally gated in the UI: an unauthenticated visitor sees a teaser plus a request-access path; a logged-in member or a temporary-access-token holder sees the full document.
- R2: A visitor can request temporary (24-hour) access to a resume by supplying their email and accepting terms; this both grants access and creates/updates a lead record, so a resume request always shows up in the lead pipeline.
- R3: Print output is a clean, single-purpose view — navigation chrome, gates, and footers are hidden specifically for print/PDF export.
- R4: A member can maintain multiple named resume "presets" (e.g., different layouts) and mark one primary; an AI-assisted "tailor this resume" workflow can propose edits that the member reviews before accepting.
- R5: When a member downloads their own resume, or a visitor with temp access downloads it, the system can capture *why* (role, org, specific question) so the resume owner understands who's looking and for what.

**User Flow — Visitor Requests Resume Access:**
1. Visitor lands on `/output/resume`, sees a gated preview.
2. Enters email, optional context, accepts terms.
3. System emails a 24-hour access link; visiting it unlocks the full resume for that window.
4. Optionally, the visitor is asked their org/role/question before printing, which is recorded against their lead.

**User Flow — Member Views/Prints Their Own Resume:**
1. Member (logged in) opens `/output/resume` — no gate, full content immediately.
2. Clicks Print/Save as PDF; browser's native print dialog handles the export using resume-specific print CSS.
3. If no "reason for access" has been captured in the last 24 hours, they're prompted for one (for their own audit trail, or a hiring context).

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Temp-access token used after its 24-hour window | Access denied with a clear "expired" state and a path to request new access |
| 2 | Temp-access token that never existed (typo/tampered URL) | Access denied with a "not recognized" state |
| 3 | Visitor requests access without accepting terms | 400 error; no token issued |
| 4 | Visitor requests resume access with an email that already has a lead record | Existing lead is updated (context appended) rather than a duplicate created |
| 5 | Member downloads own resume, no org/reason captured recently | Prompted once per 24 hours; declining to answer does not block the download |
| 6 | Output route rendered for content the member never published | Falls back to an empty/placeholder state rather than erroring |

---

### 4.8 Analytics

**Purpose:** Give both Betsy (platform-wide) and each member (their own content only) visibility into who's engaging with what — page visits, resume/proposal downloads, form submissions — without collecting personally identifying data beyond what's explicitly given (e.g., a download reason).

**Actors:** Admin, Member, System.

**Business Rules:**
- R1: Every trackable action (visit, PDF download, form submit) is recorded as a discrete event, tagged with what was interacted with and, where relevant, who did it (visitor identity only if authenticated).
- R2: Visitor IP addresses are never stored in raw form — only a salted hash, sufficient for rough uniqueness counting but not identification.
- R3: A member only ever sees analytics for their own content; platform-wide rollups and per-member drill-downs are admin-only.
- R4: A resume/proposal download by an authenticated visitor triggers a non-blocking notification email to the content owner, including the stated reason if one was given.

**User Flow — Admin Reviews Platform Analytics:**
1. Admin opens the Analytics panel, picks a time window (7/14/30/90 days).
2. Sees an event-type breakdown, a "top members by traffic" table, a rolling download log (who downloaded what, when, and why), and a daily trend chart.

**User Flow — Member Reviews Their Own Analytics:**
1. Member opens their analytics view; sees the same categories of data, scoped to only their own profile/resume/outputs.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | No events recorded yet in the selected window | Panel shows an explicit "no events yet" state, not an error or blank chart |
| 2 | Member attempts to view another member's analytics | Not exposed — all member-facing analytics queries are scoped server-side to the requester's own ID |
| 3 | Email notification service is unavailable when a download occurs | Download still succeeds for the visitor; notification failure is silent/logged only |
| 4 | Unauthenticated visitor triggers a download event | Recorded, but without a linked visitor identity (anonymous count only) |

---

### 4.9 Governance (Standards Review)

**Purpose:** Maintain a single, curated set of canonical definitions (domains, taxonomies, terminology) used across the platform's content apps, with a lightweight proposal → review → approve/reject workflow so the vocabulary doesn't drift unchecked as members and admins add content.

**Actors:** Admin (reviewer), Member/System (proposer).

**Business Rules:**
- R1: A new or changed standard always starts as a **pending proposal**, never writes directly to the canonical set.
- R2: Only an admin can approve or reject a pending proposal; approval merges it into the canonical `global_standards` set (creating or updating), rejection requires no reason but supports one.
- R3: A member who locally overrides a standard's definition for their own context can flag that override for governance review ("escalate"), surfacing it to the admin queue separately from new proposals.

**User Flow — Propose a Standard:**
1. Someone (member or system) submits a name, domain, category, definition, and rationale — optionally referencing an existing standard they want to revise.
2. It appears in the admin's pending queue.

**User Flow — Review a Proposal:**
1. Admin reads the proposal (definition, rationale, who proposed it, when).
2. Approves (merges into canonical standards) or rejects (with optional reason).

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Proposal submitted without a name or domain | Rejected at submission with a validation error |
| 2 | Admin approves a proposal referencing a base standard that's since been deleted | (Not currently prevented) — treated as creating a new standard rather than erroring |
| 3 | Admin rejects with no reason given | Accepted; rejection_reason left blank |
| 4 | Same override escalated twice | Idempotent — no duplicate queue entry |

---

### 4.10 Data Lineage

**Purpose:** Provide a forensic, field-level audit trail across all editable content — who changed what value, from what, to what, when, and from what source (manual edit, AI-assisted, template, publish action) — so any piece of content's history can be reconstructed.

**Actors:** Admin (viewer). Capture is entirely automatic (System).

**Business Rules:**
- R1: Every save of tracked content (site state, config, HERQ outputs, etc.) automatically captures a per-field before/after diff, without any manual action required from the editor.
- R2: Each save event is bundled into a single "snapshot" representing the entire entity's state fingerprint at that moment, alongside the individual field-level changes within it.
- R3: Any single field can be traced through its entire history, oldest to newest, independent of which snapshot it first appeared in.
- R4: Lineage is currently an admin-only diagnostic view; it is not exposed to members.

**User Flow — Investigate a Change:**
1. Admin picks a tracked entity (e.g., "site_state / draft") from a list of everything with recorded history.
2. Sees a chronological timeline of save events ("snapshots"), each showing how many fields changed and by what source/author.
3. Expands a snapshot to see the specific fields that changed, with before/after values.
4. Drills into one field to see its complete history across every save event, not just this one.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Entity has never been edited | Shows "no lineage data yet," not an error |
| 2 | A save event changes zero fields (no-op save) | Still recorded as a snapshot, with a changed-count of zero |
| 3 | Admin drills into a field that has a very long history | All entries returned up to a capped limit; no pagination UI currently, so extremely long histories may be slow to load |

---

### 4.11 QA / Test Management

**Purpose:** Let Betsy document, execute, and track manual test scenarios against built features, and automatically surface a defect in the backlog the moment a test step fails — closing the loop between "this broke" and "here's a tracked item to fix it."

**Actors:** Admin (author + tester).

**Business Rules:**
- R1: A test scenario is made of ordered steps, each with an expected outcome; a scenario can be linked to one or more backlog features, with exactly one marked as the "primary" feature that any resulting defect will attach to.
- R2: Running a test logs a result (pass/fail/blocked) against every step in the scenario.
- R3: Any step marked **fail** during a run automatically creates a new backlog defect item, parented to the scenario's primary feature and tagged with the environment and run it came from — no manual defect entry required.
- R4: A step marked **blocked** does not create a defect (it means the test couldn't be executed, not that it failed).
- R5: The overall result of a run is fail if any step failed, else blocked if any step was blocked, else pass.
- R6: Editing a scenario that's changed since it was last loaded (stale edit) is rejected rather than silently overwriting newer changes.

**User Flow — Author a Test Scenario:**
1. Admin creates a scenario: title, summary, preconditions, environment scope (test/prod/both), priority, linked feature(s) with one marked primary.
2. Adds ordered steps (action → expected outcome) inline.

**User Flow — Log a Test Run:**
1. Admin opens a scenario, clicks "Log Test Run," picks the environment.
2. For each step, records pass/fail/blocked, optional notes, optional evidence link.
3. On submit, sees the computed overall result and, if any step failed, a note of how many defects were auto-created — each immediately visible in the backlog.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Admin tries to log a run for a scenario with zero steps | Blocked client-side: "add at least one step before logging a run" |
| 2 | Every step in a run passes | Overall result = pass; no defects created |
| 3 | One step fails, others pass | Overall = fail; exactly one defect created, linked to the scenario's primary feature |
| 4 | A step is marked blocked, none fail | Overall = blocked; no defect created for the blocked step |
| 5 | Admin edits a scenario in one browser tab while it was already changed in another | Save rejected with a "stale" conflict; admin sees the current server state before retrying |
| 6 | Scenario is deleted while it has run history | Run history is removed along with it (cascading), but backlog defects already created from past runs remain (they are independent backlog items by then) |
| 7 | Scenario is linked to a feature that's later deleted | Result is currently not defended against — an orphaned reference is possible |

---

### 4.12 Backlog / Requirements Management

**Purpose:** Serve as the single source of truth for what's been built, what's planned, and what it cost — in both time and (actual + comparative) dollars — feeding a public-facing "build summary" one-pager that quantifies AI-assisted development savings.

**Actors:** Admin.

**Business Rules:**
- R1: A backlog item is a feature, defect, chore, or spike, optionally grouped under a named "capability" (e.g., "Multi-tenant CMS") and optionally parented under another item (defects parent to the feature they broke).
- R2: Every item tracks effort split between Betsy's hours and Claude's hours, from which an "activity count" and dollar cost (actual Claude compute cost vs. an estimated traditional-team cost) are derived.
- R3: Deleting an item is always a soft delete (archive) — nothing is ever truly destroyed from the backlog.
- R4: The build-summary rollup only counts items marked completed or deployed toward headline "delivered" metrics.
- R5: A daily snapshot of the whole backlog's rollup metrics is captured automatically (once per day, idempotent) so progress can be charted over time; admins can also force a labeled "milestone" snapshot (e.g., "Launch day") independent of the daily cadence.

**User Flow — Add a Backlog Item:**
1. Admin enters at minimum a title; optionally fills in user story, requirement detail, business rules, design spec, acceptance criteria, process steps, capability group, kind, status, priority, effort hours, tech stack, deployment flags.
2. Item appears immediately in the relevant capability's list.

**User Flow — View Build Summary:**
1. Admin opens the summary view; sees totals (requirements delivered, hours by person, activities, actual vs. traditional cost, AI savings multiple), a per-capability rollup (tech stack, hours, cost, delivery window), a list of "tier workaround" savings (e.g., avoided a paid hosting tier), and a time-series chart of progress.
2. Can capture a manual/milestone snapshot to mark a specific moment on the chart.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Item created with only a title | Accepted; every other field defaults sensibly (kind=feature, status=pending) |
| 2 | Attempt to seed the backlog when it's already populated | No-op response: `{ skipped: true }`, existing data untouched |
| 3 | Build summary requested when zero items are marked delivered | All totals report zero; no divide-by-zero errors |
| 4 | Item deleted that has child items (defects) pointing to it | Item is archived (soft-deleted), not removed; children keep their reference to the now-archived parent |
| 5 | Milestone snapshot captured twice with the same label on the same day | Both are stored distinctly if sources differ, or is idempotent if the same automatic source+day combination repeats |
| 6 | Two admins edit the same backlog item concurrently | Last write wins; no conflict detection (unlike QA scenarios, which do have staleness checks) |

---

### 4.13 NRM (Network Relationship Manager)

**Purpose:** Give each member a lightweight personal contact/relationship tracker, and give the platform an intake path for "reference requests" — someone (e.g., a prospective employer) asking a member's network to vouch for them.

**Actors:** Member, Admin, Visitor (submitting a reference request).

**Business Rules:**
- R1: A member only ever sees and manages their own contacts; an admin can see everyone's.
- R2: A reference request can name a specific member as its target, or be a general note to the admin; submitting one requires no login.
- R3: A member can opt in to appear in a public "network directory" with a short bio; opting out removes them immediately from that public listing.
- R4: A reference request has a status lifecycle (new → acknowledged → fulfilled/declined) that only an admin can advance.

**User Flow — Manage Contacts:**
1. Member adds a contact (name, email, org, role, relationship type, notes).
2. Can edit or delete any contact they own.

**User Flow — Submit/Receive a Reference Request:**
1. Anyone (no login required) submits a request naming themselves, their org, and optionally a specific member and context ("hiring for a senior ops role").
2. Both the admin and (if named) the target member are notified.
3. Admin reviews and updates the request's status as it's handled.

**User Flow — Opt Into the Network Directory:**
1. Member turns on "appear in network directory" and writes a short public bio.
2. They now appear in the public directory list; turning it off removes them immediately.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Reference request submitted with no name or email | Rejected: "name and email required" |
| 2 | Reference request names a member who doesn't exist (bad ID) | Accepted anyway; simply shows no target-member details attached |
| 3 | Member attempts to edit a contact they don't own | 403 forbidden |
| 4 | Notification email service is down when a reference request comes in | Request is still recorded; notification failure is silent |
| 5 | Member opts out of the directory | Immediately excluded from the next directory listing query |

---

### 4.14 HERQ Content Manager

**Purpose:** A dedicated thought-leadership content system — organizing research, social/commentary insights, and posts into five themed "series," and bundling them into publishable one-pagers/outputs. Runs under a visually distinct sub-brand ("Mode 2") separate from the rest of the admin UI.

**Actors:** Admin.

**Business Rules:**
- R1: Every HERQ post belongs (optionally) to exactly one of five fixed series, each with its own name and color identity; posts move through a status lifecycle (idea → drafting → scheduled → published → referenced → paused).
- R2: Research inputs (sourced stats/quotes) and comment insights (social/market observations) are tracked independently of posts but can be linked to them for context.
- R3: An "output" bundles selected posts (and optionally research) into a templated, publishable document; publishing an output keeps up to 20 prior versions for rollback/reference.

**User Flow — Draft and Publish a Post:**
1. Admin creates a post (title, series, topic, summary), starts at status "idea."
2. Advances the status as the post matures, optionally attaching supporting research or insights.
3. Once published, the post becomes eligible to be bundled into an output.

**User Flow — Build an Output:**
1. Admin creates an output, picks a template, selects source posts.
2. Uses a block-based configurator (merge-field tokens like `{{post.title}}`) to lay out the document.
3. Publishes; the output gets a public URL and its prior configuration is preserved in version history.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Post created without a title | Rejected: "Title required" |
| 2 | Post referencing a series that doesn't exist | Currently accepted without validation (not blocked) |
| 3 | Output references a post that's later deleted | Output keeps the dangling reference; rendering may show a gap rather than erroring |
| 4 | Output's version history exceeds 20 saved versions | Oldest version is dropped to make room for the newest (FIFO) |

---

### 4.15 Services Proposal Manager

**Purpose:** Let Betsy draft, publish, and gate access to service engagement proposals, and capture "who wants to see this and why" as leads for the CRM pipeline.

**Actors:** Admin, Visitor/Prospect.

**Business Rules:**
- R1: A proposal is draft until explicitly published; only published proposals are visible to non-admins, and even then only to someone who has been granted access.
- R2: Requesting access to a published proposal requires no login — the requester supplies their org and context, which automatically creates or updates a lead and (currently) grants access immediately.
- R3: Every access request notifies the admin and confirms to the requester by email.

**User Flow — Draft & Publish a Proposal:**
1. Admin writes title, summary, problem/approach/deliverables/timeline/pricing note.
2. Publishes when ready — now visible in the public "published proposals" feed by title/summary only.

**User Flow — Request Access:**
1. Prospect finds a proposal summary, clicks "Request Access," supplies org name, context, name, email.
2. Access is granted, a lead record is created/updated, and both prospect and admin are emailed.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Non-admin requests the full proposal body directly without requesting access first | 403 "Access required" |
| 2 | Same person requests access to the same proposal twice | Currently creates a second lead-tracking entry rather than being deduplicated (known gap) |
| 3 | Admin deletes a proposal that has outstanding access grants | Access records become orphaned (referential cleanup not currently enforced) |
| 4 | Proposal is still in draft status | Not shown in the public feed at all, regardless of access grants |

---

### 4.16 FinBridgeCo

**Purpose:** Placeholder administrative surface for the FinBridgeCo product line — currently limited to configuration flags and a license-count summary, ahead of the full deal-room product being built out.

**Actors:** Admin.

**Business Rules:**
- R1: Configuration is simple key/value pairs; there is no schema validation beyond requiring a key.
- R2: The status view shows every currently-active FinBridgeCo license across users and orgs, for a quick health check of adoption.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Config created with a key that already exists | No-op (idempotent insert) rather than a duplicate or error |
| 2 | Status view requested with zero active licenses | Returns an empty list, not an error |

---

### 4.17 AI Agents (BestyStaff Scrum Agent & Member Agent)

**Purpose:** Two distinct Claude-powered assistants: one helps Betsy think through and structure backlog requirements conversationally (admin-only, no direct data-mutation tools yet); the other lets a member edit their own site/config, and optionally query their own connected external databases, entirely through natural-language chat.

**Actors:** Admin (Scrum Agent), Member (Member Agent).

**Business Rules:**
- R1: The Scrum Agent is currently a conversation-only scaffold — it can discuss and draft requirements language but cannot yet directly write backlog items; the admin must copy its output into the backlog UI manually.
- R2: The Member Agent *can* directly mutate the member's own draft site/config through a fixed, safe set of tools (read site, read config, update section fields, add a section, update a config value, update page metadata) plus, if the member has connected an external database, a read-only query tool scoped to that connection.
- R3: The Member Agent is explicitly barred from writing certain sensitive config values (e.g., their own database URL or API key) — those must be entered through the dedicated UI, not via chat, to reduce the chance of a prompt-injection-style mistake landing a secret in a training-adjacent conversation log.
- R4: Every agent tool call is shown back to the user in the response (transparency: "here's exactly what I changed"), and every agent action is captured by the same audit trail as manual edits.
- R5: A single agent turn is capped at 8 internal tool-call iterations; if the agent hasn't finished within that budget, it stops and reports back rather than looping indefinitely.
- R6: External database queries the agent runs on a member's behalf default to read-only, regardless of what the member's connection nominally allows.

**User Flow — Betsy Plans a Sprint (Scrum Agent):**
1. Betsy opens or resumes a thread in the Backlog panel's side chat.
2. Describes a feature area in plain language; the agent asks clarifying questions and drafts structured requirement language (user story, business rules, acceptance criteria).
3. Betsy manually transfers the useful output into an actual backlog item.

**User Flow — Member Edits via Chat (Member Agent):**
1. Member types a request like "make the hero background navy and enlarge the heading."
2. Agent reads the current site, makes the corresponding field edits, and reports back what it changed — visible as a small tool-call log alongside its reply.
3. Changes land in the member's **draft** only; nothing is public until the member separately publishes.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Member asks the agent to reveal or change their database connection string | Agent declines and directs them to the integrations UI instead |
| 2 | Agent needs more than 8 tool-call rounds to satisfy a complex request | Stops and reports it hit the limit, suggesting the member break the task into smaller steps |
| 3 | No Anthropic API key is configured for the deployment | Agent chat returns a clear configuration error rather than hanging |
| 4 | Member asks the agent to run a write query (INSERT/UPDATE/DELETE) against their connected database | Blocked by default (read-only enforcement), even if the underlying OAuth connection nominally allows writes |
| 5 | Member's connected external database is unreachable when the agent tries to query it | Agent receives a clean error and can relay it conversationally rather than crashing the chat |
| 6 | Admin's Scrum Agent conversation is resumed later | Prior thread and message history reloads; a fresh thread can also be started at will |

---

### 4.18 Global Standards Repository

**Purpose:** A canonical, publishable glossary of domain terms, capabilities, and definitions that seeds and grounds the content across every other application on the platform (HERQ, Services, NRM, etc.), with a public-facing resources page.

**Actors:** Admin.

**Business Rules:**
- R1: A standard belongs to a domain (e.g., lead-to-cash, governance, architecture) and has a lifecycle: draft → published → archived.
- R2: Only published standards are ever visible on the public resources page; draft and archived ones are admin-only.
- R3: "Deleting" a standard archives it rather than destroying it.

**User Flow — Define and Publish a Standard:**
1. Admin creates a standard: name, domain, category, definition, starts as draft.
2. Publishes when ready — now visible on the public `/resources/standards` page, grouped by domain.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Standard published, then later needs to be pulled | Archived (status change), disappears from the public page immediately; not deleted |
| 2 | Two standards created with the same name in different domains | Both allowed — no cross-domain uniqueness enforced |
| 3 | Publish is called on an already-published standard | Idempotent — no error, timestamp refreshes |

---

### 4.19 Uploads & Event Tracking

**Purpose:** Let members and admins upload images for use in their content, and provide a minimal, privacy-conscious page-view beacon that other subsystems (analytics, member stats) build on.

**Actors:** Member, Admin, Visitor (as the subject of a beacon, not an actor performing an upload).

**Business Rules:**
- R1: Only image files (JPEG, PNG, WebP, GIF, AVIF) up to 5 MB are accepted; anything else is rejected before it's stored.
- R2: Uploaded files get a randomly generated filename (not the original name) to prevent collisions and avoid leaking anything from the original file name.
- R3: The page-view beacon never blocks or fails visibly to the visitor, even if the underlying write fails — analytics must never degrade the actual page experience.

**Edge Cases & Test Scenarios:**

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Upload a 10 MB image | Rejected: file too large |
| 2 | Upload a PDF where an image is expected | Rejected: unsupported file type |
| 3 | Storage backend misconfigured (missing credentials) | Clear 500 error naming the missing configuration, not a silent failure |
| 4 | Page-view beacon fires but the write fails server-side | Visitor's page load is completely unaffected; failure is logged only |

---

### 4.20 Additional Member Panels

Briefly, for completeness — these exist as member-facing tools with lighter functional surfaces than the subsystems above:

- **NetWorks (admin view):** Directory/management view of every member on the platform — search, sort by join date/activity, see who's published.
- **My Resume:** Member-facing resume preset manager (multiple named layouts, one marked primary, AI-assisted tailoring with a diff/accept workflow) — see §4.7 for the underlying output mechanics.
- **Inbox:** Member-to-member connection requests and direct messaging, gated so that messaging requires an accepted connection first.
- **Emotional Weather:** Lightweight member self-tracking panel (minimal scope as currently built).
- **Member PLM (Platform Lifecycle Management):** A member-scoped mirror of the admin Backlog panel, for a member's own project tracking.

---

## 5. Cross-Cutting Functional Rules

These apply across every subsystem above:

- **Draft/publish separation** (§4.1 R1–R2) is universal to all owner-editable content — site, config, HERQ outputs, resume presets.
- **Email enumeration protection** — password reset, email recovery, and org invites never confirm or deny whether a given email/phone is registered.
- **Non-blocking notifications** — every "send an email about this event" side effect (lead confirmation, download alert, reference request notice) is designed to fail silently rather than block or fail the primary user action.
- **Soft delete over hard delete** — backlog items and standards are archived, not destroyed; product licenses are deactivated, not removed; lead merges preserve history rather than discarding it.
- **Owner-scoped visibility** — a member only ever sees their own leads' analytics, contacts, connections, and content; cross-member visibility is admin-only.
- **Audit-first mutation** — every meaningful admin/member content change (auditable fields, backlog items, QA runs, agent tool calls) is captured for later reconstruction, independent of whether the acting user thinks to look at it.

---

## 6. Appendix: Full Test-Scenario Index

The tables embedded in each subsystem section above (§4.1–§4.19) constitute the platform's exhaustive functional test-scenario inventory as of this document's date. Each row is written to be directly convertible into a QA test case (see the QA subsystem, §4.11, for how such cases are formally tracked and executed in-product). Cross-reference [FUNCTIONAL_TECHNICAL_MAPPING.md](FUNCTIONAL_TECHNICAL_MAPPING.md) to trace any scenario back to the exact route, table, or component that implements it.
