// Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) — the
// review queue a member works through when two equal-standing sources
// (resume, LinkedIn export, Indeed export, Fiverr export, ...) disagree
// about the same fact, or when an AI-proposed mapping had no confident atom
// match. Conflicts are shown first, then ambiguous mappings — the API
// already returns them in that order (task_type is the priority signal, no
// separate priority column). Styling follows CareerMappingPreview.jsx's
// local-style-object convention (no adminStyles.js import), since this
// panel is a close sibling of that screen.
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import CareerBoundOutputEditor from './CareerBoundOutputEditor.jsx';

const ENTRY_TYPE_LABELS = {
  career_job_entry: 'Job', career_skill_entry: 'Skill', career_tool_entry: 'Tool',
  career_engagement_entry: 'Engagement / Case Study', career_domain_entry: 'Domain',
  career_certification_entry: 'Certification', career_deal_entry: 'Deal',
};

const S = {
  wrap: { maxWidth: 900, margin: '1rem auto 2rem', padding: '0 1.5rem' },
  banner: { background: 'rgba(2,161,166,0.07)', border: '0.5px solid rgba(2,161,166,0.25)', borderRadius: 10, padding: '0.9rem 1.1rem', fontSize: '0.8rem', color: '#1e565a', marginBottom: '1.25rem', lineHeight: 1.55 },
  groupTitle: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', margin: '1.25rem 0 0.6rem' },
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.1rem', marginBottom: '0.85rem' },
  conflictTag: { display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a35', background: 'rgba(170,51,85,0.08)', borderRadius: 999, padding: '0.15rem 0.55rem', marginBottom: '0.6rem' },
  ambiguousTag: { display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a56b18', background: 'rgba(196,132,58,0.1)', borderRadius: 999, padding: '0.15rem 0.55rem', marginBottom: '0.6rem' },
  fieldName: { fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.5rem' },
  sourceRow: { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.45rem 0', borderTop: '1px solid rgba(0,0,0,0.06)' },
  sourceValue: { fontSize: '0.8rem', color: '#222', fontWeight: 600 },
  sourceMeta: { fontSize: '0.68rem', color: '#888', marginTop: '0.15rem' },
  excerpt: { fontSize: '0.75rem', color: '#555', fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '0.5rem 0.6rem', margin: '0.5rem 0' },
  reasoning: { fontSize: '0.75rem', color: '#555', lineHeight: 1.5, margin: '0.4rem 0' },
  dictateBox: { width: '100%', boxSizing: 'border-box', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 7, padding: '0.5rem 0.65rem', fontSize: '0.78rem', fontFamily: 'inherit', marginTop: '0.5rem' },
  btnRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' },
  btn: (tone = 'outline', disabled = false) => ({
    padding: '0.4rem 0.8rem', borderRadius: 7, border: tone === 'outline' ? '0.5px solid rgba(0,0,0,0.18)' : 'none',
    cursor: 'pointer', fontSize: '0.74rem', fontFamily: 'var(--sb-font-label)',
    background: tone === 'gold' ? 'var(--sb-gold, #c4843a)' : tone === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'white',
    color: tone === 'gold' || tone === 'navy' ? 'white' : '#333',
    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', background: '#d9dde1', color: '#5b6672' } : {}),
  }),
  empty: { padding: '2rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' },
  beforeAfter: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'stretch', margin: '0.5rem 0' },
  beforeBox: { background: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '0.45rem 0.6rem', fontSize: '0.78rem', color: '#444' },
  afterBox: { background: 'rgba(2,161,166,0.08)', borderRadius: 6, padding: '0.45rem 0.6rem', fontSize: '0.78rem', color: '#134', fontWeight: 600 },
  boxLabel: { fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', fontWeight: 700, marginBottom: 2 },
  packageTag: { display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1e565a', background: 'rgba(2,161,166,0.12)', borderRadius: 999, padding: '0.15rem 0.55rem', marginBottom: '0.6rem', marginRight: '0.4rem' },
  warnBox: { background: '#FBEBD0', border: '1px solid #E8C98F', color: '#5C3B08', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.78rem', marginBottom: '0.75rem', lineHeight: 1.5 },
  checkboxLabel: { display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: '#666', marginTop: '0.5rem' },
};

function ConflictCard({ task, onResolved }) {
  const [dictating, setDictating] = useState(false);
  const [dictated, setDictated] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [busy, setBusy] = useState(false);

  async function resolve(resolution) {
    setBusy(true);
    try {
      await api.resolveCareerReconciliationTask(task.id, resolution);
      toast.success('Conflict resolved');
      onResolved(task.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function askBestyStaff() {
    setBusy(true);
    try {
      const result = await api.askBestyStaffCareer(task.id, dictated);
      if (result.offline) {
        setAgentReply('BestyStaff is offline. Your task was not changed; choose a source or try again later.');
        return;
      }
      setAgentReply(result.reply || 'BestyStaff reviewed your correction.');
      if (result.resolved?.status === 'resolved') {
        toast.success('Conflict resolved by BestyStaff');
        onResolved(task.id);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.card}>
      <span style={S.conflictTag}>Sources disagree</span>
      <div style={S.fieldName}>{ENTRY_TYPE_LABELS[task.entryType] || task.entryType} — {task.atomKey}</div>
      {task.evidenceRefs.map((ref) => (
        <div key={ref.sourceMappingId} style={S.sourceRow}>
          <div style={{ flex: 1 }}>
            <div style={S.sourceValue}>{String(ref.value ?? '—')}</div>
            <div style={S.sourceMeta}>{ref.sourceFilename || ref.sourceKind || 'source'}{ref.sourceLocation ? ` — ${ref.sourceLocation}` : ''}</div>
          </div>
          <button type="button" style={S.btn('gold', busy)} disabled={busy} onClick={() => resolve({ method: 'chose_source', chosenSourceReference: ref.sourceMappingId })}>
            Use this
          </button>
        </div>
      ))}
      {!dictating && (
        <div style={S.btnRow}>
          <button type="button" style={S.btn('outline', busy)} disabled={busy} onClick={() => setDictating(true)}>Tell BestyStaff what's correct</button>
        </div>
      )}
      {dictating && (
        <div>
          <textarea style={S.dictateBox} rows={2} value={dictated} onChange={(e) => setDictated(e.target.value)} placeholder="e.g. The end date should be March 2024, none of the sources have it exactly right" />
          <div style={S.btnRow}>
            <button type="button" style={S.btn('navy', busy || !dictated.trim())} disabled={busy || !dictated.trim()} onClick={askBestyStaff}>
              {busy ? 'Asking BestyStaff…' : 'Ask BestyStaff to apply'}
            </button>
            <button type="button" style={S.btn('outline', busy)} disabled={busy} onClick={() => setDictating(false)}>Cancel</button>
          </div>
          {agentReply && <div style={S.reasoning} role="status">{agentReply}</div>}
        </div>
      )}
    </div>
  );
}

function AmbiguousCard({ task, onResolved }) {
  const [reasoningApproved, setReasoningApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = task.evidenceRefs?.[0] || {};
  const reasoning = task.reasoning || {};

  async function acknowledge() {
    setBusy(true);
    try {
      await api.resolveCareerReconciliationTask(task.id, { method: 'acknowledge', reasoningApproved });
      toast.success('Reviewed');
      onResolved(task.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.card}>
      <span style={S.ambiguousTag}>{reasoning.overlap === 'none' ? 'No confident match' : 'Weak match'}</span>
      <div style={S.fieldName}>{ENTRY_TYPE_LABELS[task.entryType] || task.entryType}{task.atomKey ? ` — ${task.atomKey}` : ''}{ref.sourceFilename ? ` (${ref.sourceFilename})` : ''}</div>
      <div style={S.sourceValue}>Proposed value: {String(ref.value ?? '—')}</div>
      {reasoning.sourceExcerpt && <div style={S.excerpt}>"{reasoning.sourceExcerpt}"{reasoning.sourceLocation ? ` — ${reasoning.sourceLocation}` : ''}</div>}
      {reasoning.llmReasoning && <div style={S.reasoning}><strong>Why this was proposed:</strong> {reasoning.llmReasoning}</div>}
      <label style={S.checkboxLabel}>
        <input type="checkbox" checked={reasoningApproved} onChange={(e) => setReasoningApproved(e.target.checked)} />
        This reasoning was correct — worth remembering for similar cases
      </label>
      <div style={S.btnRow}>
        <button type="button" style={S.btn('navy', busy)} disabled={busy} onClick={acknowledge}>{busy ? 'Saving…' : 'Reviewed'}</button>
      </div>
    </div>
  );
}


const PACKAGE_KIND_LABELS = {
  package_field_conflict: 'Package differs from Career Master',
  package_new_bullet: 'New bullet variant',
  package_add_job: 'Add job',
  package_new_skill: 'New skill',
  package_new_tool: 'New tool',
  package_new_certification: 'New certification',
};

function packageTaskSummary(task) {
  const r = task.reasoning || {};
  if (task.taskType === 'package_field_conflict') return { title: `${r.company} - ${r.field === 'dates' ? 'dates' : 'job title'}`, before: r.before || '(empty)', after: r.after };
  if (task.taskType === 'package_new_bullet') return { title: `${r.company} (${r.jobTitle}) - bullet not in this job's library`, before: '(not in library)', after: r.text };
  if (task.taskType === 'package_new_skill' || task.taskType === 'package_new_tool' || task.taskType === 'package_new_certification') {
    const kind = task.taskType === 'package_new_skill' ? 'skill' : task.taskType === 'package_new_certification' ? 'certification' : 'tool';
    return { title: `${r.name} - ${kind} not in Career Master`, before: '(not in Career Master)', after: `${r.name}${kind === 'tool' ? ' - you will be asked how it was used before any output is finalized' : ''}` };
  }
  return { title: `${r.company} - ${r.title}`, before: '(not in Career Master)', after: `${r.title}, ${[r.startDate, r.endDate].filter(Boolean).join(' - ') || 'no dates'}${r.bullets?.length ? ` - ${r.bullets.length} bullet${r.bullets.length === 1 ? '' : 's'} added to its library` : ''}` };
}

function PackageTaskCard({ task, onDecided }) {
  const [busy, setBusy] = useState(false);
  const info = packageTaskSummary(task);
  const sources = (task.evidenceRefs || []).map((ref) => ref.label || ref.variant).filter(Boolean).join(', ');

  async function decide(method) {
    setBusy(true);
    try {
      const result = await api.resolveCareerReconciliationTask(task.id, { method });
      if (result.syncFailed) toast.error(`Applied to Career Master, but the Career Atom sync failed: ${result.syncError}. Use "Retry sync" below.`);
      else toast.success(method === 'approve' ? 'Applied to Career Master' : 'Rejected - Career Master unchanged');
      onDecided(task.id, result);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.card} data-testid={`package-task-${task.taskType}`}>
      <span style={S.packageTag}>{PACKAGE_KIND_LABELS[task.taskType]}</span>
      <div style={S.fieldName}>{info.title}</div>
      <div style={S.beforeAfter}>
        <div style={S.beforeBox}><div style={S.boxLabel}>Career Master now</div>{info.before}</div>
        <div style={{ alignSelf: 'center', color: '#888' }} aria-hidden="true">{'→'}</div>
        <div style={S.afterBox}><div style={S.boxLabel}>Package says</div>{info.after}</div>
      </div>
      <div style={S.sourceMeta}>From package {task.metadata?.packageKey}{sources ? ` (${sources})` : ''}</div>
      <div style={S.btnRow}>
        <button type="button" style={S.btn('gold', busy)} disabled={busy} onClick={() => decide('approve')}>Approve - apply to Career Master</button>
        <button type="button" style={S.btn('outline', busy)} disabled={busy} onClick={() => decide('reject')}>Reject - leave Career Master as is</button>
      </div>
    </div>
  );
}

function PackageImportCard({ onImported }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  async function readFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setText(await file.text()); setError(null); } catch (err) { setError(`Could not read the file: ${err.message}`); }
  }

  async function run() {
    setBusy(true); setError(null); setSummary(null);
    try {
      let pkg;
      try { pkg = JSON.parse(text); } catch (err) { throw new Error(`That is not valid JSON: ${err.message}`); }
      const result = await api.importCareerPackageSource(pkg);
      setSummary(result);
      toast.success(`Package filed - ${result.created} review task${result.created === 1 ? '' : 's'} raised`);
      onImported();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.card} data-testid="package-import-card">
      <div style={S.fieldName}>Import a tailored package as a source</div>
      <div style={S.reasoning}>Differences between the package's resumes and Career Master become review tasks below. Nothing changes in Career Master until you approve a task.</div>
      <input type="file" accept="application/json,.json" onChange={readFile} aria-label="Package JSON file" />
      <textarea style={S.dictateBox} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="...or paste package JSON here" aria-label="Package JSON" />
      <div style={S.btnRow}>
        <button type="button" style={S.btn('navy', busy || !text.trim())} disabled={busy || !text.trim()} onClick={run}>{busy ? 'Importing...' : 'Import and check against Career Master'}</button>
      </div>
      {error && <div role="alert" style={{ ...S.warnBox, marginTop: '0.6rem' }}>{error}</div>}
      {summary && (
        <div role="status" style={S.reasoning} data-testid="package-import-summary">
          Filed {summary.outputs.length} output{summary.outputs.length === 1 ? '' : 's'}; {summary.created} new task{summary.created === 1 ? '' : 's'}
          {summary.alreadyDecidedOrMerged ? `; ${summary.alreadyDecidedOrMerged} already decided or merged` : ''}.
        </div>
      )}
    </div>
  );
}

function ConvertSection({ openEditor, refreshKey }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.listCareerBoundConvertible()
      .then((r) => { if (!cancelled) { setItems(r.items || []); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function convert(item) {
    setBusyId(item.id); setNotice(null);
    try {
      const result = await api.convertToCareerBound(item.id);
      setNotice({ id: result.id, warnings: result.warnings || [] });
      toast.success('Created a career-bound draft');
    } catch (e) {
      toast.error(e.message);
      setNotice({ error: e.message });
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <div role="alert" style={S.warnBox}>Could not load imported resumes: {error}</div>;
  if (!items || !items.length) return null;
  return (
    <>
      <div style={S.groupTitle}>Imported resumes you can convert to career-bound</div>
      {items.map((item) => (
        <div key={item.id} style={S.card} data-testid="convertible-row">
          <div style={S.fieldName}>{item.name} <span style={S.sourceMeta}>({item.packageKey} / {item.variant})</span></div>
          {item.openTasks > 0 && <div style={S.reasoning}>{item.openTasks} review task{item.openTasks === 1 ? '' : 's'} for this package still need a decision before it can be converted.</div>}
          <div style={S.btnRow}>
            <button type="button" style={S.btn('navy', busyId === item.id || item.openTasks > 0)} disabled={busyId === item.id || item.openTasks > 0} onClick={() => convert(item)}>{busyId === item.id ? 'Converting...' : 'Convert to career-bound output'}</button>
          </div>
        </div>
      ))}
      {notice?.error && <div role="alert" style={S.warnBox}>{notice.error}</div>}
      {notice?.id && (
        <div role="status" style={S.banner} data-testid="convert-notice">
          Career-bound draft created.
          {notice.warnings.map((w, i) => <div key={i} style={{ marginTop: 4 }}>Note: {w}</div>)}
          <div style={S.btnRow}><button type="button" style={S.btn('gold')} onClick={() => openEditor(notice.id)}>Open the editor</button></div>
        </div>
      )}
    </>
  );
}

function SyncFailedSection({ refreshKey, onRetried }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api.listCareerReconciliationTasks('sync_failed')
      .then((r) => { if (!cancelled) { setItems(r.items || []); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function retry(task) {
    try {
      const r = await api.retryCareerTaskSync(task.id);
      if (r.syncFailed) toast.error(`Sync still failing: ${r.syncError}`); else toast.success('Career Atom sync completed');
      onRetried();
    } catch (e) { toast.error(e.message); }
  }

  if (error) return <div role="alert" style={S.warnBox}>Could not check for failed syncs: {error}</div>;
  if (!items || !items.length) return null;
  return (
    <>
      <div style={S.groupTitle}>Applied - sync failed ({items.length})</div>
      {items.map((task) => (
        <div key={task.id} style={S.warnBox} data-testid="sync-failed-row">
          <strong>{packageTaskSummary(task).title}</strong> was applied to Career Master, but its Career Atom sync failed: {task.metadata?.syncError?.message}
          <div style={S.btnRow}><button type="button" style={S.btn('navy')} onClick={() => retry(task)}>Retry sync</button></div>
        </div>
      ))}
    </>
  );
}

export default function CareerReconciliationPanel() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    try {
      const result = await api.listCareerReconciliationTasks();
      setTasks(result.items || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function onResolved(taskId) {
    setTasks((current) => (current || []).filter((t) => t.id !== taskId));
  }

  function onPackageDecided(taskId) {
    onResolved(taskId);
    setRefreshKey((k) => k + 1);
  }

  function reloadAll() {
    load();
    setRefreshKey((k) => k + 1);
  }

  if (error) return <div style={S.wrap}><div style={S.empty}>Failed to load: {error}</div></div>;
  if (tasks === null) return <div style={S.wrap}><div style={S.empty}>Loading…</div></div>;

  const conflicts = tasks.filter((t) => t.taskType === 'source_conflict');
  const ambiguous = tasks.filter((t) => t.taskType === 'ambiguous_mapping');
  const packageTasks = tasks.filter((t) => String(t.taskType).startsWith('package_'));

  return (
    <div style={S.wrap}>
      <div style={S.banner}>
        Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is picked
        automatically when sources disagree; review each item below and choose the correct source, or tell
        BestyStaff what the right value is.
      </div>
      <PackageImportCard onImported={reloadAll} />
      {tasks.length === 0 && <div style={S.empty}>Nothing needs review right now.</div>}
      {packageTasks.length > 0 && (
        <>
          <div style={S.groupTitle}>Tailored package vs Career Master ({packageTasks.length})</div>
          {packageTasks.map((task) => <PackageTaskCard key={task.id} task={task} onDecided={onPackageDecided} />)}
        </>
      )}
      <SyncFailedSection refreshKey={refreshKey} onRetried={() => setRefreshKey((k) => k + 1)} />
      <ConvertSection refreshKey={refreshKey} openEditor={setEditingId} />
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="dialog" aria-label="Career-bound output editor">
          <div style={{ background: 'white', color: '#1b2a3b', borderRadius: 10, padding: '1rem 1.25rem', width: 'min(1100px, 95vw)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" style={S.btn('outline')} onClick={() => setEditingId(null)}>Close</button></div>
            <CareerBoundOutputEditor projectionId={editingId} hideQueueLink onSaved={(r) => { if (r?.id && r.id !== editingId) setEditingId(r.id); }} />
          </div>
        </div>
      )}
      {conflicts.length > 0 && (
        <>
          <div style={S.groupTitle}>Source conflicts ({conflicts.length})</div>
          {conflicts.map((task) => <ConflictCard key={task.id} task={task} onResolved={onResolved} />)}
        </>
      )}
      {ambiguous.length > 0 && (
        <>
          <div style={S.groupTitle}>Ambiguous mappings ({ambiguous.length})</div>
          {ambiguous.map((task) => <AmbiguousCard key={task.id} task={task} onResolved={onResolved} />)}
        </>
      )}
    </div>
  );
}
