// Hiring manager research agent (2026-08-09) — real execution for the
// already-seeded 'contact_relationship_analyst' agent role ("Finds
// accountable functions, public leaders, recruiters and warm routes;
// maintains confidence labels" — server/db.js's AGENT_ROSTER). Same
// web-search-backed pattern as careerResearchAgent.js. Creates real
// persons records via the existing findOrCreatePerson/linkRodToPerson path
// (built in Phase 1, never executed by a real agent until now) — never
// invents an identity, matching that agent's own stated boundary
// ("Invent identities, emails, phone numbers or relationships") verbatim.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';
import { findOrCreatePerson } from './opportunityPipelineRegistry.js';
import { linkRodToPerson } from './tributaryRegistry.js';
import { db } from '../db.js';

const MODEL = 'claude-opus-4-8';
const AGENT_KEY = 'contact_relationship_analyst';

const CONTACT_TOOL = {
  name: 'propose_hiring_contacts',
  description: 'Propose real people found via web search who are plausible hiring-decision contacts (hiring manager, recruiter, accountable function leader) for this specific role/company.',
  input_schema: {
    type: 'object',
    properties: {
      contacts: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            publicRole: { type: 'string' },
            confidenceLabel: { type: 'string', enum: ['unverified_lead', 'probable', 'confirmed'] },
            sourceReference: { type: 'string', description: 'The real URL or source where this person/role was found — never a fabricated or guessed source.' },
          },
          required: ['fullName', 'publicRole', 'confidenceLabel', 'sourceReference'],
          additionalProperties: false,
        },
      },
    },
    required: ['contacts'],
    additionalProperties: false,
  },
};

/**
 * Searches for real, publicly-findable hiring-decision contacts for a
 * specific tracked opportunity, and links each one found as a real Person
 * record (confidence-labeled, source-cited). Returns the created/found
 * persons. Throws (never fabricates) if the daily run cap is hit, no key is
 * configured, or the opportunity doesn't exist.
 */
export async function researchHiringManagers(userId, opportunityRodId) {
  await checkAndRecordRunAllowance(userId, AGENT_KEY, 'hiring_manager_research');

  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured — set one in your member config or platform env to research hiring contacts.');

  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(opportunityRodId);
  if (!rod) throw new Error('Career opportunity not found.');
  const metadata = typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : (rod.metadata || {});

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1536,
    tools: [
      { type: 'web_search_20250305', name: 'web_search', max_uses: 4 },
      CONTACT_TOOL,
    ],
    system: 'You research real, publicly-findable people who are plausible hiring-decision contacts for a specific job posting — the hiring manager, a recruiter, or the accountable function leader. Search the live web. Never invent a name, title, email, or phone number — every contact must cite a real source you found via search. If you find nobody with real evidence, call the tool with an empty contacts array rather than guessing.',
    messages: [{
      role: 'user',
      content: `Job title: ${metadata.jobTitle || '(unknown)'}\nCompany: ${metadata.companyName || '(see posting)'}\nPosting URL: ${metadata.url || '(none on file)'}\n\nFind real, plausible hiring-decision contacts, then call propose_hiring_contacts.`,
    }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use' && b.name === 'propose_hiring_contacts');
  const proposed = toolUse?.input?.contacts || [];

  const created = [];
  for (const c of proposed) {
    if (!c.fullName) continue;
    const person = await findOrCreatePerson({
      ownerUserId: userId,
      fullName: c.fullName,
      publicRole: c.publicRole || null,
      confidenceLabel: c.confidenceLabel || 'unverified_lead',
      sourceType: 'web_search',
      sourceReference: c.sourceReference || null,
    });
    await linkRodToPerson({ rod, tributaryType: 'opportunity_person_reference', personId: person.id, roleInContext: 'hiring_contact' });
    created.push(person);
  }
  return created;
}
