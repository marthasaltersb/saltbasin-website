// The 'content_research' Agent Hub kind — resolves which external systems a
// research agent should pull from, reusing the existing data_ports registry
// for source definitions and oauth_connections for credentials, instead of
// inventing a separate integration/config layer. Config resolves agent-level
// default (definition.config) with an optional per-run override
// (configOverride — e.g. from a future Topic-level "run research for this
// topic" action, passed through run-now's request body), same
// default/override seam already used elsewhere (currentRegistry.js,
// journey_atom_affinity_rules).
//
// Live per-provider fetching (actually calling a search/data API for
// Salesforce, Reddit, LinkedIn, etc.) is NOT implemented here — that is
// real, provider-specific integration work beyond this pass. What this
// agent does today: resolves the configured source list, checks which ones
// have a live OAuth connection, and records an honest herq_research_inputs
// placeholder + run summary so a topic owner can see what's connected and
// ready vs not yet wired — rather than silently doing nothing or
// fabricating research results.
import crypto from 'node:crypto';
import { db } from '../../db.js';

function newId(prefix = 'research') {
  return `${prefix}.${crypto.randomUUID().split('-')[0]}`;
}

export async function run(definition, { configOverride } = {}) {
  const baseConfig = definition.config || {};
  const config = { ...baseConfig, ...(configOverride || {}) };
  const dataPortKeys = Array.isArray(config.dataPortKeys) ? config.dataPortKeys : [];
  const topicRef = config.topicRef || null;

  if (!dataPortKeys.length) {
    return { summary: 'No data ports configured for this research agent — nothing to check.', stats: { portsChecked: 0 } };
  }

  const ports = await db.prepare(`SELECT * FROM data_ports WHERE port_key = ANY($1::text[])`).all(dataPortKeys);
  const connections = await db.prepare(`SELECT DISTINCT provider FROM oauth_connections`).all();
  const connectedProviders = new Set(connections.map((c) => c.provider));

  let connected = 0;
  let created = 0;

  for (const port of ports) {
    const isConnected = connectedProviders.has(port.native_system_type);
    if (isConnected) {
      connected += 1;
      const id = newId();
      await db.prepare(`
        INSERT INTO herq_research_inputs (id, title, source_name, source_type, verification_status, why_it_matters, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `).run(
        id,
        `${port.name} — awaiting live connector`,
        port.name,
        port.native_system_type,
        'needsVerification',
        `A live OAuth connection to ${port.native_system_type} exists, but this agent does not yet implement a provider-specific search/fetch for it. Configured for topic ${topicRef || '(none)'}.`,
        Date.now(),
      );
      created += 1;
    }
  }

  const missingPorts = dataPortKeys.filter((k) => !ports.some((p) => p.port_key === k));

  return {
    summary: `Checked ${ports.length} configured data port(s): ${connected} connected, ${ports.length - connected} not connected.${missingPorts.length ? ` ${missingPorts.length} port key(s) not found in the data_ports registry.` : ''}`,
    stats: { portsChecked: ports.length, portsConnected: connected, researchInputsCreated: created, missingPorts },
  };
}
