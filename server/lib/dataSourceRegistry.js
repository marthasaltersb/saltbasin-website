// Generalized dashboard-rollup data sources (2026-07-27) — config-driven
// registry so a rollup block can pull from any registered domain instead of
// being hardcoded to career data. `career` wraps the pre-existing
// buildCareerAtomRollupCatalog() call verbatim (same output shape, same
// data) so every existing careerRollupShowcase section is unaffected.
//
// Deliberately NOT registering a `financial` domain here — financial data
// has its own consent/entitlement gates (financial_consents,
// data_entitlements, financial_output_shares) that a generic rollup fetch
// must not bypass. Adding a financial data source means threading those
// checks through `scopes`/an entitlement check first, not a quick add.
import { db } from '../db.js';
import { buildCareerAtomRollupCatalog } from './careerAtomRollups.js';

export const DATA_SOURCES = Object.freeze({
  career: {
    label: 'Career Atom Rollups',
    scopes: ['personal'],
    defaultGroupBy: 'skills',
    groupKeys: { skills: 'skills_by_category', industry: 'jobs_by_industry', tools: 'tools_by_wheel_bucket' },
    async fetch(ownerUserId) {
      return buildCareerAtomRollupCatalog(ownerUserId);
    },
  },
  content_activity: {
    label: 'Content Activity (publishes & edits)',
    scopes: ['personal', 'org'],
    defaultGroupBy: 'by_action',
    groupKeys: { by_action: 'content_activity_by_action' },
    async fetch(ownerUserId) {
      const rows = await db.prepare(`
        SELECT action, COUNT(*)::int AS count
        FROM audit_log
        WHERE actor_id = $1
        GROUP BY action
        ORDER BY count DESC
        LIMIT 20
      `).all(ownerUserId);
      return {
        content_activity_by_action: rows.map((r) => ({ key: r.action, label: r.action, value: Number(r.count) })),
      };
    },
  },
});

export function dataSourceDefinition(key) {
  return DATA_SOURCES[key] || null;
}
