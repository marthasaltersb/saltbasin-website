# 4. What you need to set up and decide yourself

This package gives you the method, the kit and the specs. These things it can't do for you.

## Accounts and access

- [ ] A Claude plan with Claude Code for each person who will build.
- [ ] A Git host and repository, and who may push to the main branch.
- [ ] If Claude Code runs in the cloud: the repository connected, network access allowed to your package
      registry and hosting, and secrets added in the environment settings (not in the repo).
- [ ] If you publish the board as a claude.ai artifact: who it is shared with. Artifacts are private until
      shared.

## Hosting and data

- [ ] Where the board lives: a static host or an artifact.
- [ ] Where run journals and the bug ledger are kept, and how they are backed up. The ledger is what keeps
      bugs on the board permanently.
- [ ] How often `sync.mjs` runs: on every event, every few minutes, or on demand.
- [ ] For the full platform: a Postgres database, a session secret, an encryption key for stored tokens
      (64 hex characters), and an email provider for notifications.

## Connecting your project system

- [ ] Answers to the seven mapping questions, written down and agreed by the people who own the process.
- [ ] How events reach the tracker: CI calling `log.mjs`, or an adapter reading your tool.
      **No Jira, Azure DevOps or Linear connector is included.** Budget time to build or buy one.
- [ ] Read-only or read-and-write access to each outside system. Start read-only. Turn on write-back only
      with an approval step.
- [ ] A service account for each connection, not a person's own login, so access survives staff changes.

## Privacy, security and legal

- [ ] **Account deletion vs audit history.** Decide whether a deleted account's history is anonymized or
      fully erased. Privacy laws (e.g. GDPR) may require erasure on request. Get advice before you promise
      either.
- [ ] Data retention: how long seeds that were set aside, old versions and logs are kept.
- [ ] What may appear on a shared board. Keep personal and customer data out of titles and summaries.
- [ ] Who may approve features, write-backs and agent actions (role → permission defaults).
- [ ] Agent limits: what each agent may do on its own. Agents are **not sandboxed** by this design. Treat
      every agent action as a proposal until your platform enforces boundaries.
- [ ] If your repository is public: fictional data only, everywhere.

## Cost and capacity

- [ ] Agent runs cost tokens. The board shows tokens per agent and per run; decide a budget and who
      watches it.
- [ ] Parallel validation needs machine capacity (one browser and database per validator). Small
      machines simply run the loop more slowly.
- [ ] Session limits: long loops can stop at a usage limit. The kit records stopped agents as failed and
      a resumed run picks up where it stopped, but someone has to resume it.

## Decisions to make before building the designed parts

These are the open owner questions from the specs. Answer them for your organization before asking
Claude to build:

1. Is a foundation per person, per organization, or both? Can members only add to an org foundation?
2. Must a new account finish its foundation first, or is it just the first card?
3. Which outside system do you connect first?
4. Can work done for an organization be copied into a person's career foundation, and who approves?
5. Should write-backs always need approval, or may some fields update automatically?
6. Does an organization with several databases have one foundation per database, or one combined?
7. Where does a new seed land when someone has several foundations?
8. What may agents do beyond planting? Is there a weekly limit per agent?
9. Do set-aside seeds stay visible forever? (Recommended, for the audit trail.)
10. Are duplicates merged automatically, or suggested for a person to confirm? (Recommended: suggested.)
11. What is the default rule for approving a feature?
12. When is a seed "solved": when any linked feature passes, or when every linked feature has?
13. Does work not linked to a seed block a feature from passing, or only warn?
14. Who may tag a seed to another feature?
