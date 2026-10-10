# Release-loop agent prompts

One directory per role: `agent.json` (name, version, the governed object the agent's result becomes) and `prompt.md` (the prompt).

The Salt Basin agent worker (`scripts/agent-worker.mjs`) reads these files for every run and records the `version` it used. Prompting an agent in the platform (World Shell > Journeys > Agent runner) therefore always uses the file in the repository. The Claude Code workflow (`.claude/workflows/release-loop.js`) still carries its own copy of the stage prompts until the cut-over described in `docs/changes/platform-agent-runner.md`; at cut-over it reads these files too.

Changing a prompt is a reviewed change to these files (bump `version`), like a spec amendment: the Agent runner screen shows each prompt's version read-only, and every run records the version it used.

Public repository: prompts use fictional data only.
