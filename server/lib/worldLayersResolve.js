// World Shell layer resolver (2026-10-09, docs/changes/world-shell-layers.md).
//
// The same check the browser does when it restores `/world?at=...`: parse the
// serialised layer stack, drop every layer the signed-in user cannot (or can no
// longer) open, and return the deepest valid stack with the reason and the
// trail labels. Used by `GET /api/world-layers/resolve` (the API surface of the
// layered navigation) and to be called by the platform MCP tool of the same
// name once server/lib/mcpToolRegistry.js exists (same function, same
// permissions - the caller passes the authenticated user, never a user id).
import { getJSON, db } from '../db.js';
import { defaultMemberConfig } from '../data/defaultMemberConfig.js';
import { resolveWorldIslands } from '../../src/lib/worldIslands.js';
import { parseAt, serializeAt, structuralProblem } from '../../src/lib/worldLayers.js';
import { listCareerOpportunities } from './careerOpportunityRollups.js';
import { listCommercialOpportunities } from './commercialOpportunityRollups.js';
import { listOpportunityOutputs } from './opportunityOutputs.js';

// The user's own tabs: admin_nav for admins; for members their member_configs
// navigation plus the read-time additive default tabs (as GET /api/member-config/draft).
async function tabsFor(user) {
  if (user.role === 'admin') {
    const nav = (await getJSON('config_state', 'admin_nav')) || { views: [] };
    return (nav.views || []).flatMap((v) => v.tabs || []);
  }
  const row = await db.prepare('SELECT data FROM member_configs WHERE user_id = $1 AND kind = $2').get(user.id, 'draft');
  const cfg = row ? JSON.parse(row.data) : null;
  const defaults = defaultMemberConfig({ displayName: user.displayName, email: user.email });
  const mine = cfg?.navigation?.memberTabs || defaults.navigation.memberTabs || [];
  const have = new Set(mine.map((t) => t.id));
  return [...mine, ...(defaults.navigation.memberTabs || []).filter((t) => !have.has(t.id))];
}

const oppTitle = (o) => o?.metadata?.jobTitle || o?.metadata?.companyName || `Opportunity ${o?.id}`;

export async function resolveWorldLayers(user, at) {
  const scope = user.role === 'admin' ? 'admin' : 'member';
  const islands = resolveWorldIslands(await tabsFor(user));
  const raw = parseAt(at);
  const stack = [];
  const labels = [];
  let problem = null;
  let outputs = null; // lazily loaded for the current opportunity
  const listerOf = (island) => (island?.componentId === 'careerPlacementAgents' && scope === 'member' ? listCareerOpportunities
    : island?.componentId === 'commercialOpportunities' && scope === 'admin' ? listCommercialOpportunities : null);

  for (let i = 0; i < raw.length && !problem; i += 1) {
    const l = raw[i];
    const prev = stack[i - 1];
    const why = structuralProblem(l, prev, i);
    if (why) { problem = { layer: l, why }; break; }
    let label = null;
    if (l.kind === 'journeys') label = 'Journeys';
    else if (l.kind === 'island' || l.kind === 'classic') {
      const isl = islands.find((x) => x.key === l.key);
      if (l.kind === 'island' && !isl) { problem = { layer: l, why: 'it is not one of your islands' }; break; }
      label = isl?.label || 'Classic Tools';
      outputs = null;
    } else if (l.kind === 'moon') {
      const isl = islands.find((x) => x.key === prev.key);
      const moon = isl?.moons?.find((m) => m.key === l.key && (!m.scopes || m.scopes.includes(scope)) && !m.destinationKey && m.panel !== 'classicTools');
      if (!moon) { problem = { layer: l, why: 'that moon is not available to you' }; break; }
      label = moon.label;
    } else if (l.kind === 'opp') {
      const list = listerOf(islands.find((x) => x.key === prev.key));
      if (!list) { problem = { layer: l, why: 'this island does not track opportunities' }; break; }
      const opps = (await list(user.id)).opportunities || [];
      const o = opps.find((x) => String(x.id) === l.key);
      if (!o) { problem = { layer: l, why: 'that opportunity no longer exists or is not yours' }; break; }
      label = oppTitle(o);
      outputs = null;
    } else if (l.kind === 'outputs') {
      label = 'Application outputs';
    } else if (l.kind === 'output' || l.kind === 'editor' || l.kind === 'versions') {
      const oppLayer = [...stack].reverse().find((x) => x.kind === 'opp');
      if (!oppLayer || scope !== 'member') { problem = { layer: l, why: 'outputs belong to a career opportunity' }; break; }
      if (!outputs) {
        try { outputs = (await listOpportunityOutputs(user.id, Number(oppLayer.key))).outputs || []; } catch (e) { problem = { layer: l, why: e.message }; break; }
      }
      const outId = String(l.key).split('.')[0];
      const out = outputs.find((o) => String(o.id) === outId || (o.provenance?.lineage || []).some((x) => String(x.id) === outId));
      if (!out) { problem = { layer: l, why: 'that output is no longer linked to this opportunity' }; break; }
      if (l.kind === 'editor' && !out.editable) { problem = { layer: l, why: out.notEditableReason || 'this version cannot be edited' }; break; }
      label = l.kind === 'output' ? out.title : l.kind === 'editor' ? 'Draft editor' : 'Version history';
    }
    stack.push(l);
    labels.push(label || l.key);
  }

  const named = problem ? `${problem.layer.kind}${problem.layer.key ? ` ${problem.layer.key}` : ''}` : '';
  return {
    requested: serializeAt(raw),
    at: serializeAt(stack),
    scope,
    valid: !problem,
    note: problem ? `The link pointed to "${named}", which is not available here (${problem.why}). Showing the deepest layer that is.` : '',
    trail: [{ index: -1, kind: 'sun', label: 'Sun' }, ...stack.map((l, i) => ({ index: i, kind: l.kind, key: l.key, label: labels[i] }))],
    // Layer 0 (the Sun menu): the islands this user may enter.
    // Same entries as the UI's Sun menu: every island, then the Journeys card list.
    sunMenu: [...islands.map((i) => ({ key: i.key, label: i.label, kind: i.kind })), { key: 'journeys', label: 'Journeys', kind: 'journeys' }],
  };
}
