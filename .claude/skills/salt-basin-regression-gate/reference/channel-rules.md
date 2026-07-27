# Channel Creation Rules and the Full Enterprise Deal Channel

## Canonical Channel creation rules

Test all three. Each is a distinct emergence pattern — don't treat them as interchangeable.

### External-source Lead

```
Member Channel Rod exists or is created
  → qualification
  → Customer Channel Rod emerges from a Member Tributary
  → Revenue Lifecycle Channel Rod emerges from a Customer Tributary
```

### Internally created account-team Lead

```
Revenue Lifecycle Channel Rod begins
  → qualification
  → Customer Channel Rod emerges from a Revenue Lifecycle Tributary
  → onboarding and provisioning
  → Member Channel Rods emerge from Customer Tributaries
```

### Direct-to-consumer Member purchase

```
Member Channel Rod
  → Revenue Lifecycle Channel Rod may emerge from a Member Tributary
  → Customer Channel Rod is not required as a separate Rod
  → paying Member must still resolve against Customer Atoms and Molecules
    where customer semantic queries require convergence
```

The third pattern is easy to get wrong: it must NOT force-create a Customer Channel Rod just because the
other two patterns have one. The absence of a separate Customer Rod is intentional — verify semantic
queries against Customer Atoms/Molecules still resolve correctly without it.

## The full enterprise deal Channel

The Channel must not stop at Opportunity Close. Validate coverage of every stage below, in order, as a
single continuous Channel — not a Channel that ends at Close plus a separate, disconnected onboarding
record.

1. Lead
2. Qualification
3. Pre-close progression
4. Legal review handoff
5. Customer negotiation handoff
6. Opportunity close
7. Company onboarding or M&A integration kickoff
8. 90–120 day onboarding/integration period
9. Quarterly planning and review loop
10. Executive goal alignment
11. Value creation initiative prioritization
12. Success measurement
13. Benchmark setting
14. Cost and resource allocation
15. Variance tracking
16. Pre-exit planning
17. Exit

Exit must support **configurable outcomes**, including at minimum IPO, complete buyout, and other
configured exit types — exit type must resolve from configuration, not a hardcoded enum with only IPO/
buyout available. If exit type is a fixed switch statement with no way to add a new configured outcome
without a code change, that's a gate failure (cross-reference `salt-basin-config-audit`).
