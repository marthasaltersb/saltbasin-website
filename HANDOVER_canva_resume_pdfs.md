# Handover: Canva Resume Source PDFs

Date: 2026-07-08
Workspace: `C:\Users\mbets\saltbasin-website`

## Goal

Create and maintain Canva-uploadable source PDFs from two attached HTML resume/source documents:

- Case study portfolio source HTML:
  `C:\Users\mbets\.codex\attachments\b2dffb37-4a1c-4082-9dd0-862ecad0b3f2\pasted-text.txt`
- Career master database source HTML:
  `C:\Users\mbets\.codex\attachments\6592e910-8ab9-47ef-9c1b-ac95625891e6\pasted-text.txt`

These PDFs are source/evidence documents for Canva AI to produce polished resumes, not final resume designs themselves.

## Current Final PDFs

All final PDFs are under:

`C:\Users\mbets\saltbasin-website\output\pdf`

Current files:

- `Betsy_Salter_Career_Master_Database_Canva_Source.pdf`
  - Portrait letter
  - `612 x 792 pts`
  - 7 pages
  - Narrow-column career master layout
- `Betsy_Salter_Career_Master_Database_TRUE_Portrait_Narrow_Columns.pdf`
  - Same content as the stable career master file above
  - Kept as an explicit no-cache / unambiguous version
- `Betsy_Salter_Case_Study_Portfolio_Canva_Source.pdf`
  - Landscape letter
  - `792 x 612 pts`
  - 12 pages

## Required Content Changes Already Applied

The generated PDFs should contain these names:

- `SaltBasin HOS (Highway Operating System)`
- `SaltTide CHI (Credit Health Infrastructure)`

The generated PDFs should NOT contain these old names:

- `HandoverOS`
- `CardWise`

Certification wording in the career master should say:

`Prior Held Certs for Salesforce admin, Platform builder, Sales Cloud, and Revenue Cloud`

Old certification wording should NOT remain:

- `Salesforce.com Certified; Salesforce CPQ Trained`
- `Salesforce.com Certified and Salesforce CPQ Trained`

## Layout Decisions

Career master:

- Must be portrait/vertical, not landscape.
- Short job-history columns should be narrow:
  - `Start`
  - `End`
  - `Duration`
- The large evidence/achievement columns should receive the extra width.
- The projects table must show the final project rows with the new names:
  - `SaltBasin HOS (Highway Operating System) - Q2R Intelligence Layer (PE SaaS)`
  - `SaltTide CHI (Credit Health Infrastructure) - Investor Advisory Tool`

Case study portfolio:

- Kept landscape because it is card-based and works best as two cards per page.
- Must use the new SaltBasin HOS and SaltTide CHI names.

## Visual Requirement

No dark text on dark backgrounds anywhere.

Important areas that were fixed/verified:

- Case study card headers
- `CASE STUDY #` labels
- Header badges/tags on dark bands
- Career master dark positioning/venture cards
- Table headers

Rule of thumb for future regeneration:

- Anything on navy, charcoal, maroon, green, or other dark backgrounds should be light text such as `#F5F0E8` or white.
- Do not rely on original inline styles alone; use print CSS overrides for dark-background safety.

## Verification Already Done

Final regenerated PDFs were checked with:

- `pdfinfo` for page count and page size
- `pypdf` text extraction for old/new product names and cert wording
- `pdftoppm` renders for visual QA

Verified text extraction:

- Career master:
  - `HandoverOS`: 0
  - `CardWise`: 0
  - `SaltBasin HOS (Highway Operating System)`: present
  - `SaltTide CHI (Credit Health Infrastructure)`: present
  - certification wording present
- Case study:
  - `HandoverOS`: 0
  - `CardWise`: 0
  - `SaltBasin HOS (Highway Operating System)`: present
  - `SaltTide CHI (Credit Health Infrastructure)`: present

Visual renders checked:

- Case study first page: dark case headers now use light text.
- Case study final page: SaltTide CHI card renders with light-on-dark header.
- Career projects page: final project rows use new names.
- Career positioning page: dark cards use light text.

## Regeneration Pattern

No permanent source script is currently left in the repo. Temporary scripts were created and deleted after successful regeneration.

If regeneration is needed again, use a one-off Node script that:

1. Reads the two attachment HTML files.
2. Applies these global replacements:
   - `HandoverOS` -> `SaltBasin HOS (Highway Operating System)`
   - `CardWise` -> `SaltTide CHI (Credit Health Infrastructure)`
   - `Salesforce.com Certified; Salesforce CPQ Trained` -> `Prior Held Certs for Salesforce admin, Platform builder, Sales Cloud, and Revenue Cloud`
   - `Salesforce.com Certified and Salesforce CPQ Trained` -> `Prior Held Certs for Salesforce admin, Platform builder, Sales Cloud, and Revenue Cloud`
3. Injects print CSS.
4. Writes temporary HTML into `tmp\pdfs`.
5. Prints via headless Chrome to `output\pdf`.
6. Renders sample pages via Poppler and visually checks contrast/layout.
7. Deletes temporary scripts and temp render/source folders.

Headless Chrome path used:

`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

Poppler path used:

`C:\Users\mbets\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin`

Bundled Python path used:

`C:\Users\mbets\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

Bundled Node path used:

`C:\Users\mbets\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

## Canva Prompt

Use this prompt with the uploaded PDFs:

```text
Use the uploaded PDFs as source material to create polished, modern resume documents for Betsy Salter.

Create:
1. A 2-page executive resume
2. A 1-page recruiter-facing resume
3. A portfolio-style resume appendix with selected case studies and quantified outcomes

Use the PDFs as raw evidence, not as a layout to copy. Synthesize the material into clean resume sections.

Position Betsy as a Strategic Operator, C-suite partner, AI-native operator, revenue operations / quote-to-cash transformation leader, and enterprise systems strategist.

Prioritize:
- Quantified business outcomes
- PE portfolio transformation
- Salesforce, CPQ, CLM, Q2C/O2C, revenue operations, and GTM systems expertise
- AI-native product and operator work
- SaltBasin HOS (Highway Operating System)
- SaltTide CHI (Credit Health Infrastructure)
- Prior held certs for Salesforce admin, Platform builder, Sales Cloud, and Revenue Cloud

Visual style:
- Clean, premium, executive resume design
- White background with deep navy, muted gold, and slate accents
- Strong hierarchy, generous spacing, readable typography
- No dark text on dark backgrounds anywhere
- No decorative clutter
- Make all output editable in Canva

Tone:
Senior, strategic, confident, precise. Avoid generic consultant language. Emphasize operator judgment, business impact, systems transformation, and cross-functional leadership.
```

## Notes For Next Session

- The repo has many unrelated dirty/untracked files. Do not reset or clean unrelated changes.
- The PDFs under `output\pdf` are untracked from git in the current working tree.
- Network access is restricted; use local Chrome/Poppler/Python/Node paths.
- Chrome printing generally requires escalation in this desktop sandbox.
- If a user says Canva still sees old content, create a new filename rather than only overwriting the old one, because Canva/browser upload flows may cache aggressively.
