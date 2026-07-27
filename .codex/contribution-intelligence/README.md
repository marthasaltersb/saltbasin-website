# Contribution Intelligence post-build instrumentation

`npm run build` automatically invokes `npm run postbuild`, which runs
`scripts/run-codex-contribution-intelligence.mjs`.

The adapter discovers all available Codex sandbox logs, retains only evidence
associated with this repository, deduplicates events using deterministic SHA-256
identifiers, and writes a checkpoint plus canonical observable events here.
On build hosts without local Codex telemetry it exits successfully without
creating fabricated data.

Run it independently with `npm run contribution:codex`.

The governing build specification is saved as `MASTER_BUILD_PROMPT.md` in this
directory. The telemetry adapter implements its Codex self-instrumentation
requirement; the broader specification remains the implementation roadmap for
the Contribution Intelligence product vertical slice.
