# Salt Basin Email and Attachment Memory Ingestion Design

Purpose: define how Salt Basin should ingest Betsy's emails and attachments into a recommended memory context list for BestyStaff and the broader Salt Basin agent hierarchy.

Status: design-ready. Actual ingestion requires an email export, local mailbox/archive path, or approved email connector access.

First connected-Gmail inventory and recommended memory context draft: [gmail-memory-context-first-pass-2026-07-08.md](gmail-memory-context-first-pass-2026-07-08.md).

## Core Principle

Do not ingest email as "raw memory." Ingest it as governed operational context.

Email contains a mix of useful memory, private life, client-sensitive information, credentials, legal/financial risk, duplicate threads, stale assumptions, and low-value noise. The ingestion agent should extract context with consent, redaction, source trace, confidence, and approval gates.

## Email Ingestion Agent

Agent name: BestyStaff Email and Attachment Memory Ingestion

Command: `/saltbasin-email-memory-ingest`

Primary job: process emails and attachments, extract recommended memory candidates, classify sensitivity, deduplicate, summarize, and produce an approval-ready memory context list.

### System Prompt

```text
You are BestyStaff Email and Attachment Memory Ingestion, a Salt Basin internal memory-building agent. Your job is to turn Betsy's emails and attachments into governed memory candidates, not uncontrolled memory.

Use Salt Basin's universal reasoning model: operational truth, lineage, evidence, confidence, governance, and reusable systems thinking. For each candidate memory, identify origin, owner, relationship, evidence, sensitivity, current relevance, confidence, and whether human approval is required before use.

Never expose private, confidential, privileged, employer-owned, client-sensitive, credential, medical, personal, or financial details in a general agent memory. Redact or quarantine sensitive content. Never assume permission to use a contact, client name, project detail, contract term, source document, or proprietary artifact externally.

Produce a recommended memory context list for Betsy to approve. Keep raw source references separate from approved memory. Prefer summaries, patterns, preferences, relationships, and reusable operating context over verbatim email content.
```

## Required Inputs

```json
{
  "ingestionRunId": "",
  "sourceType": "gmail_export | google_takeout | outlook_export | pst | mbox | eml_folder | local_archive | connector",
  "sourcePathOrConnectorId": "",
  "dateRange": {
    "start": "",
    "end": ""
  },
  "includeAttachments": true,
  "includeInlineImages": false,
  "includeCalendarInvites": true,
  "includeSentMail": true,
  "includeArchivedMail": true,
  "includeTrashSpam": false,
  "exclusionRules": {
    "excludeSenders": [],
    "excludeDomains": [],
    "excludeLabelsOrFolders": [],
    "excludeKeywords": [],
    "excludeAttachmentTypes": []
  },
  "sensitivityPolicy": "strict",
  "approvalRequiredBeforeMemoryActivation": true
}
```

## Recommended Ingestion Workflow

1. Source inventory:
   - Count messages, threads, attachments, senders, domains, labels/folders, date ranges, file types, and estimated size.
2. Safety pre-scan:
   - Identify likely privileged, personal, medical, financial, credential, employer-owned, client-sensitive, and legal content.
3. Shard mailbox:
   - Split by date, sender domain, project/topic, label/folder, or attachment type.
4. Extract metadata:
   - Capture sender, recipient, dates, subject, thread ID, labels, attachment names, file types, and source refs.
5. Extract content:
   - Summarize thread purpose, decisions, commitments, preferences, relationships, expertise signals, follow-up items, and reusable context.
6. Classify memory candidates:
   - Decide whether each item is approved candidate, needs review, sensitive/quarantine, duplicate, stale, or low value.
7. Deduplicate:
   - Merge repeated threads, forwarded chains, duplicate attachments, and recurring signatures.
8. Build recommended memory context list:
   - Produce short memory records with evidence refs, sensitivity tags, confidence, and suggested usage.
9. Human approval:
   - Betsy approves, edits, rejects, or quarantines candidates.
10. Activate memory:
   - Only approved records become available to BestyStaff or other agents.

## Memory Context Categories

These are the recommended memory types to extract.

| Category | What To Capture | Example Memory Candidate | Default Visibility |
|---|---|---|---|
| Identity and Positioning | How Betsy describes herself, Salt Basin, services, values, differentiators | "Betsy prefers evidence-driven operational truth language over generic consulting language." | Internal approved |
| Relationship Context | People, connection type, context, preferred communication style | "Contact is a referral from X context and asked about RevOps diagnostics." | Restricted |
| Prospect and Lead Context | Visitor/prospect pain, urgency, industry, systems, next step | "Prospect has CPQ-to-billing friction and wants a diagnostic conversation." | Restricted |
| Client/Project Pattern | Anonymized project pattern, industry, problem type, resolution pattern | "Global manufacturer pattern: fragmented pricing and approval workflows." | Internal restricted |
| Operating Preferences | Betsy's preferred ways of working, review style, deliverable preferences | "Betsy prefers assumptions separated from facts and risks." | Internal approved |
| Decision History | Decisions made, rationale, date, owner, future implications | "Use safe anonymized previews for homepage visitors; do not show client artifacts." | Internal approved |
| Product Ideas | Features, workflows, automations, agent ideas, backlog items | "Add FAQ gap capture from BestyStaff homepage chats." | Internal approved |
| Follow-Up Commitments | Promised actions, pending responses, deadlines | "Follow up with prospect after preview request." | Restricted |
| Document and Attachment Index | Attachment summary, file type, topic, sensitivity, source thread | "Resume draft attachment, career positioning, approved for internal reference." | Restricted |
| Evidence and Source Map | Which email/thread supports a memory candidate | "Thread ID/source ref supports preference, not external claim." | Restricted |
| Writing Voice | Tone, phrasing, approved language, phrases to avoid | "Use warm, direct, operationally precise language." | Internal approved |
| Risk and Guardrails | Sensitive claims, prohibited language, confidentiality boundaries | "Never claim ownership of employer-produced contracts." | Global guardrail |
| Contact Preferences | Preferred channel, timezone, communication style | "Contact prefers email follow-up." | Restricted |
| Reusable Deliverable Patterns | Templates, structures, examples that are safe to reuse | "Executive brief should include bottom line, decision points, risks, next actions." | Internal approved |
| Learning Signals | Repeated questions, recurring visitor needs, product maturity signals | "Multiple visitors ask for safe deliverable previews." | Internal approved |

## Memory Candidate Template

```json
{
  "memoryCandidateId": "",
  "category": "",
  "summary": "",
  "recommendedUse": "",
  "doNotUseFor": [],
  "sensitivity": "public_safe | internal | restricted | confidential | quarantine",
  "containsPersonalData": false,
  "containsClientSensitiveData": false,
  "containsEmployerOwnedData": false,
  "containsCredentialOrSecret": false,
  "sourceRefs": [
    {
      "sourceType": "email | attachment | calendar | thread",
      "sourceId": "",
      "threadId": "",
      "messageDate": "",
      "senderDomain": "",
      "attachmentName": "",
      "lineageNote": ""
    }
  ],
  "confidence": "high | medium | low",
  "stalenessRisk": "current | possibly_stale | stale",
  "approvalStatus": "recommended | needs_review | approved | rejected | quarantined",
  "approvedBy": "",
  "approvedAt": "",
  "memoryTags": []
}
```

## Recommended Memory Context List Output

```markdown
# Recommended Memory Context List

## Run Summary
- Source:
- Date range:
- Messages reviewed:
- Attachments reviewed:
- Candidates generated:
- Candidates requiring review:
- Quarantined items:

## High-Value Approved Candidates
| ID | Category | Summary | Suggested Use | Confidence | Sensitivity |
|---|---|---|---|---|---|

## Needs Betsy Review
| ID | Category | Summary | Review Reason | Risk | Suggested Decision |
|---|---|---|---|---|---|

## Quarantined / Do Not Use
| ID | Reason | Content Type | Action |
|---|---|---|---|

## Relationship Context Candidates
| Person/Org | Connection | Context | Follow-Up Opportunity | Sensitivity |
|---|---|---|---|---|

## Product and Agent Improvement Signals
| Signal | Source Pattern | Product Opportunity | Priority |
|---|---|---|---|

## Follow-Up Commitments
| Commitment | Owner | Due Date | Source | Status |
|---|---|---|---|---|

## Guardrail Updates Recommended

## Memory Activation Recommendations
```

## Sensitivity Classification

| Sensitivity | Meaning | Agent Access |
|---|---|---|
| `public_safe` | Safe to use in website copy, general answers, or public context after approval | Visitor-facing agents allowed |
| `internal` | Useful for Betsy's internal agent behavior but not public | Internal agents only |
| `restricted` | Contains personal/contact/prospect/client context | BestyStaff and approved internal agents only |
| `confidential` | Sensitive business, legal, financial, employer, client, or private content | Human review only |
| `quarantine` | Credentials, secrets, privileged, medical, highly private, or disallowed content | No agent use |

## Attachment Handling

Attachments should be indexed before summarization.

| Attachment Type | Recommended Handling |
|---|---|
| PDF/DOCX/PPTX | Extract text, summarize purpose, classify sensitivity, retain source ref |
| XLSX/CSV | Profile schema, row counts, columns, sensitive fields, do not memorize raw rows by default |
| Images | OCR only if relevant; skip personal images unless explicitly approved |
| Contracts/Legal Docs | Quarantine or restricted review; never make public claims from them |
| Resumes/Portfolios | Internal approved after Betsy review |
| Credentials/Keys | Quarantine immediately |
| Medical/Family/Personal | Quarantine unless Betsy explicitly approves a narrow memory |

## Default Exclusions

Exclude or quarantine by default:

- Passwords, API keys, tokens, credentials.
- Bank, tax, payroll, medical, family, legal, or highly personal content.
- Employer-owned project files.
- Client contracts, statements of work, implementation files, or proprietary deliverables.
- Confidential client names or project details from past employers.
- Attorney-client privileged or legal dispute content.
- Raw personal contact lists until approved.
- Attachments with unknown sensitivity.

## Memory Approval Workflow

```text
candidate_generated
needs_review
approved_for_internal_use
approved_for_public_safe_use
rejected
quarantined
expired_or_stale
```

Rules:

- No memory becomes active until approved.
- Visitor-facing agents can only use `public_safe` or explicitly approved general positioning memories.
- Contact and relationship memories remain restricted.
- Confidential/quarantined memories cannot be used to answer visitors.
- Every active memory must include source refs and confidence.

## Agent Pool For Large Mailboxes

Recommended workers:

| Volume | Suggested Agents |
|---|---|
| Up to 5,000 messages or 500 attachments | 1 intake profiler, 2 email memory workers, 1 attachment worker, 1 memory review lead |
| 5,000-50,000 messages or 500-5,000 attachments | 1 intake profiler, 6-12 email workers, 2-4 attachment workers, 2 leads, 1 governance manager |
| 50,000+ messages or 5,000+ attachments | Shard by year/domain/topic; 20+ workers, multiple leads, governance manager, human review batches |

Shard by:

- Year or quarter.
- Sender domain.
- Email label/folder.
- Topic cluster.
- Attachment type.
- Prospect/client/internal/personal classification.

## Recommended API Functionality

```http
POST /api/memory/email-ingestion/runs
POST /api/memory/email-ingestion/source-inventory
POST /api/memory/email-ingestion/shards
POST /api/memory/email-ingestion/messages/extract
POST /api/memory/email-ingestion/attachments/extract
POST /api/memory/email-ingestion/candidates
POST /api/memory/email-ingestion/candidates/:id/approve
POST /api/memory/email-ingestion/candidates/:id/reject
POST /api/memory/email-ingestion/candidates/:id/quarantine
GET /api/memory/email-ingestion/runs/:runId/recommended-context-list
POST /api/memory/activate
```

## Implementation Notes

- Prefer local export ingestion first for control and auditability.
- Keep raw email archive separate from approved memory.
- Store only summaries and source refs in memory, not raw message bodies by default.
- Use deterministic file parsing for attachments, then agent reasoning for context extraction.
- Add a "memory expiry" or review date for relationship and prospect context.
- Include a delete pathway for any memory record.
- Use Salt Basin universal reasoning context for all extraction, classification, and approval recommendations.
