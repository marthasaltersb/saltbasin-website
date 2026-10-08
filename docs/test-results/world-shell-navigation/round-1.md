# Test result — World Shell navigation to a tracked job opportunity (round 1)

- Feature: World Shell navigation to a tracked job opportunity, its linked draft outputs, provenance and the shared editor
- Training spec: `docs/training/world-shell-opportunity-outputs.md` (version 1, 2026-10-02), followed literally
- Round: 1
- Commit tested: `8430eae5d1260ecf37319d7fb87d3c8b0165674c` (integration branch `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-02
- Environment: database `sb_rl_val_4000_2`, API port 4004 (production build served by `node server/index.js`), Chromium 1194 via Playwright, desktop 1280x900 and phone 390x800.
- Live log: `/var/tmp/sbpg/release-loop/world-shell-navigation/round-1/steps.jsonl`; screenshots in the same directory, named `<journey>-<step>.png`.
- Result: **FAIL** (45 of 48 steps passed, 3 failed, all three from one cause)

## Summary of the one root issue

Tracking an opportunity now auto-drafts a template-built cover letter ("Cover Letter — Principal Value Architect at Northwind Freight", source "Generated from your Career Master", author the member). It comes from `coverLetterAutoDraft.js` (change spec `docs/changes/cover-letter-agent.md`), which landed after this training spec was written. The training spec still expects an empty opportunity and then exactly two cards, so three steps fail on the count. Everything the spec says about its own two cards behaves as written. This looks like a spec that needs updating rather than a product defect, but that call belongs to triage. It also shifts output ids (spec shows #1/#2, actual #2/#3) and makes J10's imported letter the fourth card, not the third.

## Per journey, per step

Setup (not a journey step): fresh database, `npm run build`, server booted, member created with the spec's curl signup (`riley.member@example.test`, reply `{"ok":true,"slug":"riley-fenn","user":{"id":3,...}}`). `create-test-member.mjs` was also run (member@test.local, admin readied) and used only for the foreign-member edge check.

### Journey 0 — First login
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 0.1 | pass | `/first-login-password?next=/world` with BESTYSTAFF · REQUIRED FIRST STEP, Set your own password, three password fields | J0-0.1.png |
| 0.2 | pass | `/world` with BESTYSTAFF · REQUIRED FIRST PROMPT and Career Portfolio Terms & Data Conditions | J0-0.2.png |
| 0.3 | pass | World Shell, toast Consent recorded, 0 TRACKED, 7 AGENTS, chip Riley Fenn Member. Observed on an earlier pass with a second fresh member: AGENTS reads 0 for about half a second after consent, then 7. Transient. | J0-0.3.png |

### Journey 1 — Add a technology
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 1.1 | pass | Journeys cards present; Career Placement Agents 0 tracked · 7 agents | J1-1.1.png |
| 1.2a | pass | Full-screen Career Master, five tabs, ← Back to World | J1-1.2a.png |
| 1.2b | pass | Add Entry dialog with all nine listed fields | J1-1.2b.png |
| 1.3 | pass | Tools (1), row Ledgerly ERP (ERP, 2 roles); HOW IT WAS USED showed (none) | J1-1.3.png |
| 1.4 | pass | ← Back to World returns to the World Shell | J1-1.4.png |

Steps 1.1 and 1.2a appear twice in the log because I re-ran a script after a script error (no product effect).

### Journey 2 — Placeholder opportunity
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 2.1 | pass | Panel, TRACKED (0), Nothing tracked yet., all five buttons | J2-2.1.png |
| 2.2 | pass | Job title and Company inputs, hint text, Track button | J2-2.2.png |
| 2.3 | **FAIL** | Toast Tracked "Principal Value Architect"., sub-heading, Stage Discovered, Score Not yet scored, eight score inputs, APPLICATION OUTPUTS, Placeholder opportunity with DETAILS TO BE FILLED LATER, Posting URL / Location / Notes, Save details, LINK AN EXISTING OUTPUT with "Every output you have is already linked, or you have none yet." all as specified. **Mismatch:** the sentence "No outputs linked to this opportunity yet. Link an existing output below, or import an application package." is absent because the auto-drafted cover letter (DRAFT, Source Generated from your Career Master, Authors Riley Fenn) is already linked. | J2-2.3.png |
| 2.4 | pass | TRACKED (1), row Principal Value Architect with PLACEHOLDER tag | J2-2.4.png |

### Journey 3 — File a package (script)
Terminal output: `/var/tmp/sbpg/agents/val-4000-2/j3.out`.
| Step | Result | Seen |
|---|---|---|
| 3.1 | pass | `import failed: 400 linkOpportunity needs the package JSON to carry both "company" and "role". Nothing was imported.`, exit 1 |
| 3.2 | pass | `resume_salt_basin #2 created`, `cover_letter #3 created`, `Opportunity #6 already existed; 2 output(s) linked.` Ids are #2/#3 rather than #1/#2 because the auto-drafted letter took #1 (spec allows ids to differ). |
| 3.3 | pass | Both `unchanged`, opportunity line repeated |

### Journey 4 — Provenance
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 4.1 | **FAIL** | Three cards, in order: Northwind Freight - Cover Letter, Northwind Freight - Salt Basin Resume, Cover Letter — Principal Value Architect at Northwind Freight (auto-drafted). Spec expects exactly two. The two spec cards are present, DRAFT, in the specified order. | J4-4.1-detail.png |
| 4.2 | pass | Resume card: resume - version 1 of 1; Source Imported application package; Imported Oct 2, 2026; Document created Sep 30, 2026; Last changed Oct 2, 2026; Authors Avery Quill, Jordan Reed; Version 1 of 1; Lineage v1 Draft; Career Master "Filed against 4 Career Master data points (state 5634cc483f18). Unchanged since."; Draws on "Jobs 0, Skills 0, Tools 1, Certifications 0, Engagements 0"; Salt Basin site Not published yet.; buttons Open my Career Master, Edit draft, Approve for QR, Unlink; no View my Salt Basin site button | J4-4.2.png |

### Journey 5 — Career Master and back
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 5.1 | pass | Full-screen Career Master with Manual Intake | J5-5.1.png |
| 5.2 | pass | Back on the Career Placement Agents panel, PRINCIPAL VALUE ARCHITECT still selected, both output cards visible | J5-5.2.png |

### Journey 6 — Shared editor
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 6.1 | pass | Title, Version 1 - shared block editor, 9 BLOCKS in the specified order, live preview (dark header, Avery Quill, VALUE ARCHITECT, both bullets, TABLE KEPT EXACTLY AS IMPORTED with Metric / Result and Cycle time / -30%), status Editing version 1 - Save creates version 2 (draft) | J6-6.1.png |
| 6.2 | pass | Red "Error: No changes to save."; editor stays open | J6-6.2.png |
| 6.3 | pass | Menu offers only Heading, Body Text, Bullet List, Role Line, and Cancel | J6-6.3.png |
| 6.4 | pass | Textarea initial value exactly as specified; preview updates immediately after replacement | J6-6.4.png |
| 6.5 | pass | Editor closed; card reads resume - version 2 of 2, Version 2 of 2 (edited from version 1), Lineage v1 Draft > v2 Draft. The toast had expired before the screenshot here; "Saved as a new draft version" was confirmed on the same Save path at 8.1 and 12.3c. | J6-6.5.png |

### Journey 7 — Approve for QR
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 7.1 | pass | Inline box with the specified text, Confirm approval and Cancel; Cancel leaves the card DRAFT | J7-7.1a.png, J7-7.1b.png |
| 7.2 | pass | Dialog "Set how each technology was used" listing Ledgerly ERP, dropdown preset to Hands-on (suggested) (options Choose…, Hands-on (suggested), Integration design, Adjacent exposure), Cancel and Save to Career Master and continue | J7-7.2.png |
| 7.3 | pass | "Finalization cancelled — technologies still need a proficiency category."; card still DRAFT | J7-7.3.png |
| 7.4 | pass | APPROVED - QR LIVE; Lineage v1 Draft > v2 Approved - QR live (QR); Approved Oct 2, 2026 by Riley Fenn; QR link is live on version 2: /r/WBSzTw…; "Career Master now has 5 data points - it has changed since."; Approve for QR disabled | J7-7.4.png |
| 7.5 | pass | New tab with the private QR page: Private link · Northwind Freight - Salt Basin Resume, Avery Quill, edited summary, both bullets, table with Cycle time and -30%, LIVE DATA banner | J7-7.5.png |

### Journey 8 — Edit an approved output
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 8.1 | pass | Toast; resume - version 3 of 3; Version 3 of 3 (edited from version 2); Lineage v1 Draft > v2 Approved - QR live (QR) > v3 Draft; DRAFT; "QR link is live on version 2 (a newer draft exists):" | J8-8.1.png |
| 8.1b | pass | QR page still shows the old bullet | J8-8.1b.png |
| 8.2a | pass | No category dialog; APPROVED - QR LIVE; Lineage v1 Draft > v2 Approved > v3 Approved - QR live (QR); QR link live on version 3, same slug | J8-8.2a.png |
| 8.2b | pass | Reloaded QR page shows "Added a regional rollout playbook." | J8-8.2b.png |

### Journey 9 — Link and unlink
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 9.1 | **FAIL** | Unlinking Northwind Freight - Cover Letter removed that card and "Output to link" offered exactly "Choose an output..." and "Northwind Freight - Cover Letter (cover letter, Draft)". **Mismatch:** two cards remain, not one (auto-drafted letter). | J9-9.1.png |
| 9.2 | pass | After Link output the card is back (three cards, as before) | J9-9.2.png |

### Journey 10 — Import a document
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 10.1 | pass | Card "Imported Resume — note.txt": Source Imported document (uploaded by you), Authors none recorded, resume - version 1 of 1. It is the fourth card, not the third (same cause). | J10-10.1.png |
| 10.2a | pass | Editor shows three Body Text rows (3 BLOCKS) | J10-10.2a.png |
| 10.2b | pass | After editing and saving: Version 2 of 2 (edited from version 1) | J10-10.2b.png |

### Journey 11 — Fill in the placeholder
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 11.1a | pass | Toast "Opportunity details saved"; placeholder box disappears | J11-11.1a.png |
| 11.1b | pass | Tracked list row no longer shows PLACEHOLDER | J11-11.1b.png |

### Journey 12 — Phone width 390x800
| Step | Result | Seen | Screenshot |
|---|---|---|---|
| 12.1 | pass | scrollWidth 390; brand, three tabs and avatar R inside the viewport | J12-12.1.png |
| 12.2 | pass | Panel left 8, right 382; nothing past the right edge | J12-12.2.png |
| 12.3a | pass | Editor is one column: block list, then Print / Save PDF and the preview below | J12-12.3a.png |
| 12.3b | pass | Body Text textarea at x 16, width 358, fully on screen | J12-12.3b.png |
| 12.3c | pass | Toast seen; card reads resume - version 4 of 4 | J12-12.3c.png |
| 12.4a | pass | Confirm approval and Cancel both inside the card | J12-12.4a.png |
| 12.4b | pass | APPROVED - QR LIVE, no category dialog, scrollWidth 390 | J12-12.4b.png |

## Edge cases checked
- Foreign member: logged in as member@test.local, `POST /api/resume-outputs/2/share` returned 404 "Resume output not found" and `POST /api/career-agents/resume-outputs/2/versions` returned 400 "Output not found."
- Save with no change shows "Error: No changes to save." (6.2).
- Approve with an uncategorised technology shows the dialog; Cancel leaves the draft (7.2, 7.3).
- Not checked: the "islands could not be loaded" state and a non-editable AI-generated output (no UI route to produce either).

## Console errors and failed requests
- No page errors. No failed app requests on the app origin.
- External, sandbox-blocked (`external_blocked`): Google Fonts stylesheet (`ERR_CERT_AUTHORITY_INVALID`, 24 times, each with a generic console "Failed to load resource" line) and the three.js CDN script on `/login`.
- Expected HTTP 400: 2x `POST /api/career-agents/resume-outputs/2/versions` (the intended "No changes to save." of 6.2, from two script runs).
- Expected HTTP 409: 2x `POST /api/resume-outputs/4/share` (finalization gate refusing before the category dialog, 7.2 and 7.3 flow).
- Regression-gate ground rule: no blank, clipped, unreadable or contextless screen at 1280px or 390px.

## Observations (not failures)
- Editor block-list rows render label and detail as separate spans with the ellipsis in the text; visually they match the spec.
- A hidden `data-ux-audit-probe` output element holds full-page JSON text and matches text searches; harmless to users.

## Fix details received
None (round 1).

## Process notes
- Server stopped by PID file; database `sb_rl_val_4000_2` dropped. No product code or specs changed; nothing committed.
- Leftover files from an earlier attempt were discarded and the round-1 output directory cleared before this run.
