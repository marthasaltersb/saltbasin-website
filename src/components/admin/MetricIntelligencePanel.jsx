import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
const pct = (value) => value == null ? 'n/a' : `${(value * 100).toFixed(1)}%`;

export default function MetricIntelligencePanel() {
  const [variant, setVariant] = useState('live_arr');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.getMetricArrDemo(variant).then(setData).catch((e) => setError(e.message));
  }, [variant]);
  if (error) return <div style={{ padding: 24, color: '#a33' }}>{error}</div>;
  if (!data) return <div style={{ padding: 24 }}>Loading metric intelligence…</div>;
  const { definition, observations, analysis } = data;
  const current = observations.at(-1);
  const selected = definition.variants.find((item) => item.key === variant);
  return <div style={{ padding: 28, maxWidth: 1180, margin: '0 auto', color: '#172b34' }}>
    <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#61737b' }}>Metric Definition Registry</div>
    <h1 style={{ margin: '8px 0 4px', fontSize: 34 }}>{definition.displayName}</h1>
    <p style={{ maxWidth: 800, lineHeight: 1.6 }}>{definition.economicDefinition}</p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '22px 0' }}>
      {definition.variants.map((item) => <button key={item.key} onClick={() => setVariant(item.key)} style={{
        border: '1px solid #9cb0b7', borderRadius: 18, padding: '8px 14px', cursor: 'pointer',
        background: variant === item.key ? '#173e4b' : '#fff', color: variant === item.key ? '#fff' : '#173e4b'
      }}>{item.label}</button>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
      <Card label="Current value" value={money(current.value)} detail={selected.policy} />
      <Card label="Period change" value={money(analysis.change)} detail={`${pct(analysis.rate)} · ${analysis.classification}`} />
      <Card label="Confidence" value={pct(current.confidence)} detail={`Methodology v${current.calculationVersion}`} />
    </div>
    <section style={sectionStyle}><h2>Why did ARR increase?</h2>
      <p>{analysis.explanation} The driver bridge reconciles to {money(analysis.unexplained)} unexplained.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{analysis.drivers.filter((d) => d.key !== 'opening_arr').map((driver) =>
        <tr key={driver.key}><td style={cellStyle}>{driver.key.replaceAll('_', ' ')}</td><td style={{ ...cellStyle, textAlign: 'right' }}>{money(driver.contribution)}</td></tr>)}</tbody></table>
    </section>
    <section style={sectionStyle}><h2>Formula and variables</h2>
      <pre style={{ padding: 14, background: '#eef3f2', overflow: 'auto' }}>{JSON.stringify(selected.formula, null, 2)}</pre>
      {definition.variables.map((variable) => <div key={variable.key}><strong>{variable.key}</strong> — {variable.meaning}<br/><small>Grain: {variable.grain} · Sources: {variable.preferredSources.join(', ')}</small></div>)}
    </section>
  </div>;
}

const sectionStyle = { marginTop: 20, padding: 20, background: '#fff', border: '1px solid #d9e2e2', borderRadius: 12 };
const cellStyle = { padding: '9px 4px', borderBottom: '1px solid #e4e9e9', textTransform: 'capitalize' };
function Card({ label, value, detail }) { return <div style={sectionStyle}><div style={{ fontSize: 12, textTransform: 'uppercase', color: '#687b82' }}>{label}</div><div style={{ fontSize: 27, fontWeight: 650, margin: '6px 0' }}>{value}</div><small>{detail}</small></div>; }
