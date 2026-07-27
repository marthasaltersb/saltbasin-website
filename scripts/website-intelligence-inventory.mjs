// Runs the Website Intelligence Engine's Phase 2 WebsiteAnalysisAgent
// (server/lib/websiteIntelligence/{sourceAdapters,pageInventory}.js)
// against the real published site_state and prints the resulting
// WebsitePageInventory. Read-only — does not touch site_state or
// member_sites. See .claude/skills/salt-basin-website-intelligence.
//
// Usage: node scripts/website-intelligence-inventory.mjs [draft|published]

import 'dotenv/config';
import { adaptSaltBasinSiteState } from '../server/lib/websiteIntelligence/sourceAdapters.js';
import { buildPageInventory } from '../server/lib/websiteIntelligence/pageInventory.js';

const kind = process.argv[2] === 'draft' ? 'draft' : 'published';

const source = await adaptSaltBasinSiteState(kind);
if (!source) {
  console.log(`No site_state row found for kind="${kind}".`);
  process.exit(0);
}

const inventory = buildPageInventory(source.pages, { sourceHash: source.record.content_hash });

console.log(`Source: ${source.record.source_id} (authority=${source.record.source_authority}, hash=${source.record.content_hash}, effective_date=${new Date(Number(source.record.effective_date)).toISOString()})`);
console.log(`Pages: ${inventory.length}\n`);
console.log(JSON.stringify(inventory, null, 2));

process.exit(0);
