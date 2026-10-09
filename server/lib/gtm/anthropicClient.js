// Server-side Anthropic client for the GTM Deliverable Agent. Same
// instantiation/null-check pattern as server/routes/bestyStaff.js -- reuses
// the platform's already-provisioned ANTHROPIC_API_KEY, never a personal key.
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Sonnet does the research + drafting (deep reasoning, citation judgment) --
// matches DRAFT_MODEL in the Python agent's lib/anthropic_client.py.
export const DRAFT_MODEL = 'claude-sonnet-5';

// The installed @anthropic-ai/sdk's TypeScript types don't yet know about
// output_config/json_schema or this tool -- confirmed at implementation time
// that the SDK's runtime just forwards the request body as-is (messages.js /
// batches.js call this._client.post(url, { body, ...options }) with no field
// whitelisting), so passing these extra fields through the typed client is
// safe in this plain-JS (no TypeScript) project.
export const WEB_SEARCH_TOOL = { type: 'web_search_20260209', name: 'web_search' };

export function requireAnthropicClient() {
  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  }
  return anthropic;
}
