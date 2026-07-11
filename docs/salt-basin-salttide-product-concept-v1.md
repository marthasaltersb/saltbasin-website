# SaltTide — Intelligent Payment Routing Wallet

Version: v1
Status: Concept and technical requirements — not yet buildable in this codebase
Owner: Salt Basin Net Works

## Product One-Liner

SaltTide is a payment wallet that sits on top of a member's existing cards and, at the moment of purchase, routes the transaction to whichever underlying card gives the best return or lowest risk — rather than defaulting to whatever card the phone's OS picks.

## What This Actually Requires (read first)

This is the one part of the current platform vision that cannot be built as application code on top of `saltbasin-website`. Two hard constraints:

1. **Apple Wallet has no third-party override API.** iOS does not expose a way for an app to intercept or reassign the card a user taps to pay with. The only real-world precedent for "one card that routes to many funding sources at time of purchase" (Curve, in the UK/EU) works by issuing its **own** physical/virtual card through a licensed card program — the phone still taps *that* card; SaltTide's intelligence happens behind it, not inside Apple's wallet stack.
2. **Issuing a card means becoming, or partnering with, a regulated card program.** That requires one of: a Banking-as-a-Service / program-manager partner (e.g. Marqeta, Galileo, Stripe Issuing) sitting on top of a sponsor bank, or a direct bank partnership. This brings BSA/AML, KYC, PCI-DSS, and money-transmission obligations that sit outside a web app's engineering scope — they're legal, compliance, and capital commitments.

**Conclusion:** SaltTide is a real, buildable product, but its first milestone is a partner conversation (program manager + sponsor bank), not a sprint. Nothing below should be scheduled into engineering work until that partnership exists.

## Product Doctrine

Most "best card for this purchase" decisions already have a correct answer — the cardholder just doesn't have it in their head at checkout. Rewards categories rotate, credit utilization thresholds get crossed silently, and 0% promotional windows close without anyone tracking them. SaltTide's job is to make that decision automatically and correctly, every time, without the member having to remember which card does what this month.

## Two-Phase Architecture

### Phase 1 — Recommendation layer (buildable now, inside this platform)
A member connects their cards (via Plaid or manual entry) and SaltTide shows, before checkout, which card it *would* recommend and why — reward category match, utilization headroom, promotional-APR deadlines, points expiration. No routing happens; the member still pays with whatever physical card they choose. This is a read-only advisory feature and carries none of the card-issuing regulatory burden. It depends on the SaltBridge data-aggregation layer (see below) for account and transaction visibility.

### Phase 2 — Routing layer (requires the BaaS/card-issuing partnership above)
Once a program-manager and sponsor-bank relationship exists, SaltTide issues its own card (physical and/or virtual, tokenized into Apple/Google Wallet like any other card). At authorization time, SaltTide's routing engine — running server-side, in the card processor's real-time auth flow — decides which underlying funding source to settle against, using the same signals as Phase 1 plus real-time balance and risk state. This is the "presents a card based on best return or risk mitigation" capability from the original vision; it is only possible once SaltTide itself is a card the member taps, not a recommendation on a screen.

## Where It Fits In Salt Basin

SaltTide is a member-facing product that sits alongside HandoverOS and the member commerce/products experience (see `src/components/admin/MemberProductsPanel.jsx`) as another beta product members opt into. It is downstream of SaltBridge — SaltTide's recommendation quality is only as good as the account and transaction data SaltBridge aggregates. The two should not be built in parallel; SaltBridge's account-linking and consent architecture is the prerequisite.

## Dependencies Before Any Engineering Work

1. **SaltBridge Phase 1** (Plaid Sandbox account-linking scaffold, explicit per-source member consent, encrypted storage using the existing `server/lib/crypto.js` OAuth-token pattern) — required for Phase 1 recommendations to have any real data to recommend from.
2. **A named BaaS/program-manager partner and sponsor bank** — required before Phase 2 (routing/issuing) has any technical spec worth writing. Until this exists, Phase 2 stays a paragraph, not a backlog item.
3. **A compliance review** (GLBA-level data handling for financial account data, PCI-DSS scope if/when card data is issued) — required before any real (non-Sandbox) bank credentials are linked for any member.

## Public-Safe Positioning

Public-facing materials can describe the vision (smart, automatic best-card selection) and the Phase 1/Phase 2 structure. They should not imply SaltTide currently overrides Apple Wallet, currently issues a card, or currently routes real transactions — none of that is true yet, and saying otherwise is a claim Salt Basin cannot back up until the Phase 2 partnership is in place.
