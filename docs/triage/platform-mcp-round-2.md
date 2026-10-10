# Triage: platform-mcp, round 2

Baseline v3. Code under test: integration head f76786c. Reproduced by reading the code and running `node scripts/check-interface-parity.mjs` and loading `MCP_TOOLS` directly (no server needed). Nothing was changed.

Counts at this head: 72 of 72 capabilities, 110 registered tools, 96 tools visible to a token with career.read + career.write + outputs.approve, 6 scopes.

Prior decisions: amendment A3 (J10.4) approved into v3. Amendment A4 (J2.1, J11.2, E.5) was REJECTED in round 1 for stale numbers, weaker J2.1 wording and non-determinism, with the note "direction is right, re-propose with values recounted at the integration head". That is a rejection of the wording, not of the direction, so J2.1 and J11.2 are re-proposed below with recounted values and no weaker assertions (spec_error, with the A4 note as the reviewer's own instruction).

| id | step | class |
|---|---|---|
| platform-mcp-r2-T1 | J1.4 | spec_error |
| platform-mcp-r2-T2 | J2.1 | spec_error (re-proposal of A4) |
| platform-mcp-r2-T3 | J10.4 | defect |
| platform-mcp-r2-T4 | J11.1 | spec_error |
| platform-mcp-r2-T5 | J11.2 | spec_error (re-proposal of A4) |

## T1 J1.4: six scope checkboxes
Root cause: `MCP_SCOPES` in `server/lib/mcpToolRegistry.js` (lines ~23-24) gained `release.loop.read` and `release.loop.write` when the in-app release loop shipped its MCP tools (commit 8ff2cb3, "Release loop fix round 1"). CLAUDE.md requires a new capability to ship with its tool in the same change, and the registry is append-only, so the scopes are correct. The Connected Agents panel renders one checkbox per scope. The platform-mcp change spec predates them (it lists four). Product matches owner direction; the step count is stale. No code change.

## T2 J2.1: tool list
Root cause: the registry grew from 10 to 110 tools (A3's gap closure plus output versions, release loop, cover letter, etc.). `tools/list` returns every tool whose scope the token carries, as designed. Step pinned the 10-tool state. Re-proposed with every name in registry order and `96 tools`, which is not weaker than the original (A4's reviewer requirement).

## T3 J10.4: Gaps only shows nothing
Root cause: `src/components/admin/CapabilitiesPanel.jsx` (~lines 58, 80-84). With Gaps only selected and no gaps, `rows` is empty, so `groups` is empty and nothing renders. There is no empty-state branch. The change spec says gaps are highlighted and J10.4 requires the "no gaps" message. A blank result with no context is also an unsurfaced-state bug under the "nothing fails silently" rule. Fix: after the group map add `{data && !error && gapsOnly && rows.length === 0 && <div className="sub" role="status">No gaps: every capability works on the website, in the API and as an MCP tool.</div>}`. Verify at 1280x900 and 390x844. Spec unchanged; this is class defect because the step as written is correct.

## T4 J11.1: Gaps list
Root cause: `scripts/check-interface-parity.mjs` lines 142-145 print `Gaps:` only `if (gaps.length)`. With 0 gaps there is nothing to list; printing an empty heading would be noise. Product correct, step written when 28 gaps existed.

## T5 J11.2: --strict exit
Root cause: line 148 `failed = problems.length > 0 || (strict && gaps.length > 0)`. With zero gaps `--strict` exits 0 and prints `OK: the registry matches the code.` This follows change spec "Known limitations" and triage B5 (close every gap, strict exits 0), and J10.4 in the same baseline requires the import capability to be ready, which contradicts the old J11.2 line. Re-proposed with the reviewer's wording.

## Validator observations
- Harness mistake (create-test-member against shared database `sb` created gated@test.local and re-readied betsy@test.local): not a product issue. Not fixed by code; the owner may want those two rows reviewed in database `sb`. Recorded here, not hidden.
- Phone: cover-letter card appears ~3.4 s after Track below the placeholder editor card; alert plus toast on a failed token create overlap. Both are by design in the change spec (errors show in a role=alert and a toast). Nothing to do.
- Spec header says Version 1 while baseline is v3: documentation only, owned by the amendment reviewer. Nothing.
- No new coverage_gap steps recommended: J11.3 already proves the check can fail, and the empty-state defect (T3) is already covered by J10.4.
