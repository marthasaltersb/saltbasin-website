// Reads the cached brand/methodology system prompt block directly off disk
// from the original Python agent's source-of-truth file -- single source of
// truth, per the plan: this file is never duplicated into the DB or copied
// into server/.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTEXT_PATH = path.resolve(
  __dirname,
  '../../../agents/gtm-deliverable-agent/context/salt_basin_context.md'
);

export function loadContextText() {
  return readFileSync(CONTEXT_PATH, 'utf8');
}

// Cached brand/methodology block first; an optional per-run addition must
// come after the cache_control breakpoint or it changes the prefix and
// invalidates the cache for every other run -- same rule as the Python
// build_cached_system().
export function buildCachedSystem(extraText) {
  const blocks = [
    {
      type: 'text',
      text: loadContextText(),
      cache_control: { type: 'ephemeral' },
    },
  ];
  if (extraText) {
    blocks.push({ type: 'text', text: extraText });
  }
  return blocks;
}
