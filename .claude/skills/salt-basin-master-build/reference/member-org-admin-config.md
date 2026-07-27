# Member Configuration + Member Organization Admin Configuration

> Verbatim source text supplied by Betsy on 2026-07-12, as a companion/extension to the Ultimate Master Build Prompt (`reference/master-build-prompt.md`). This file is read-only reference material for the `salt-basin-master-build` skill — do not silently edit it. See `docs/salt-basin-master-build-member-org-reconciliation.md` for how this maps onto the master prompt's numbered sections, where it conflicts with already-shipped schema, and what's still an open decision.

## 1. CANONICAL MEMBER IDENTITY RULE

Do not create a separate user-record type for a Member Organization Admin.

A Member Organization Admin is a canonical Member identity operating with one or more Organization-scoped authority profiles.

The same Member may simultaneously act as:

- Individual Member
- Customer
- Payer
- Buyer
- Organization Member
- Organization Administrator
- Executive
- Account Executive
- Finance User
- Definition Owner
- Channel Participant

These roles must not require duplicate Member records.

Use:

```ts
interface MemberIdentity {
  memberId: string;
  canonicalIdentityId: string;

  personalConfigurationId: string;

  roleAssignments: MemberRoleAssignment[];
  organizationMemberships: OrganizationMembership[];

  effectiveFrom: string;
  effectiveTo?: string;

  securityPolicyId: string;
  retentionPolicyId: string;
}
```

Create Organization membership separately:

```ts
interface OrganizationMembership {
  organizationMembershipId: string;

  memberId: string;
  organizationId: string;

  membershipStatus:
    | "invited"
    | "active"
    | "suspended"
    | "inactive";

  authorityProfileIds: string[];

  moduleAccessProfileIds: string[];
  viewAccessProfileIds: string[];

  effectiveFrom: string;
  effectiveTo?: string;
}
```

The distinction between a standard Member experience and Member Organization Admin experience is defined by:

```text
MODULE ACCESS
+
VIEW ACCESS
+
AGENT ACCESS
+
DATA SCOPE
+
ACTION AUTHORITY
```

Do not create:

```text
memberType = "ADMIN"
```

as the primary identity distinction.

Administrative authority belongs to an effective-dated scoped assignment.

---

# 2. MEMBER CONFIGURATION

Every Member receives a personal configuration environment.

This is the baseline Salt Basin Member capability set.

Every Member should be able to access and configure:

## Personal Brand Website

The Member may configure a personal brand website through the Salt Basin world.

Support:

- identity
- preferred name
- personal positioning
- professional headline
- personal biography
- personal brand definitions
- approved color themes
- typography selections
- scene selection
- homepage configuration
- About configuration
- Career configuration
- Resume output exposure
- Portfolio configuration
- Case Study configuration
- social links
- contact configuration
- public / private / draft state

The personal brand site should use configurable Salt Basin scene templates.

Do not require the Member to edit source code.

The Member may use Agent-mediated configuration.

Example:

> "Make my homepage more focused on private equity and revenue transformation."

The Personal Brand Staff Agent evaluates the Member's approved Career Molecules, Skills, Industry metadata, positioning, and public visibility policy.

The Agent proposes changes.

The Member approves or modifies them.

Published website state must only expose approved public information.

---

# 3. PERSONAL BRAND WORLD

Create a Member-scoped Personal Brand World.

The Personal Brand World may spatially represent:

- Member Identity Molecule
- Career Channel Rod
- Industry Constellation
- Skill Molecules
- Capability Molecules
- Quantified Outcome Molecules
- Case Study Molecules
- Resume Outputs
- Public Content
- Personal Products or Projects

The Member should be able to select a semantic object and determine whether it is:

```text
PRIVATE
MEMBER_ONLY
ORGANIZATION_VISIBLE
SHARED_BY_LINK
PUBLIC
```

Visibility must be governed at the semantic object and output level.

Do not assume every Career Atom is public because it exists in the Career model.

---

# 4. RESUME CONFIGURATION

Every Member receives Resume Configuration capability.

All resume templates must use the same canonical Career semantic model.

Initial required templates remain:

```text
EXECUTIVE_DASHBOARD_RESUME
STRATEGIC_OPERATOR_RESUME
TECHNICAL_ARCHITECTURE_RESUME
ATS_LINEAR_RESUME
```

A Member may:

- select a template
- select a target role
- select target industries
- select positioning emphasis
- select quantified outcomes
- select skills
- select case studies
- configure summary emphasis
- configure public contact information
- configure theme
- configure page density
- configure output format

The Member should interact primarily through a Resume Staff Agent.

Example:

> "Build me a version focused on enterprise AI platform architecture."

The Agent identifies:

- relevant Career Atoms
- relevant Skill Molecules
- relevant Capability Molecules
- quantified accomplishments
- system architecture evidence
- Agent architecture work
- product architecture work

The Agent proposes the output configuration.

Do not create a second resume data record.

Create an Output Projection.

---

# 5. RESUME OUTPUT PROJECTION

A Resume Output is a projection of the canonical Career state.

Create:

```ts
interface ResumeOutputProjection {
  resumeOutputId: string;

  memberId: string;

  templateId: string;

  targetDefinitionId?: string;

  careerAtomVersionIds: string[];
  careerMoleculeVersionIds: string[];

  includedSectionIds: string[];
  excludedSectionIds: string[];

  visualThemeId: string;

  generatedAt: string;

  effectiveCareerStateAt: string;

  outputStatus:
    | "draft"
    | "approved"
    | "published"
    | "archived";

  publicExposurePolicyId: string;

  queryRodHashId?: string;

  lineageRootId: string;
}
```

The Resume Output is not a separate copy of the Member's Career truth.

It is a configured projection.

When the underlying Career state changes, the system should identify whether the Resume Output is stale.

Do not automatically rewrite an approved resume.

Channel Rod Staff may notify the Member:

> "Your Career Channel has three approved updates not reflected in this resume output."

The Member chooses whether to regenerate.

---

# 6. RESUME DOWNLOAD OUTPUTS

Every Member may generate and download configured Resume Outputs.

Support at minimum:

- PDF
- DOCX
- ATS-friendly text or document output
- structured resume JSON where appropriate

The output should preserve lineage to:

- template version
- Career Atom versions
- Career Molecule versions
- configuration
- effective time

Generated outputs should have a stable output ID.

Do not create an untraceable file with no relationship to the semantic model.

---

# 7. RESUME EXPOSURE TO PERSONAL BRAND WEBSITE

Every Member may optionally expose approved Resume Outputs to their personal brand website.

Support:

```text
DO NOT PUBLISH
PUBLIC RESUME PAGE
DOWNLOAD LINK
EMBEDDED RESUME VIEW
SELECTED RESUME SECTIONS ONLY
```

A Member may expose different Resume Outputs for different purposes.

Example:

```text
/resume/executive
/resume/architecture
```

or one primary Resume Output.

Do not assume the ATS Resume is the public website Resume.

The Member controls output exposure.

The Personal Brand site should reference the Resume Output Projection.

Do not duplicate resume content manually into website sections unless intentionally configured.

Example:

```text
CAREER SEMANTIC MODEL
        ↓
RESUME OUTPUT PROJECTION
        ↓
PUBLIC EXPOSURE POLICY
        ↓
PERSONAL BRAND WEBSITE
```

---

# 8. MEMBER FINANCIAL CONNECTIONS

Every Member receives the ability to configure connections to external financial accounts, subject to supported integrations, consent, security, and legal requirements.

Initial connection classes include:

```text
BANK ACCOUNT
UNSECURED DEBT ACCOUNT
```

Bank Accounts may include:

- Checking
- Savings
- Money Market
- other supported cash accounts

Unsecured Debt Accounts may include:

- Credit Card
- Personal Loan
- Line of Credit
- other supported unsecured debt

Do not automatically classify secured debt as unsecured debt.

Create separate future account classes where required.

---

# 9. FINANCIAL ACCOUNT CONNECTION MODEL

Create:

```ts
interface ExternalFinancialConnection {
  connectionId: string;

  memberId: string;

  providerId: string;
  connectionType: string;

  consentId: string;

  connectionStatus:
    | "pending"
    | "active"
    | "attention_required"
    | "revoked"
    | "expired";

  permittedAccountClasses: string[];

  lastSuccessfulRefreshAt?: string;
  nextRefreshAt?: string;

  securityPolicyId: string;
  retentionPolicyId: string;

  createdAt: string;
  updatedAt: string;
}
```

Represent an account independently:

```ts
interface FinancialAccountDefinition {
  financialAccountId: string;

  memberId: string;

  connectionId: string;

  accountClass:
    | "checking"
    | "savings"
    | "money_market"
    | "credit_card"
    | "personal_loan"
    | "unsecured_line_of_credit"
    | "other";

  liabilityClass?:
    | "unsecured"
    | "secured"
    | "not_applicable"
    | "unknown";

  institutionName: string;

  accountDisplayName: string;

  maskedAccountReference?: string;

  currency: string;

  currentBalanceAtomId?: string;
  availableBalanceAtomId?: string;
  creditLimitAtomId?: string;
  minimumPaymentAtomId?: string;
  interestRateAtomId?: string;
  paymentDueDateAtomId?: string;

  connectionStatus: string;

  securityPolicyId: string;

  effectiveFrom: string;
  effectiveTo?: string;
}
```

Sensitive credentials or access tokens must not become ordinary Evidence Atoms.

Use the relevant secure connection/token architecture.

Salt Basin stores only permitted references and semantic outputs.

---

# 10. PERSONAL FINANCIAL CHANNELS

Every Member may have Member-scoped Personal Financial Channels.

Initial configurable Channel Rods may include:

```text
CASH LIQUIDITY CHANNEL ROD
SPENDING CHANNEL ROD
UNSECURED DEBT CHANNEL ROD
CREDIT HEALTH CHANNEL ROD
REIMBURSEMENT CHANNEL ROD
```

These are personal Member Channels.

They are not Organization Channels unless the Member intentionally contributes an authorized output into an Organization context.

Personal financial data must not automatically become visible to a Member's Organization.

This is a critical security boundary.

A Member may be a CFO, Organization Admin, or Founder.

Their personal bank data remains Member-private unless an explicit authorized sharing action occurs.

Do not infer Organization visibility from Organization Admin authority.

---

# 11. UNSECURED DEBT SEMANTIC MODEL

The Unsecured Debt Channel should support semantic Atoms such as:

- Account Type
- Creditor
- Current Balance
- Statement Balance
- Credit Limit
- Available Credit
- Interest Rate
- Minimum Payment
- Payment Due Date
- Delinquency State
- Charge-Off State
- Payment Arrangement State
- Settlement State
- Legal Action State
- Reported Credit Balance
- Internal Creditor Balance
- Interest Accrued
- Fees Accrued

Do not assume all account states are available from one source.

Preserve Source Authority.

Example:

```text
CREDITOR SOURCE
        ↓
Current claimed balance

CREDIT REPORT SOURCE
        ↓
Reported balance / charge-off state

BANK SOURCE
        ↓
Actual payment evidence
```

These Atoms may have high Affinity but low Alignment.

Do not overwrite them into one balance merely to make the numbers match.

Use the Salt Basin semantic architecture to surface divergence.

---

# 12. MEMBER FINANCIAL STAFF

Create Member-scoped Financial Staff Agent templates.

Potential initial staff:

```text
PERSONAL FINANCE STAFF
SPENDING STAFF
UNSECURED DEBT STAFF
CREDIT HEALTH STAFF
REIMBURSEMENT STAFF
```

All derive from the reusable BestyStaff Template Framework.

They are not Channel Rod Staff unless assigned to a Channel Rod.

Example:

```text
UNSECURED DEBT STAFF
        ↓
assigned to
UNSECURED DEBT CHANNEL ROD
        ↓
workforceType = CHANNEL_ROD_STAFF
```

The Agent may answer:

> "Which unsecured debts are costing me the most in interest?"

> "How much cash is committed before my next income event?"

> "Can I afford this purchase?"

> "Which account is closest to a configured guardrail?"

> "Why doesn't the creditor balance match the reported credit balance?"

The Agent must remain inside Member-specific security boundaries.

---

# 13. MEMBER ORGANIZATION ADMIN CONFIGURATION

A Member Organization Admin is a Member with Organization-scoped configuration authority.

The Organization Admin experience adds modules and views.

It does not replace Member Configuration.

An Organization Admin retains all personal Member capabilities.

Therefore:

```text
MEMBER ORGANIZATION ADMIN
        =
MEMBER CAPABILITY SET
        +
ORGANIZATION ADMIN MODULE ACCESS
        +
ORGANIZATION ADMIN VIEW ACCESS
        +
ORGANIZATION-SCOPED AGENT AUTHORITY
```

Do not hide the Member's personal brand, resume, or financial capabilities merely because they are an Organization Admin.

---

# 14. MEMBER ORGANIZATION ADMIN MODULES

Initial Organization Admin modules should include:

```text
FOUNDATION CONFIGURATION
ENTERPRISE DEFINITION
ELEMENT INDEX
ATOM DEFINITION
MAGNETIC FIELD CONFIGURATION
MOLECULE CONFIGURATION
CHANNEL CONFIGURATION
CHANNEL ROD CONFIGURATION
TRIBUTARY CONFIGURATION
CONFLUENCE CONFIGURATION
CHANNEL ROD STAFF CONFIGURATION
AGENT BOUNDARY CONFIGURATION
QUESTION DEFINITION
PORT CONFIGURATION
SOURCE OBJECT MAPPING
SOURCE FIELD MAPPING
VISUAL SEMANTIC CONFIGURATION
GEOMETRY INVENTORY
MATERIAL CONFIGURATION
SCENE CONFIGURATION
ROTATION CHOREOGRAPHY
SIMULATION CONFIGURATION
FORMULA REGISTRY
SECURITY POLICY
RETENTION POLICY
MEMBER ACCESS
ORGANIZATION ROLE CONFIGURATION
THESIS / TRIBUTARY LEDGER
```

Access remains configurable.

Do not assume every Organization Admin receives all administrative modules.

Use authority profiles.

---

# 15. MEMBER VS. ORGANIZATION DATA SCOPE

Create explicit data scopes:

```text
MEMBER_PRIVATE
MEMBER_PUBLIC
ORGANIZATION_PRIVATE
ORGANIZATION_SHARED
CROSS_ORGANIZATION_AUTHORIZED
PUBLIC
```

The same Member may interact with multiple scopes.

Example:

Betsy configures:

```text
Personal Resume
→ MEMBER_PRIVATE
```

Publishes one Resume Output:

```text
Executive Resume Output
→ MEMBER_PUBLIC
```

Connects a checking account:

```text
Chase Checking
→ MEMBER_PRIVATE
```

Acts as Salt Basin Organization Admin:

```text
Salt Basin Foundation Definitions
→ ORGANIZATION_PRIVATE
```

Publishes a corporate Product Definition:

```text
SaltTide Product Definition
→ PUBLIC
```

Do not mix scopes.

The current world location does not determine data visibility by itself.

Visibility is governed by semantic object scope plus Agent Boundary plus interacting-user authority.

---

# 16. ORGANIZATION ADMIN WORLD

Create an Organization Admin World configuration.

This should use the same Salt Basin 3D renderer.

The world may expose:

```text
ORGANIZATION BASIN
        ↓
FOUNDATION BEDROCK
        ↓
ELEMENT FIELD
        ↓
ATOM FIELD
        ↓
MOLECULE SYSTEMS
        ↓
CHANNEL RODS
        ↓
CHANNEL ROD STAFF
```

The Organization Admin should be able to travel between definition layers.

Examples:

```text
Foundation World
→ Element Index
→ Billing Element
→ Billing Frequency Atom Definition
→ Billing Terms Molecule
→ Revenue Channel Projection
→ Billing Staff Agent Boundary
```

This must feel like navigating one architecture.

Do not make every configuration type a disconnected settings page.

---

# 17. MEMBER WORLD

Create a Member World using the same spatial architecture.

The Member World may expose:

```text
MEMBER IDENTITY MOLECULE
        ↓
PERSONAL BRAND WORLD
        ↓
CAREER CHANNEL ROD
        ↓
RESUME OUTPUTS
        ↓
PERSONAL FINANCIAL CHANNELS
        ↓
MEMBER STAFF
```

A Member may move from:

```text
Career Channel
        ↓
Resume Output Molecule
        ↓
Personal Brand Scene
```

or:

```text
Cash Liquidity Channel
        ↓
Unsecured Debt Channel
        ↓
Purchase Simulation
```

The experience should remain one Member world.

Do not build Resume Builder, Personal Website Builder, and Financial Dashboard as three completely unrelated products.

They are Member modules expressed through the same Salt Basin semantic and spatial architecture.

---

# 18. ACCESS RESOLUTION

At login, resolve:

```text
CANONICAL MEMBER IDENTITY
        ↓
MEMBERSHIPS
        ↓
AUTHORITY PROFILES
        ↓
MODULE ACCESS
        ↓
VIEW ACCESS
        ↓
AGENT ACCESS
        ↓
DATA SCOPE
```

Then construct the available world.

The Member should not be required to log into a separate Admin product.

Where the Member has Organization authority, provide spatial and navigation access to the authorized Organization world.

Example:

```text
MY WORLD
SALT BASIN HOLDINGS
```

The same Member identity moves between the contexts.

Security and Agent Boundaries change with context.

---

# 19. AGENT CONTEXT SWITCHING

Agents must understand the current operating scope.

Example:

Betsy asks Personal Finance Staff:

> "How much do I owe across my unsecured debt?"

Context:

```text
MEMBER_PRIVATE
```

Betsy then enters Salt Basin Organization World and asks Channel Rod Staff:

> "How much debt does the company have?"

Context:

```text
ORGANIZATION_PRIVATE
```

Do not allow context bleed.

An Agent must know:

- interacting Member
- active organization context
- active world
- active scope
- Agent Boundary
- permitted Ports
- permitted Atoms
- current security slice

Context caches must remain scope-aware.

---

# 20. FOUNDATION UPDATE

Update the Foundation Source of Truth to record the following canonical architecture decision:

> Member Organization Admin is not a separate user-record type from Member. All interacting users are canonical Members. Member Organization Admin capability is created through Organization-scoped authority, module access, view access, Agent access, and action permissions.

Also record:

> Every Member receives baseline personal configuration capabilities for Personal Brand Website configuration, Resume Template configuration and output generation, optional Resume Output exposure to the Member's Personal Brand Website, and supported connections to external bank accounts and unsecured debt accounts.

Record this as a canonical product architecture definition.

Do not leave this only in code comments or implementation prompts.
