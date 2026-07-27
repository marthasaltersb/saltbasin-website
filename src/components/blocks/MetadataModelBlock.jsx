// Atom / Joint / Molecule metadata model — a small, config-driven explainer
// diagram, not a graph-layout engine. Renders nodes grouped by tier in three
// columns plus a plain-text worked example from `edges`. See
// docs/salt-basin-metadata-model.md for the canonical definitions.
import React from 'react';

const TIER_ORDER = ['atom', 'joint', 'molecule'];
const TIER_LABEL = { atom: 'Atom', joint: 'Bonding Rule', molecule: 'Molecule' };

export function MetadataModelDiagramBlock({ section }) {
  const f = section.fields || {};
  const nodes = Array.isArray(f.nodes) ? f.nodes : [];
  const edges = Array.isArray(f.edges) ? f.edges : [];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <section id={section.id} className="sbh-px-band sbh-px-band-dark">
      <div className="sbh-px-head is-dark">
        {f.eyebrow && <p className="sbh-eyebrow">{f.eyebrow}</p>}
        {f.heading && <h2>{f.heading}</h2>}
        {f.intro && <p className="sbh-px-intro">{f.intro}</p>}
      </div>
      <div className="sbh-px-metamodel-tiers">
        {TIER_ORDER.map((tier) => (
          <div className="sbh-px-metamodel-col" key={tier}>
            <div className={`sbh-px-metamodel-tier-tag sbh-px-metamodel-tier-${tier}`}>{TIER_LABEL[tier]}</div>
            {nodes.filter((n) => n.tier === tier).map((n, i) => (
              <div className="sbh-px-metamodel-node" key={n.id || i}>
                <b>{n.label}</b>
                {n.desc && <span>{n.desc}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {edges.length > 0 && (
        <div className="sbh-px-metamodel-example">
          {edges.map((e, i) => {
            const from = byId[e.from];
            const to = byId[e.to];
            if (!from || !to) return null;
            return (
              <p key={i}>
                <b>{from.label}</b> <span className="sbh-px-mono">{e.label || '→'}</span> <b>{to.label}</b>
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}
