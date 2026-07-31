# SALT BASIN — TEMPORAL STANDARD
## ART-15 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-000, SRC-001, SRC-003, SRC-007

---

## Purpose

Time is the dimension along which all Salt Basin events, states, recognitions, and obligations are governed. This standard defines how time is represented, stored, versioned, and resolved across every object in the system. Temporal ambiguity is one of the most common sources of revenue recognition errors and QoE exceptions — this standard eliminates it by defining exactly one way to handle time for each context.

---

## 1. Time Zone Standard

**All timestamps in the Salt Basin system are stored in UTC.**

Display conversions (to local time zone for user-facing UI) are performed at the presentation layer only — the stored value is always UTC.

```
Canonical timestamp format: ISO 8601 with UTC offset
Example: 2025-09-01T00:00:00Z

Period boundaries (dates without time): ISO 8601 date
Example: 2025-09-01

Never store:
  - Local time without timezone
  - Ambiguous date formats (9/1/25, 1-Sep-25, etc.)
  - Timestamps in a user's local timezone as the primary stored value
```

---

## 2. Timestamp Types

Every event, record, and state change in the Salt Basin system uses one of the following timestamp types. Using the wrong type is a common source of period-end errors.

| Type | Label | Description | Example Field Name |
|---|---|---|---|
| **Event Time** | `event_at` | When the business event actually occurred in the real world | `contract_executed_at`, `payment_received_at`, `visit_occurred_at` |
| **System Time** | `created_at` | When the record was written to the Salt Basin system | `created_at` (always present on every record) |
| **Effective Date** | `effective_date` | The date a contract, price, or policy becomes operative | `contract_effective_date`, `price_effective_date` |
| **Recognition Date** | `recognized_at` | The date/period in which revenue is recognized per ASC 606 | `recognition_period_start`, `recognition_period_end` |
| **Period Boundary** | `period_start` / `period_end` | The boundaries of a reporting, billing, or recognition period | `billing_period_start`, `recognition_period_end` |
| **Valid-From / Valid-To** | `valid_from` / `valid_to` | Temporal versioning range for a record — when this version of the record is authoritative | `valid_from`, `valid_to` (null = current version) |
| **Capture Time** | `captured_at` | When an atom value was captured from its source system | `captured_at` on every atom record |
| **Ingestion Time** | `ingested_at` | When the connector pulled data from the source system | `ingested_at` on every rail connector record |

### Required Timestamps on Every Record

Every table in the Salt Basin system must carry at minimum:
- `created_at` (System Time — auto-set; never null)
- `event_at` or `effective_date` (whichever is semantically appropriate for the record type)
- `valid_from` / `valid_to` (for all versioned records)

---

## 3. Temporal Versioning

The Salt Basin data model uses **insert-only temporal versioning**. No record is overwritten. When a fact changes, the old record is closed (valid_to set) and a new record is opened (valid_from set).

### Bi-Temporal Pattern

Salt Basin uses a bi-temporal model where applicable:

```
Transaction Time:  When the system knew the fact (created_at, ingested_at)
Valid Time:        When the fact was true in the real world (event_at, effective_date, valid_from/valid_to)
```

Example: A contract modification is received on 2025-11-01 (transaction time) but effective as of 2025-10-01 (valid time). The system must record both — the modification was known on November 1st but its effects apply retroactively to October 1st.

### Versioning Implementation Pattern

```sql
-- Example: Pricing record with temporal versioning
CREATE TABLE pricing_atoms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atom_id         TEXT NOT NULL,          -- ATM-PRICE-{N}
  contract_id     TEXT NOT NULL,
  value           NUMERIC(18,4),
  valid_from      DATE NOT NULL,          -- when this version became true
  valid_to        DATE,                   -- null = currently active version
  created_at      TIMESTAMPTZ DEFAULT now(),
  ingested_at     TIMESTAMPTZ,            -- when connector pulled this
  event_at        DATE,                   -- when the real-world change occurred
  source_system   TEXT NOT NULL,
  source_record_id TEXT NOT NULL
);

-- Current version query:
SELECT * FROM pricing_atoms WHERE atom_id = 'ATM-PRICE-001' AND valid_to IS NULL;

-- Point-in-time query (what was the price on 2025-10-15?):
SELECT * FROM pricing_atoms 
WHERE atom_id = 'ATM-PRICE-001' 
AND valid_from <= '2025-10-15' 
AND (valid_to IS NULL OR valid_to > '2025-10-15');
```

### Immutable Records

The following record types are **insert-only with no valid_to closure** — they are point-in-time facts that are never superseded:

- Rod Events (EVT-*) — event_at is fixed; the event happened; it cannot be revised
- Contract Registry originating records (version 1) — the executed contract as signed
- Payment records — a payment received is a permanent fact
- Revenue recognition events — once recognized, the period is closed

For these records, corrections create **amendment records** that reference the original — they do not modify the original.

---

## 4. Period Boundary Rules

### Billing Period

A billing period is defined by the contract terms (ATM-CONT-007 Term Start, ATM-CONT-002 Billing Frequency).

```
Billing period start: inclusive
Billing period end:   inclusive

Example (monthly):
  Period: 2025-09-01 through 2025-09-30
  Invoice due: per ATM-CONT-006 billing terms
  
Rule: Invoice generation is triggered by period_end + 1 day (first day of next period),
      not by the last day of the current period.
```

### Recognition Period

A recognition period is the unit over which ASC 606 revenue is recognized. For ratable recognition:

```
Monthly recognition:
  period_start: first day of month
  period_end:   last day of month
  recognized_amount: contract ACV / 12 (for annual contracts)
  
Recognition must not cross the contract effective date boundary.
Revenue earned before effective_date is not recognizable.
Revenue earned after term_end is not recognizable without contract modification.
```

### Period Alignment Rules

1. **Billing periods and recognition periods must align.** A contract billed quarterly but recognized monthly requires monthly revenue registry records and quarterly billing registry records.
2. **Period boundaries must not be ambiguous.** "End of September" is not a valid period boundary — "2025-09-30" is.
3. **Stub periods must be explicitly calculated.** If a contract starts mid-month (e.g., September 15), the first recognition period is a stub period (Sep 15 – Sep 30), not a full month.
4. **Year-end cutoffs are hard boundaries.** Revenue earned in Q4 2025 may not be recognized in Q1 2026 and vice versa — regardless of invoicing timing.

---

## 5. Effective Dating

Effective dates govern when a fact becomes operative — independent of when it is known or recorded.

### Contract Effective Date

The contract effective date (ATM-CONT-006) is the date service delivery begins and the recognition clock starts. This is NOT:
- The contract execution date (date of signature)
- The invoice date
- The payment date

```
Temporal sequence for a typical contract:
  Negotiation completed: 2025-08-10
  Contract signed:       2025-08-15   ← ATM-CONT-004 Executed Date
  Effective date:        2025-09-01   ← ATM-CONT-006 Term Start / Effective Date
  First invoice:         2025-10-01   ← per billing terms (1 month in arrears)
  First recognition:     Sep 2025     ← period Sep 1–Sep 30
```

### Price Effective Date

When pricing changes (amendment, renewal, expansion), the new price has an effective date. Revenue for periods before the effective date uses the old price; revenue for periods on or after uses the new price.

```
Old price:  $25,000/month, effective 2025-09-01, valid_to 2025-11-30
New price:  $28,000/month, effective 2025-12-01, valid_to null (current)

Revenue for Oct 2025: $25,000
Revenue for Dec 2025: $28,000
No blending across the effective date boundary.
```

---

## 6. Contract Modification Temporal Rules

Contract modifications are one of the most complex temporal scenarios in ASC 606. Salt Basin must handle them explicitly.

### Types of Contract Modifications

| ASC 606 Modification Type | Description | Temporal Effect |
|---|---|---|
| Prospective | Modification treated as a new contract going forward | Old recognition schedule closes at modification date; new schedule starts |
| Cumulative Catch-Up | Modification treated as if it were in the original contract — catches up all periods | Cumulative adjustment recognized in the period of modification; prior periods restated |
| Combined | Partially prospective, partially catch-up | Split calculation — complex; requires CPA review |

### Modification Record Requirements

Every contract modification must produce:
1. A new contract version record (ATM-CONT-002 incremented)
2. ATM-CONT-013 (Non-Standard Term Flag) assessed for new terms
3. ATM-REV-010 (Modification Flag) = TRUE on the affected revenue atoms
4. ATM-REV-011 (Modification Type) set to Prospective / Cumulative Catch-Up / Combined
5. New revenue recognition records for the modified period
6. The originating contract record untouched (immutable)

---

## 7. Temporal Conflict Resolution

When two sources provide conflicting timestamps for the same event, the following resolution order applies:

1. **T0 document timestamp** — the timestamp embedded in the signed contract or payment receipt is authoritative
2. **T1 system event timestamp** — the event_at recorded in the system of record (Salesforce, Zuora, etc.)
3. **T1 system ingestion timestamp** — when the connector pulled the record (less authoritative — may lag the real event)
4. **T2 corroborating timestamp** — spreadsheets, email records, meeting notes
5. **Manual entry** — human-entered timestamp with approval record

When conflict cannot be resolved by hierarchy, a Source Conflict Record (SCR) is created and the affected records are held in provisional state until resolved.

---

## 8. Staleness Rules

All cached and derived data must carry a staleness definition.

| Data Type | Freshness Window | Staleness Action |
|---|---|---|
| Real-time pipeline data | 1 hour | Alert; re-pull |
| Daily billing/ERP data | 24 hours | Alert; re-pull |
| Recognition schedules | Per close cycle (monthly/quarterly) | Flag as unconfirmed after close cycle |
| External credit data (Experian/FICO) | 30 days | Require re-pull before use in scoring |
| External market data (T4) | 90 days | Require re-pull or flag as potentially stale |
| Benchmark claims (ART-17) | Per decay_rule (12–24 months) | Degrade confidence tier; re-verify |
| Agent output cache | 24 hours | Re-generate; do not serve stale agent output as current |

---

## 9. Temporal Governance Rules

1. **All timestamps are UTC.** No exceptions. Display conversions happen at the presentation layer.
2. **Event time and system time are always distinct.** A payment received on Dec 31 but recorded on Jan 2 must carry event_at = Dec 31, created_at = Jan 2. The period attribution follows event_at.
3. **No timestamp gaps.** A record with a valid_from but no corresponding event_at (or effective_date) is incomplete.
4. **Period boundaries are inclusive.** The end of a period is the last day of that period — 2025-09-30, not "end of September" or "prior to October 1."
5. **Stub periods must be explicit.** A contract starting mid-period must produce an explicit stub period record — not a full-period record with a mental note.
6. **Immutable records are never updated.** Rod events, originating contract records, and payment records carry fixed timestamps. Corrections are amendments, not overwrites.
7. **Modification effective dates govern revenue attribution.** Revenue does not bleed across modification effective dates.
8. **Stale data must be flagged, not served as current.** An agent or UI surfacing data beyond its freshness window must label it as potentially stale.
9. **Bi-temporal queries are required for historical accuracy.** Any report covering a historical period must use point-in-time queries — not the current snapshot of the data.
10. **Year-end is a hard boundary.** No revenue crosses fiscal year boundaries without explicit cutoff accounting.
