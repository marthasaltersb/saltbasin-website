# Salt Basin Interface Intelligence Definition Pack v1

## Recommended Definition

HandoverOS Interface Intelligence traces every revenue and customer lifecycle data transaction across systems, then uses agents to explain lineage, detect mismatches, identify hidden operational risk, and create reusable institutional memory.

## Product Thesis

Most revenue leakage and customer-friction issues are not created at the point where they become visible. They are created upstream in a field, rule, approval, transform, missing token, stale source, or handoff that no one can see later.

## Core Tokens

| Token | Lifecycle |
|---|---|
| Revenue Lifecycle Token | prospect -> pipeline -> proposal -> contract -> order -> subscription -> bill -> invoice -> collect -> recognize -> renew/expand -> adjust |
| Customer Journey Token | external lead -> qualified prospect -> negotiation -> signature -> onboarding -> active customer -> payment -> support/change -> renewal/expansion/churn |

## Core Ledger Tables

- interface_transactions
- interface_steps
- interface_field_lineage
- lineage_tokens
- token_relationships
- agent_transaction_analyses
- memory_candidates

## Core Agent Pool

- Interface Transaction Analyst
- Revenue Lifecycle Tracer
- Customer Journey Tracer
- Control Evidence Agent
- Root Cause Pattern Agent
- Benchmark and Claims Guard
- Memory Steward

## Sizing Formula

worker_count = ceiling(total_units / max_units_per_worker)

functional_lead_count = ceiling(worker_count / 5)

management_agent_count = ceiling(functional_lead_count / 3)

## Confidence Note

High confidence for the internal HandoverOS/QTR product shape because Gmail connector research, workbook attachment reads, repo memory documents, and current lineage code converge. Medium confidence for external benchmark or monetary claims until refreshed against current authoritative sources.
