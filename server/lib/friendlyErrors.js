// Owner error rule (2026-10-10), server side: first sentence plain (what went wrong, what to do),
// technical detail on its own line. Used for messages the UI and MCP tools show verbatim.
export function jsonProblemMessage(what, err) {
  const head = `The ${what} could not be read because part of its text is mistyped or missing. Check for a missing comma, quote or bracket, fix it, then try again.`;
  const raw = String((err && err.message) || err || '').trim();
  return raw ? `${head}\nTechnical detail: ${raw}` : head;
}
