# SALT BASIN — AGENT ARCHITECTURE & AGENT-CENTRIC SECURITY STANDARD
## ART-13 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-001, SRC-003

---

## Purpose

This standard governs the design, permissions, behavior, and security boundaries of all agents operating within the Salt Basin platform. Security is **agent-centric as well as user-aware** — agents are not passive tools; they are bounded actors with their own permission set, scope definition, and behavior constraints.

---

## 1. Core Principles

### Agent-Centric Security

Every agent in the Salt Basin ecosystem has its own bounded security policy independent of the user invoking it. A user with broad permissions cannot cause an agent with narrow permissions to exceed its bounded scope.

**Six bounding dimensions — every agent must have all six defined:**

| Dimension | Description | Required |
|---|---|---|
| Source Access | Which data sources and channels the agent may read | Yes |
| Transformation Permissions | What the agent may compute, derive, or reformat | Yes |
| Retention Rules | How long the agent may hold data; what it must discard | Yes |
| Exposure Rules | What data the agent may surface to a user, another agent, or an external system | Yes |
| Action Permissions | What the agent may execute (suggest / stage / commit / publish) | Yes |
| User Identity Gate | Whether user identity is checked before action is permitted | Yes |

### User Identity and Permission Model

User identity determines what an agent may expose, query, propose, stage, or commit. The intersection of user permission and agent permission determines the effective permission for any given action.

```
Effective Permission = MIN(User Permission, Agent Permission)

Example:
  User = Revenue Manager (Read + Stage/Commit)
  Agent = BestyStaff Customer (Read + Suggest)
  Effective = Read + Suggest (agent is the binding constraint)
```

---

## 2. Canonical Agent Register

### Current Agents (from SRC-003)

| Agent ID | Agent Name | Scope | Parent | Read | Write | Status |
|---|---|---|---|---|---|---|
| AGT-001 | BestyStaff Revenue | Revenue Rod | Enterprise | Y | Stage/Commit | Live |
| AGT-002 | BestyStaff Customer | Customer Rod | Revenue | Y | Suggest | Live |

### HOS™ AI Bots (from SRC-001 — design only, not yet built)

| Agent ID | Agent Name | Scope | Function | Status |
|---|---|---|---|---|
| AGT-003 | Deal Readiness Bot | Pre-acquisition diligence | Scores portco readiness for HOS™ integration; flags data gaps | Architecture |
| AGT-004 | Diligence Bot | QoE preparation | Extracts and validates revenue recognition data for QoE packages | Architecture |
| AGT-005 | Portfolio Health Bot | Hold-period monitoring | Continuous ARR/EBITDA tracking; alerts on covenant breaches or metric drift | Architecture |

### BestyStaff (Personal Agent — from SRC-001)

| Attribute | Specification |
|---|---|
| Agent ID | AGT-BES-001 |
| Name | BestyStaff (name fixed — never alter) |
| Category | Personal AI proxy agent |
| Status | Live — saltbasin.net |
| Response behavior | 9-second deliberate delay with progress bar |
| Intake pattern | Full intake form with decision/question tracker |
| Loop-back logic | Loop-back architecture — incomplete sessions held in state |
| Memory | Persistent user-name memory; recognizes returning users |
| Licensure | Never claims licensure |
| Data retention | Always asks permission before retaining information |
| Professional framing | "Agentic proxy system with intake sequencing, delayed-response logic, loop-back architecture, and persistent state management" |

---

## 3. Permission Levels

### Action Permission Taxonomy

| Level | Label | Description |
|---|---|---|
| L0 | None | Agent has no permission in this domain |
| L1 | Read | Agent may read and present data — no modification |
| L2 | Suggest | Agent may propose an action or value — human must confirm |
| L3 | Stage | Agent may prepare an action for execution — requires human sign-off before commit |
| L4 | Commit | Agent may execute the action autonomously within its bounded scope |
| L5 | Publish | Agent may make data or output externally visible (report, invoice, disclosure) |

### Security Policy Register (from SRC-003)

| Policy Name | Read | Stage | Commit | Suggest | Notes |
|---|---|---|---|---|---|
| Revenue Manager | Y | Y | Y | — | Full action authority on Revenue Rod within scope |
| Analyst | Y | — | — | Y | Read and suggest only — no staging or committing |

---

## 4. Agent Design Standards

### Required Agent Attributes

Every agent definition must specify:

```
Agent:
  id:               AGT-{SCOPE_CODE}-{SEQUENCE}
  name:             [Human-readable name]
  scope:            [Rod / Channel / Domain / Enterprise]
  parent:           [Parent agent or "Enterprise" if root]
  source_access:    [List of Layer 0-2 sources permitted]
  read:             [Y/N]
  write_level:      [None / Suggest / Stage / Commit / Publish]
  retention_rule:   [Duration and discard policy]
  exposure_rule:    [What can be surfaced, to whom, under what conditions]
  user_identity_gate: [Y/N — must user identity be verified before action]
  never:            [Explicit prohibited actions — hardcoded constraints]
  status:           [Live / Architecture / Design]
```

### Hardcoded Agent Constraints (apply to ALL agents)

1. Agents never claim professional licensure (legal, medical, financial, accounting)
2. Agents always ask permission before retaining personally identifiable information
3. Agents surface only data within their bounded source access — never cross-scope reads
4. Agents never execute a financial transaction (payment, transfer, trade) autonomously
5. Agents preserve lineage — every output must traceable to a source event and generation rule
6. Agents never repurpose a Scenario_ID or other permanent identifier
7. Agents in "Suggest" mode must not stage or commit without explicit user escalation

### BestyStaff-Specific Design Constraints

The deliberate 9-second response delay is **not a bug** and must never be optimized away. Design rationale (from SRC-001): Betsy thinks in sequences and doesn't like moving too fast. A too-quick response can limit how much a person shares — the delay is a UX feature that encourages completeness.

---

## 5. Agent-to-Rod Mapping

Every agent is bounded to one or more Journey Rods. An agent may not access data outside its bound rod(s) without an explicit permission escalation approved by the user identity gate.

| Agent | Bound Rod(s) | Channel(s) |
|---|---|---|
| BestyStaff Revenue (AGT-001) | Revenue Lifecycle Rod | CH-REV |
| BestyStaff Customer (AGT-002) | Customer Journey Rod | CH-CUST |
| Deal Readiness Bot (AGT-003) | Revenue + Customer Rods | CH-REV, CH-CUST |
| Diligence Bot (AGT-004) | Revenue + Financial Rods | CH-REV, CH-FIN |
| Portfolio Health Bot (AGT-005) | All rods (monitoring mode) | CH-REV, CH-CUST, CH-MEM, CH-FIN |

---

## 6. Security Governance Rules

1. **No agent inherits user permissions automatically.** Agent permission is defined at agent registration and must be explicitly granted.
2. **The effective permission is always the minimum of user permission and agent permission.**
3. **Every agent action that modifies state (Stage, Commit, Publish) must create an audit record** containing: agent ID / user ID / action taken / timestamp / source event / data affected.
4. **Agents that access personally identifiable information** must comply with CFPB Circular 2024-07, FCRA, and applicable state consumer protection standards.
5. **Agent scope creep** (an agent accessing data outside its registered source access) is a security violation — must be flagged and logged.
6. **Agent lineage** must be preserved: who invoked the agent, with what inputs, at what time, producing what output.
7. **No agent may claim authority to make an irreversible financial or legal commitment** on behalf of Salt Basin Holdings or any subsidiary without explicit human sign-off.

---

## 7. Agent Security in Context of PE Diligence (HOS™)

In PE diligence contexts, additional constraints apply:

| Context | Additional Constraint |
|---|---|
| Pre-acquisition | Agents may only read data the portco has explicitly shared in the data room — no inference from third-party sources without disclosure |
| QoE preparation | Agent outputs labeled as "preliminary" until human CPA/auditor sign-off |
| Hold-period monitoring | Agent alerts must cite the specific metric, source, and period — no vague flags |
| Pre-exit | Agents producing sell-side QoE packages must flag every assumption and every data gap explicitly |

Capital/financing partner pipelines must remain **distinct** from investment-banking/CIM/exit-partner pipelines. Agents handling one pipeline must not commingle data with the other.
