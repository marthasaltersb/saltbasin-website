/**
 * EidosOperatingModelPanel — admin config UI for the EIDOS Operating Model
 * (Salt Basin Divergent State Mechanics) built on top of the existing
 * journey_data_rods engine. See docs/eidos-operating-model-playbook.md.
 *
 * Phase 1 is broad-shallow: every layer gets a working list/edit/delete
 * screen here, but the deeper computations (real settlement math, real
 * accounting-topology inference) stay stub entry points server-side — this
 * panel exposes what's real today, not a promise of what isn't built yet.
 *
 * Global vs. scoped config: most resources below carry an optional Org ID.
 * Leave it blank to view/edit the global (platform-wide) definition; enter
 * an org's numeric id to view/edit that org's override, which takes
 * precedence over the global row for that org at evaluation time.
 *
 * Mirrors CareerMasterPanel's admin-CRUD shell (tab bar + table + edit
 * modal + toast), adapted for business-key-based upsert (PUT by key)
 * instead of numeric-id CRUD, since these are catalog/definition resources
 * an admin names deliberately (a port key, a policy key), not user content.
 */
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const TABS = [
  { id: 'rodTypes', label: 'Rod Types' },
  { id: 'ports', label: 'Ports' },
  { id: 'molecules', label: 'Evidence Atoms' },
  { id: 'clusters', label: 'Semantic Fields' },
  { id: 'affinityRules', label: 'Affinity Rules' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'gateDefinitions', label: 'Gate Definitions' },
  { id: 'settlement', label: 'Settlement' },
  { id: 'accountingPolicies', label: 'Accounting Policies' },
  { id: 'glAccounts', label: 'GL Accounts' },
  { id: 'accountingTopologies', label: 'Accounting Topologies' },
  { id: 'journalEntries', label: 'Journal Entries' },
  { id: 'reciprocal', label: 'Reciprocal Inference' },
  { id: 'decisions', label: 'Pending Decisions' },
];

const S = {
  wrap: { padding: '1.5rem', maxWidth: 1200, margin: '0 auto', fontFamily: 'var(--sb-font-body)' },
  h1: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' },
  sub: { fontSize: '0.82rem', color: '#666', marginBottom: '1.25rem' },
  tabBar: { display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' },
  tabBtn: (active) => ({
    padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.04em',
    background: active ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.06)',
    color: active ? 'white' : '#333', fontWeight: active ? 700 : 500,
  }),
  btn: (style) => ({
    padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : style === 'danger' ? '#c44' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' || style === 'danger' ? 'white' : '#333',
  }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', background: 'white', borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.1)' },
  th: { textAlign: 'left', padding: '0.55rem 0.75rem', background: 'rgba(0,0,0,0.04)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777', fontWeight: 700 },
  td: { padding: '0.55rem 0.75rem', borderTop: '0.5px solid rgba(0,0,0,0.06)', color: '#333' },
  row: { cursor: 'pointer' },
  input: { padding: '0.5rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', minHeight: 90, padding: '0.65rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.82rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  label: { fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem', display: 'block' },
  field: { marginBottom: '0.85rem' },
  scopeBar: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#555' },
  empty: { padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' },
};

function Field({ f, value, onChange, disabled }) {
  if (f.type === 'select') {
    return (
      <select style={S.input} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === 'textarea') {
    return <textarea style={S.textarea} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
  }
  if (f.type === 'json') {
    return (
      <textarea
        style={S.textarea}
        defaultValue={JSON.stringify(value ?? (f.arrayShape ? [] : {}), null, 2)}
        disabled={disabled}
        onBlur={(e) => {
          try { onChange(JSON.parse(e.target.value || (f.arrayShape ? '[]' : '{}'))); } catch { toast('Invalid JSON — change not applied'); }
        }}
      />
    );
  }
  if (f.type === 'checkbox') {
    return <input type="checkbox" checked={value !== false} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--sb-gold, #c4843a)' }} />;
  }
  if (f.type === 'number') {
    return <input style={S.input} type="number" step="any" value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
  }
  return <input style={S.input} type="text" value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
}

function EditModal({ schema, draft, setDraft, isNew, onSave, onDelete, onClose, saving }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: '1.75rem', width: 640, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--sb-navy, #1b2a3b)', marginBottom: '1rem' }}>
          {isNew ? 'Add' : 'Edit'} {schema.singular}
        </div>
        {schema.fields.map((f) => (
          <div key={f.key} style={S.field}>
            <label style={S.label}>{f.label}{f.keyField && !isNew ? ' (fixed once created)' : ''}</label>
            <Field f={f} value={draft[f.key]} disabled={f.keyField && !isNew} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', marginTop: '1rem' }}>
          <div>
            {!isNew && schema.remove && <button style={S.btn('danger')} onClick={onDelete} disabled={saving}>Delete</button>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={S.btn('outline')} onClick={onClose} disabled={saving}>Cancel</button>
            <button style={S.btn('gold')} onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic list+edit+delete screen driven by a schema — used for every
// resource that's a straightforward keyed definition table.
function KeyedResourcePanel({ schema }) {
  const [orgId, setOrgId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { draft, isNew }
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await schema.list(schema.orgScoped ? (orgId || null) : undefined));
    } catch (e) { toast('Failed to load: ' + e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [orgId]);

  function openNew() {
    const draft = { isActive: true };
    schema.fields.forEach((f) => { if (!(f.key in draft)) draft[f.key] = f.type === 'checkbox' ? true : null; });
    setEditing({ draft, isNew: true });
  }
  function openEdit(row) { setEditing({ draft: schema.fromRow(row), isNew: false }); }

  async function handleSave() {
    setSaving(true);
    try {
      await schema.save(editing.draft, editing.isNew);
      setEditing(null);
      await load();
      toast('Saved');
    } catch (e) { toast('Save failed: ' + e.message); } finally { setSaving(false); }
  }
  async function handleDelete() {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setSaving(true);
    try {
      await schema.remove(editing.draft);
      setEditing(null);
      await load();
      toast('Deleted');
    } catch (e) { toast('Delete failed: ' + e.message); } finally { setSaving(false); }
  }

  return (
    <div>
      {schema.orgScoped && (
        <div style={S.scopeBar}>
          <span>Org ID (blank = global default):</span>
          <input style={{ ...S.input, width: 140 }} type="number" value={orgId} onChange={(e) => setOrgId(e.target.value)} placeholder="global" />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button style={S.btn('gold')} onClick={openNew}>+ Add {schema.singular}</button>
      </div>
      {loading ? <div style={S.empty}>Loading…</div> : rows.length === 0 ? <div style={S.empty}>No {schema.label.toLowerCase()} yet.</div> : (
        <table style={S.table}>
          <thead><tr>{schema.columns.map((c) => <th key={c.key} style={S.th}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={schema.rowKey(row)} style={S.row} onClick={() => openEdit(row)}>
                {schema.columns.map((c) => <td key={c.key} style={S.td}>{String(row[c.key] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing && (
        <EditModal
          schema={schema} draft={editing.draft} setDraft={(fn) => setEditing((e) => ({ ...e, draft: fn(e.draft) }))}
          isNew={editing.isNew} saving={saving} onSave={handleSave} onDelete={handleDelete} onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ── Schemas ──────────────────────────────────────────────────────────────
const SCHEMAS = {
  rodTypes: {
    label: 'Rod Types', singular: 'Rod Type', orgScoped: false,
    list: async () => (await api.listEidosRodTypes()).rodTypes,
    rowKey: (r) => r.id,
    fromRow: (r) => ({ id: r.id, label: r.label, description: r.description, isActive: r.is_active, sortOrder: r.sort_order }),
    save: (draft) => api.saveEidosRodType(draft.id, draft),
    remove: (draft) => api.deleteEidosRodType(draft.id),
    columns: [{ key: 'id', label: 'ID' }, { key: 'label', label: 'Label' }, { key: 'is_active', label: 'Active' }, { key: 'sort_order', label: 'Sort' }],
    fields: [
      { key: 'id', label: 'ID (e.g. fund_deal)', type: 'text', keyField: true },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number' },
    ],
  },
  ports: {
    label: 'Ports', singular: 'Port', orgScoped: true,
    list: async (orgId) => (await api.listEidosPorts(orgId)).ports,
    rowKey: (r) => `${r.port_key}::${r.org_id || 'global'}`,
    fromRow: (r) => ({ portKey: r.port_key, orgId: r.org_id, name: r.name, portType: r.port_type, nativeSystemType: r.native_system_type, environment: r.environment, queryMode: r.query_mode, centralizationAllowed: r.centralization_allowed, policy: r.policy, isActive: r.is_active }),
    save: (draft) => api.saveEidosPort(draft.portKey, draft),
    remove: (draft) => api.deleteEidosPort(draft.portKey, draft.orgId),
    columns: [{ key: 'port_key', label: 'Key' }, { key: 'name', label: 'Name' }, { key: 'port_type', label: 'Type' }, { key: 'environment', label: 'Env' }, { key: 'org_id', label: 'Org' }],
    fields: [
      { key: 'portKey', label: 'Port Key (e.g. salesforce)', type: 'text', keyField: true },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'portType', label: 'Port Type', type: 'select', options: ['crm', 'erp', 'payment', 'contract', 'warehouse', 'document'] },
      { key: 'nativeSystemType', label: 'Native System', type: 'text' },
      { key: 'environment', label: 'Environment', type: 'select', options: ['production', 'sandbox', 'dev', 'archive'] },
      { key: 'queryMode', label: 'Query Mode', type: 'select', options: ['pull', 'push', 'source-side query', 'event'] },
      { key: 'centralizationAllowed', label: 'Raw Data May Centralize', type: 'checkbox' },
      { key: 'policy', label: 'Policy (JSON)', type: 'json' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  molecules: {
    label: 'Evidence Atom Definitions', singular: 'Atom Definition', orgScoped: false,
    list: async () => (await api.listEidosMolecules()).items,
    rowKey: (r) => r.molecule_key,
    fromRow: (r) => ({ moleculeKey: r.molecule_key, label: r.label, dataType: r.data_type, canonicalDefinition: r.canonical_definition, valueDomain: r.value_domain, mutabilityClass: r.mutability_class, isSensitive: r.is_sensitive, isActive: r.is_active }),
    save: (draft) => api.saveEidosMolecule(draft.moleculeKey, draft),
    remove: null,
    columns: [{ key: 'molecule_key', label: 'Key' }, { key: 'label', label: 'Label' }, { key: 'data_type', label: 'Data Type' }, { key: 'mutability_class', label: 'Mutability' }],
    fields: [
      { key: 'moleculeKey', label: 'Molecule Key', type: 'text', keyField: true },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'dataType', label: 'Data Type', type: 'select', options: ['text', 'number', 'boolean', 'date', 'enum', 'currency'] },
      { key: 'canonicalDefinition', label: 'Canonical Definition', type: 'textarea' },
      { key: 'valueDomain', label: 'Value Domain', type: 'text' },
      { key: 'mutabilityClass', label: 'Mutability Class', type: 'select', options: ['immutable', 'superseding', 'revisable'] },
      { key: 'isSensitive', label: 'Sensitive', type: 'checkbox' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  clusters: {
    label: 'Semantic Fields', singular: 'Semantic Field', orgScoped: false,
    list: async () => (await api.listEidosClusters()).items,
    rowKey: (r) => r.cluster_key,
    fromRow: (r) => ({ clusterKey: r.cluster_key, label: r.label, description: r.description, moleculeKeys: r.molecule_keys, completionRule: r.completion_rule, minimumCount: r.minimum_count, alignmentRules: r.alignment_rules, isActive: r.is_active }),
    save: (draft) => api.saveEidosCluster(draft.clusterKey, draft),
    remove: null,
    columns: [{ key: 'cluster_key', label: 'Key' }, { key: 'label', label: 'Label' }, { key: 'completion_rule', label: 'Completion Rule' }],
    fields: [
      { key: 'clusterKey', label: 'Cluster Key', type: 'text', keyField: true },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'moleculeKeys', label: 'Member Molecule Keys (JSON array)', type: 'json', arrayShape: true },
      { key: 'completionRule', label: 'Completion Rule', type: 'select', options: ['all', 'any', 'minimum_count'] },
      { key: 'minimumCount', label: 'Minimum Count', type: 'number' },
      { key: 'alignmentRules', label: 'Alignment Rules (JSON array)', type: 'json', arrayShape: true },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  affinityRules: {
    label: 'Affinity Rules', singular: 'Affinity Rule', orgScoped: true,
    list: async (orgId) => (await api.listEidosAffinityRules(orgId)).rules,
    rowKey: (r) => `${r.cluster_key}::${r.molecule_key}::${r.org_id || 'global'}`,
    fromRow: (r) => ({ clusterKey: r.cluster_key, moleculeKey: r.molecule_key, orgId: r.org_id, minimumAffinity: Number(r.minimum_affinity), sourceAuthorityModifier: Number(r.source_authority_modifier), metadata: r.metadata, isActive: r.is_active }),
    save: (draft) => api.saveEidosAffinityRule(draft.clusterKey, draft.moleculeKey, draft),
    remove: (draft) => api.deleteEidosAffinityRule(draft.clusterKey, draft.moleculeKey, draft.orgId),
    columns: [{ key: 'cluster_key', label: 'Semantic Field' }, { key: 'molecule_key', label: 'Atom' }, { key: 'minimum_affinity', label: 'Min Affinity' }, { key: 'org_id', label: 'Org' }],
    fields: [
      { key: 'clusterKey', label: 'Semantic Field (cluster key)', type: 'text', keyField: true },
      { key: 'moleculeKey', label: 'Atom (molecule key)', type: 'text', keyField: true },
      { key: 'minimumAffinity', label: 'Minimum Affinity (0-1)', type: 'number' },
      { key: 'sourceAuthorityModifier', label: 'Source Authority Modifier', type: 'number' },
      { key: 'metadata', label: 'Metadata (JSON)', type: 'json' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  scenarios: {
    label: 'Scenarios', singular: 'Scenario', orgScoped: false,
    list: async () => (await api.listEidosScenarios()).items,
    rowKey: (r) => r.scenario_key,
    fromRow: (r) => ({ scenarioKey: r.scenario_key, rodType: r.rod_type, label: r.label, description: r.description, selectedClusterKeys: r.selected_cluster_keys, dimensions: r.dimensions, actorRoles: r.actor_roles, isActive: r.is_active }),
    save: (draft) => api.saveEidosScenario(draft.scenarioKey, draft),
    remove: null,
    columns: [{ key: 'scenario_key', label: 'Key' }, { key: 'rod_type', label: 'Rod Type' }, { key: 'label', label: 'Label' }],
    fields: [
      { key: 'scenarioKey', label: 'Scenario Key', type: 'text', keyField: true },
      { key: 'rodType', label: 'Rod Type', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'selectedClusterKeys', label: 'Selected Semantic Field Keys (JSON array)', type: 'json', arrayShape: true },
      { key: 'dimensions', label: 'Dimensions (JSON array)', type: 'json', arrayShape: true },
      { key: 'actorRoles', label: 'Actor Roles (JSON array)', type: 'json', arrayShape: true },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  gateDefinitions: {
    label: 'Gate Definitions', singular: 'Gate Definition', orgScoped: false,
    list: async () => (await api.listEidosGateDefinitions()).items,
    rowKey: (r) => r.id,
    fromRow: (r) => ({ id: r.id, scenarioKey: r.scenario_key || '', stageKey: r.stage_key, requiredClusters: r.required_clusters, requiredMolecules: r.required_molecules, requiredDimensions: r.required_dimensions, requiredActorRoles: r.required_actor_roles, dependencyRules: r.dependency_rules, judgmentPolicy: r.judgment_policy, humanPrompt: r.human_prompt, sortOrder: r.sort_order, isActive: r.is_active }),
    save: (draft) => api.saveEidosGateDefinition(draft.scenarioKey, draft.stageKey, draft),
    remove: null,
    columns: [{ key: 'scenario_id', label: 'Scenario ID' }, { key: 'stage_key', label: 'Stage' }, { key: 'judgment_policy', label: 'Judgment Policy' }],
    fields: [
      { key: 'scenarioKey', label: 'Scenario Key (required to save)', type: 'text', keyField: true },
      { key: 'stageKey', label: 'Stage Key', type: 'text', keyField: true },
      { key: 'requiredClusters', label: 'Required Semantic Fields (JSON array)', type: 'json', arrayShape: true },
      { key: 'requiredMolecules', label: 'Required Atoms (JSON array)', type: 'json', arrayShape: true },
      { key: 'requiredDimensions', label: 'Required Dimensions (JSON array)', type: 'json', arrayShape: true },
      { key: 'requiredActorRoles', label: 'Required Actor Roles (JSON array)', type: 'json', arrayShape: true },
      { key: 'dependencyRules', label: 'Dependency Rules (JSON array)', type: 'json', arrayShape: true },
      { key: 'judgmentPolicy', label: 'Judgment Policy', type: 'select', options: ['never', 'when_ambiguous', 'always'] },
      { key: 'humanPrompt', label: 'Human Prompt', type: 'textarea' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  accountingPolicies: {
    label: 'Accounting Policies', singular: 'Accounting Policy', orgScoped: true,
    list: async (orgId) => (await api.listEidosAccountingPolicies(orgId)).policies,
    rowKey: (r) => `${r.policy_key}::${r.org_id || 'global'}`,
    fromRow: (r) => ({ policyKey: r.policy_key, orgId: r.org_id, framework: r.framework, legalEntity: r.legal_entity, jurisdiction: r.jurisdiction, recognitionRules: r.recognition_rules, measurementRules: r.measurement_rules, allocationRules: r.allocation_rules, isActive: r.is_active }),
    save: (draft) => api.saveEidosAccountingPolicy(draft.policyKey, draft),
    remove: (draft) => api.deleteEidosAccountingPolicy(draft.policyKey, draft.orgId),
    columns: [{ key: 'policy_key', label: 'Key' }, { key: 'framework', label: 'Framework' }, { key: 'jurisdiction', label: 'Jurisdiction' }, { key: 'org_id', label: 'Org' }],
    fields: [
      { key: 'policyKey', label: 'Policy Key', type: 'text', keyField: true },
      { key: 'framework', label: 'Framework', type: 'select', options: ['GAAP', 'IFRS', 'Tax', 'Statutory'] },
      { key: 'legalEntity', label: 'Legal Entity', type: 'text' },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
      { key: 'recognitionRules', label: 'Recognition Rules (JSON)', type: 'json' },
      { key: 'measurementRules', label: 'Measurement Rules (JSON)', type: 'json' },
      { key: 'allocationRules', label: 'Allocation Rules (JSON)', type: 'json' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  glAccounts: {
    label: 'GL Accounts', singular: 'GL Account', orgScoped: true,
    list: async (orgId) => (await api.listEidosGlAccounts(orgId)).accounts,
    rowKey: (r) => `${r.account_key}::${r.org_id || 'global'}`,
    fromRow: (r) => ({ accountKey: r.account_key, orgId: r.org_id, nativeAccountId: r.native_account_id, legalEntity: r.legal_entity, accountType: r.account_type, normalBalance: r.normal_balance, semanticDefinition: r.semantic_definition, permittedEventClasses: r.permitted_event_classes, isActive: r.is_active }),
    save: (draft) => api.saveEidosGlAccount(draft.accountKey, draft),
    remove: (draft) => api.deleteEidosGlAccount(draft.accountKey, draft.orgId),
    columns: [{ key: 'account_key', label: 'Key' }, { key: 'account_type', label: 'Type' }, { key: 'normal_balance', label: 'Normal Balance' }, { key: 'org_id', label: 'Org' }],
    fields: [
      { key: 'accountKey', label: 'Account Key', type: 'text', keyField: true },
      { key: 'nativeAccountId', label: 'Native Account ID', type: 'text' },
      { key: 'legalEntity', label: 'Legal Entity', type: 'text' },
      { key: 'accountType', label: 'Account Type', type: 'select', options: ['asset', 'liability', 'equity', 'revenue', 'expense'] },
      { key: 'normalBalance', label: 'Normal Balance', type: 'select', options: ['debit', 'credit'] },
      { key: 'semanticDefinition', label: 'Semantic Definition', type: 'textarea' },
      { key: 'permittedEventClasses', label: 'Permitted Event Classes (JSON array)', type: 'json', arrayShape: true },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  accountingTopologies: {
    label: 'Accounting Topologies', singular: 'Accounting Topology', orgScoped: true,
    list: async (orgId) => (await api.listEidosAccountingTopologies(orgId)).topologies,
    rowKey: (r) => `${r.topology_key}::${r.org_id || 'global'}`,
    fromRow: (r) => ({ topologyKey: r.topology_key, orgId: r.org_id, label: r.label, economicCompositionRequirements: r.economic_composition_requirements, requiredAccountRoles: r.required_account_roles, balancingConstraints: r.balancing_constraints, policyId: r.policy_id, isActive: r.is_active }),
    save: (draft) => api.saveEidosAccountingTopology(draft.topologyKey, draft),
    remove: (draft) => api.deleteEidosAccountingTopology(draft.topologyKey, draft.orgId),
    columns: [{ key: 'topology_key', label: 'Key' }, { key: 'label', label: 'Label' }, { key: 'org_id', label: 'Org' }],
    fields: [
      { key: 'topologyKey', label: 'Topology Key', type: 'text', keyField: true },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'economicCompositionRequirements', label: 'Economic Composition Requirements (JSON array)', type: 'json', arrayShape: true },
      { key: 'requiredAccountRoles', label: 'Required Account Roles (JSON array)', type: 'json', arrayShape: true },
      { key: 'balancingConstraints', label: 'Balancing Constraints (JSON)', type: 'json' },
      { key: 'policyId', label: 'Accounting Policy ID', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
};

function SettlementPanel() {
  const [rodId, setRodId] = useState('');
  const [moleculeKey, setMoleculeKey] = useState('');
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!rodId) return;
    setBusy(true);
    try { setRows((await api.getEidosSettlementStates(rodId)).settlementStates); } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [rodId]);

  async function compute() {
    if (!rodId || !moleculeKey) return toast('Rod ID and Molecule Key are required');
    setBusy(true);
    try { await api.computeEidosSettlement(rodId, moleculeKey); await load(); toast('Settlement computed'); } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <p style={S.sub}>Settlement density is computed per (rod, atom) pair from that rod's attached evidence — not stored on the atom definition. Not yet wired into automatic gate evaluation.</p>
      <div style={S.scopeBar}>
        <span>Rod ID:</span>
        <input style={{ ...S.input, width: 140 }} type="number" value={rodId} onChange={(e) => setRodId(e.target.value)} />
        <span>Molecule Key:</span>
        <input style={{ ...S.input, width: 200 }} type="text" value={moleculeKey} onChange={(e) => setMoleculeKey(e.target.value)} />
        <button style={S.btn('gold')} onClick={compute} disabled={busy}>Compute</button>
      </div>
      {rows.length === 0 ? <div style={S.empty}>{rodId ? 'No settlement states computed yet for this rod.' : 'Enter a Rod ID to view settlement states.'}</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>Molecule</th><th style={S.th}>Density</th><th style={S.th}>Class</th><th style={S.th}>Computed</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.molecule_key}><td style={S.td}>{r.molecule_key}</td><td style={S.td}>{Number(r.settlement_density).toFixed(2)}</td><td style={S.td}>{r.settlement_class}</td><td style={S.td}>{new Date(Number(r.computed_at)).toLocaleString()}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

function ReciprocalPanel() {
  const [rodId, setRodId] = useState('');
  const [rodIdB, setRodIdB] = useState('');
  const [comparisons, setComparisons] = useState([]);
  const [divergences, setDivergences] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!rodId) return;
    setBusy(true);
    try {
      setComparisons((await api.getEidosReciprocalComparisons(rodId)).comparisons);
      setDivergences((await api.getEidosDivergences(rodId)).divergences);
    } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [rodId]);

  async function computeDivergence() {
    if (!rodId || !rodIdB) return toast('Both Rod IDs are required');
    setBusy(true);
    try { await api.computeEidosDivergence(rodId, rodIdB); await load(); toast('Divergence computed'); } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <p style={S.sub}>Reciprocal Economic-Accounting State Projection (Invention 4) — divergence between an independently-derived journey projection and an accounting-implied composition. The inference algorithm itself is still research-stage; this computes a simplified stand-in (see server/lib/eidos.js).</p>
      <div style={S.scopeBar}>
        <span>Rod ID:</span>
        <input style={{ ...S.input, width: 140 }} type="number" value={rodId} onChange={(e) => setRodId(e.target.value)} />
        <span>Compare against Rod ID:</span>
        <input style={{ ...S.input, width: 140 }} type="number" value={rodIdB} onChange={(e) => setRodIdB(e.target.value)} />
        <button style={S.btn('gold')} onClick={computeDivergence} disabled={busy}>Compute Divergence</button>
      </div>
      <h4 style={{ fontSize: '0.85rem', marginTop: '1.25rem' }}>Divergence States</h4>
      {divergences.length === 0 ? <div style={S.empty}>{rodId ? 'No divergence states computed yet.' : 'Enter a Rod ID.'}</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>Rod A</th><th style={S.th}>Rod B</th><th style={S.th}>Axial</th><th style={S.th}>Density</th><th style={S.th}>Boundary Exceeded</th></tr></thead>
          <tbody>{divergences.map((d) => (
            <tr key={d.id}><td style={S.td}>{d.rod_id_a}</td><td style={S.td}>{d.rod_id_b}</td><td style={S.td}>{Number(d.axial_divergence).toFixed(2)}</td><td style={S.td}>{Number(d.density_divergence).toFixed(2)}</td><td style={S.td}>{d.boundary_exceeded ? 'Yes' : 'No'}</td></tr>
          ))}</tbody>
        </table>
      )}
      <h4 style={{ fontSize: '0.85rem', marginTop: '1.25rem' }}>Reciprocity Comparisons</h4>
      {comparisons.length === 0 ? <div style={S.empty}>None yet.</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>Journal Entry</th><th style={S.th}>Actual</th><th style={S.th}>Inferred</th><th style={S.th}>State</th></tr></thead>
          <tbody>{comparisons.map((c) => (
            <tr key={c.id}><td style={S.td}>{c.journal_entry_id || '—'}</td><td style={S.td}>{c.actual_coordinate ?? '—'}</td><td style={S.td}>{c.inferred_coordinate ?? '—'}</td><td style={S.td}>{c.reciprocity_state}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

function JournalEntriesPanel() {
  const [entries, setEntries] = useState([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try { setEntries((await api.listEidosJournalEntries()).entries); } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setDraft({ rodId: '', legalEntity: '', currency: 'USD', lines: [{ glAccountId: '', debitAmount: 0, creditAmount: 0, description: '' }] }); setCreating(true); }
  function addLine() { setDraft((d) => ({ ...d, lines: [...d.lines, { glAccountId: '', debitAmount: 0, creditAmount: 0, description: '' }] })); }
  function updateLine(i, patch) { setDraft((d) => ({ ...d, lines: d.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l) })); }

  async function save() {
    setBusy(true);
    try { await api.createEidosJournalEntry(draft); setCreating(false); await load(); toast('Journal entry created'); } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button style={S.btn('gold')} onClick={openNew}>+ New Journal Entry</button>
      </div>
      {entries.length === 0 ? <div style={S.empty}>No journal entries yet.</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>ID</th><th style={S.th}>Legal Entity</th><th style={S.th}>Debit</th><th style={S.th}>Credit</th><th style={S.th}>Source</th></tr></thead>
          <tbody>{entries.map((e) => (
            <tr key={e.id}><td style={S.td}>{e.id}</td><td style={S.td}>{e.legal_entity || '—'}</td><td style={S.td}>{e.total_debit}</td><td style={S.td}>{e.total_credit}</td><td style={S.td}>{e.source_type}</td></tr>
          ))}</tbody>
        </table>
      )}
      {creating && draft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '1.75rem', width: 720, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>New Journal Entry</div>
            <div style={S.field}><label style={S.label}>Rod ID (optional)</label><input style={S.input} type="number" value={draft.rodId} onChange={(e) => setDraft((d) => ({ ...d, rodId: e.target.value }))} /></div>
            <div style={S.field}><label style={S.label}>Legal Entity</label><input style={S.input} type="text" value={draft.legalEntity} onChange={(e) => setDraft((d) => ({ ...d, legalEntity: e.target.value }))} /></div>
            <div style={S.field}><label style={S.label}>Lines</label>
              {draft.lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <input style={S.input} type="number" placeholder="GL Account ID" value={line.glAccountId} onChange={(e) => updateLine(i, { glAccountId: e.target.value })} />
                  <input style={S.input} type="number" placeholder="Debit" value={line.debitAmount} onChange={(e) => updateLine(i, { debitAmount: Number(e.target.value) })} />
                  <input style={S.input} type="number" placeholder="Credit" value={line.creditAmount} onChange={(e) => updateLine(i, { creditAmount: Number(e.target.value) })} />
                  <input style={S.input} type="text" placeholder="Description" value={line.description} onChange={(e) => updateLine(i, { description: e.target.value })} />
                </div>
              ))}
              <button style={S.btn('outline')} onClick={addLine}>+ Add Line</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button style={S.btn('outline')} onClick={() => setCreating(false)} disabled={busy}>Cancel</button>
              <button style={S.btn('gold')} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PendingDecisionsPanel() {
  const [decisions, setDecisions] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try { setDecisions((await api.getEidosPendingDecisions()).decisions); } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);

  async function resolve(id, status) {
    setBusy(true);
    try { await api.resolveEidosDecision(id, status); await load(); toast(status === 'approved' ? 'Approved' : 'Rejected'); } catch (e) { toast('Failed: ' + e.message); } finally { setBusy(false); }
  }

  if (decisions.length === 0) return <div style={S.empty}>No pending decisions — the evaluation engine hasn't requested human judgment on anything right now.</div>;
  return (
    <table style={S.table}>
      <thead><tr><th style={S.th}>Rod</th><th style={S.th}>Type</th><th style={S.th}>Prompt</th><th style={S.th}>Requested</th><th style={S.th}></th></tr></thead>
      <tbody>{decisions.map((d) => (
        <tr key={d.id}>
          <td style={S.td}>{d.rod_id}</td>
          <td style={S.td}>{d.decision_type}</td>
          <td style={S.td}>{d.human_prompt}</td>
          <td style={S.td}>{new Date(Number(d.requested_at)).toLocaleString()}</td>
          <td style={S.td}>
            <button style={{ ...S.btn('gold'), marginRight: '0.4rem' }} onClick={() => resolve(d.id, 'approved')} disabled={busy}>Approve</button>
            <button style={S.btn('danger')} onClick={() => resolve(d.id, 'rejected')} disabled={busy}>Reject</button>
          </td>
        </tr>
      ))}</tbody>
    </table>
  );
}

export default function EidosOperatingModelPanel() {
  const [activeTab, setActiveTab] = useState('rodTypes');
  return (
    <div style={S.wrap}>
      <div style={S.h1}>EIDOS Operating Model</div>
      <div style={S.sub}>Global and org-scoped configuration for the Salt Basin Divergent State Mechanics engine, built on the journey_data_rods evidence/gate/scenario system. See docs/eidos-operating-model-playbook.md.</div>
      <div style={S.tabBar}>
        {TABS.map((t) => <button key={t.id} style={S.tabBtn(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
      </div>
      {activeTab === 'settlement' ? <SettlementPanel /> :
       activeTab === 'reciprocal' ? <ReciprocalPanel /> :
       activeTab === 'journalEntries' ? <JournalEntriesPanel /> :
       activeTab === 'decisions' ? <PendingDecisionsPanel /> :
       SCHEMAS[activeTab] ? <KeyedResourcePanel schema={SCHEMAS[activeTab]} /> : null}
    </div>
  );
}
