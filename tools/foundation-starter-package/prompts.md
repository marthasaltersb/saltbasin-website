# Prompts for your own Claude Code

Paste these into Claude Code in your repository, after the files from step 1 of the setup guide are in
place. Replace the bracketed parts.

**1. Orientation**
> Read CLAUDE.md, tools/release-tracker-kit/README.md and tools/release-tracker-kit/MAPPING.md. Then tell
> me in five sentences what the tracker counts, what I still need to decide, and what you would check
> first in this repo.

**2. Prove the kit**
> Run the release tracker kit's fixture check (make-fixture, sync, verify-snapshot) and serve the board
> locally. Tell me what each of the four example features shows and why.

**3. Check my seven answers**
> Here are my answers to the seven mapping questions: [paste]. Check each against MAPPING.md. For any
> answer that is missing, vague or would cause wrong statuses on the board, tell me exactly what to
> decide. Don't fill in answers for me.

**4. Write an adapter**
> Our system is [Jira / Azure DevOps / Linear / GitHub / spreadsheet]. Using my seven answers in
> docs/foundation.md, write a small adapter that turns [an export file / webhook payloads] into the
> tracker's journal and step events. Test it on a fictional example and show me the resulting board state.

**5. Publish the board**
> Publish tools/release-tracker-kit/index.html as [a page on our static host / a claude.ai artifact with
> the shared database]. After each sync, write snapshot.json [next to it / to collection tracker, doc
> current, field json]. Tell me who can see it.

**6. Before building a designed part**
> I want to build [foundations / seeds / features-from-seeds / scenes] from the specs in specs/. First
> run the reuse-first-audit and config-audit skills against the spec and this repo. List anything that
> would need a new table and why, every open owner question I must answer first, and the smallest first
> slice you recommend. Don't write code yet.

**7. Build a slice through the release loop**
> Build [slice] following the release-loop skill: change spec with Traces to, training spec, initial
> check, browser validation that follows the training spec literally, triage and fix until every journey
> passes. Keep the board updated. Push only when the release log shows everything passed.

**8. End of session**
> Summarise what changed this session, which decisions were made and by whom, what is still open, and
> what the next session should start with. Add any new rule to CLAUDE.md.
