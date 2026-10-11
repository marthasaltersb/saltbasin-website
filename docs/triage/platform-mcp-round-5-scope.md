# platform-mcp round 5 scope review

Integration head: a798728. No code changed. docs/triage/scope-review.json has no platform-mcp-F4-* entries, so each item was decided here. The MCP server, registry, parity map and Connected Agents screen first appear with this feature (first merge 20b2769 / b77049b), so a base build has nothing to reproduce; git history is the evidence.

| id | scope | owner |
|---|---|---|
| platform-mcp-F4-2 | this_feature | platform-mcp |
| platform-mcp-F4-3 | this_feature | platform-mcp |
| platform-mcp-F4-4 | this_feature | platform-mcp |
| platform-mcp-F4-5 | process_note | - |

- F4-2: amendment A7 (approved, baseline v5) pinned 18 scopes, 126 tools for the career token, 121 of 121 capabilities, recounted at cdf9504. At head `node scripts/check-interface-parity.mjs --strict` prints 128 of 128 (297 governed routes, 233 tools = manifest) and MCP_SCOPES has 21 keys. The registry, scope list and parity map are this feature's own append-only artifacts, and its spec pins their literals, so the pinned counts go stale each time they grow. Needs another amendment (J1.4, J2.1, J6.2, J11.2) recounted at the commit the round tests, written by the amendment reviewer, not the fixer. A7's reviewer note already warned of this; the owner may prefer asserting the scope boundary plus a count over full ordered lists.
- F4-3: docs/changes/platform-mcp.md still says 141 tools and 87 of 87 capabilities (overview and Known limitations) and docs/changes/live-release-tracker.md "Known limitations" still says the registry does not exist and registration is an MCP_GAP. Round 4's T1 registered the tracker tools, so both texts are stale. The platform-mcp change spec is this feature's; the live-release-tracker line is a limitation that this feature's T1 closed, so platform-mcp's fixer updates it (it is the change spec, not a frozen training spec). Editable by the fixer.
- F4-4: src/components/admin/ConnectedAgentsPanel.jsx (new with this feature). Reading the code at head: the inline `error` state is replaced on each action (`setError('')` then `setError(msg)`), but `fail()` also fires `toast.error(msg)`, and src/lib/toast.js renders each error as its own `role="alert"` element for 6 s, so repeated failed clicks stack alerts next to the inline one (round 4 saw three). Product behaviour owned by this panel, so this_feature; the fix is to show one failure at a time (replace the previous toast / do not duplicate the inline alert). I did not reproduce in a browser on a base build because the screen does not exist there.
- F4-5: Capabilities "Gaps only" no-gaps message was not walked in the browser after the T1 fix. That is a validation coverage matter (the next validator round walks J10.4 at 1280 and 390 px), not a product or spec defect. Code-wise the parity run at head has 0 gaps, so the message should appear. process_note, no files.
