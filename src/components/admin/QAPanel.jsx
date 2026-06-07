// QA Panel — test scenarios + scripts + runs + defects.
//
// Form-driven by design. The brain-dump reconciler is a separate surface
// (lives in ScrumAgentPanel); this panel is the deterministic, sub-second,
// always-available way to author scenarios and log results.
//
// Layout: left rail of capability groups, right pane shows scenarios in the
// active group. Click a scenario → side drawer with steps + run history +
// "Log Test Run" button. "+ Add Scenario" opens a modal.

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const RESULT_META = {
  pass:    { label: 'Pass',    color: 'var(--sb-green)' },
  fail:    { label: 'Fail',    color: 'var(--sb-risk-critical)' },
  blocked: { label: 'Blocked', color: 'var(--sb-gold)' },
};

const ENV_OPTIONS = ['test', 'prod'];
const PRIORITY_OPTIONS = ['p0', 'p1', 'p2', 'p3'];
const ENV_SCOPE_OPTIONS = ['both', 'test', 'prod'];

export default function QAPanel() {
  const [groups, setGroups] = useState([]);
  const [backlogItems, setBacklogItems] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [latestRunByScenario, setLatestRunByScenario] = useState({});
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [scenarioDetail, setScenarioDetail] = useState(null); // {scenario, steps, latestRun}
  const [runsForSelected, setRunsForSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showRun, setShowRun] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [backlog, scList, runsList] = await Promise.all([
        api.getBacklog(),
        api.getScenarios(),
        api.getRuns(),
      ]);
      setGroups(backlog.groups || []);
      setBacklogItems(backlog.items || []);
      setScenarios(scList.scenarios || []);
      // Build latest-run-by-scenario map.
      const latest = {};
      for (const r of runsList.runs || []) {
        if (!latest[r.scenarioId]) latest[r.scenarioId] = r;
      }
      setLatestRunByScenario(latest);
    } catch (e) {
      toast('Failed to load QA data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, []);

  async function loadScenarioDetail(id) {
    try {
      const [detail, runs] = await Promise.all([
        api.getScenario(id),
        api.getRuns(id),
      ]);
      setScenarioDetail(detail);
      setRunsForSelected(runs.runs || []);
    } catch (e) {
      toast('Failed to load scenario: ' + e.message);
    }
  }
  useEffect(() => {
    if (selectedScenarioId) loadScenarioDetail(selectedScenarioId);
    else { setScenarioDetail(null); setRunsForSelected([]); }
  }, [selectedScenarioId]);

  const groupById = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  const counts = useMemo(() => {
    const c = { all: scenarios.length };
    for (const s of scenarios) {
      if (s.capabilityId) c[s.capabilityId] = (c[s.capabilityId] || 0) + 1;
    }
    return c;
  }, [scenarios]);

  const visibleScenarios = useMemo(() => {
    if (activeGroupId === 'all') return scenarios;
    if (activeGroupId === 'unassigned') return scenarios.filter((s) => !s.capabilityId);
    return scenarios.filter((s) => s.capabilityId === activeGroupId);
  }, [scenarios, activeGroupId]);

  return (
    <div style={S.shell}>
      {/* Left rail — capability groups */}
      <div style={S.rail}>
        <div style={S.railHeader}>Capabilities</div>
        <RailItem
          label="All scenarios"
          count={counts.all}
          active={activeGroupId === 'all'}
          onClick={() => setActiveGroupId('all')}
        />
        {groups.map((g) => (
          <RailItem
            key={g.id}
            label={g.name}
            color={g.color}
            count={counts[g.id] || 0}
            active={activeGroupId === g.id}
            onClick={() => setActiveGroupId(g.id)}
          />
        ))}
        <RailItem
          label="Unassigned"
          count={scenarios.filter((s) => !s.capabilityId).length}
          active={activeGroupId === 'unassigned'}
          onClick={() => setActiveGroupId('unassigned')}
        />
      </div>

      {/* Main pane — scenario list */}
      <div style={S.main}>
        <div style={S.mainHeader}>
          <div>
            <div style={S.title}>Test Scenarios</div>
            <div style={S.subtitle}>
              {loading ? 'Loading…' : `${visibleScenarios.length} scenario${visibleScenarios.length === 1 ? '' : 's'}`}
            </div>
          </div>
          <button style={S.primaryBtn} onClick={() => setShowAdd(true)}>+ Add Scenario</button>
        </div>

        {!loading && visibleScenarios.length === 0 && (
          <div style={S.empty}>
            <div style={S.emptyTitle}>No scenarios yet</div>
            <div style={S.emptyHint}>
              Add your first one — it'll be linked to a deployed feature in your backlog so failed runs auto-create defects.
            </div>
            <button style={S.primaryBtn} onClick={() => setShowAdd(true)}>+ Add Scenario</button>
          </div>
        )}

        <div style={S.scenarioList}>
          {visibleScenarios.map((s) => {
            const group = groupById[s.capabilityId];
            const latest = latestRunByScenario[s.id];
            return (
              <div
                key={s.id}
                style={{
                  ...S.scenarioCard,
                  borderLeft: `3px solid ${group?.color || 'var(--sb-taupe)'}`,
                  outline: selectedScenarioId === s.id ? '1px solid var(--sb-gold)' : 'none',
                }}
                onClick={() => setSelectedScenarioId(s.id)}
              >
                <div style={S.scenarioTitle}>{s.title}</div>
                <div style={S.scenarioMeta}>
                  {group && <span style={S.metaChip}>{group.name}</span>}
                  {s.priority && <span style={S.metaChip}>{s.priority.toUpperCase()}</span>}
                  <span style={S.metaChip}>env: {s.environmentScope}</span>
                  {latest ? (
                    <span style={{ ...S.statusChip, color: RESULT_META[latest.overallResult]?.color }}>
                      {RESULT_META[latest.overallResult]?.label || latest.overallResult}
                      <span style={S.muted}> · {new Date(latest.runAt).toLocaleDateString()}</span>
                    </span>
                  ) : (
                    <span style={{ ...S.statusChip, color: 'var(--sb-taupe)' }}>Untested</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right drawer — scenario detail */}
      {selectedScenarioId && scenarioDetail && (
        <div style={S.drawer}>
          <div style={S.drawerHeader}>
            <div>
              <div style={S.drawerTitle}>{scenarioDetail.scenario.title}</div>
              <div style={S.subtitle}>
                {groupById[scenarioDetail.scenario.capabilityId]?.name || 'Unassigned'}
              </div>
            </div>
            <button style={S.iconBtn} onClick={() => setSelectedScenarioId(null)}>×</button>
          </div>
          <div style={S.drawerBody}>
            {scenarioDetail.scenario.summary && (
              <Field label="Summary">{scenarioDetail.scenario.summary}</Field>
            )}
            {scenarioDetail.scenario.preconditions && (
              <Field label="Preconditions">{scenarioDetail.scenario.preconditions}</Field>
            )}

            <Field label={`Linked features (${(scenarioDetail.features || []).length})`}>
              {(scenarioDetail.features || []).length === 0 ? (
                <div style={S.muted}>No linked features. Defects from failed runs won't have a parent feature.</div>
              ) : (
                <ul style={{ ...S.runList, paddingLeft: 0, listStyle: 'none' }}>
                  {scenarioDetail.features.map((f) => {
                    const item = backlogItems.find((b) => b.id === f.backlogItemId);
                    return (
                      <li key={f.backlogItemId} style={S.runItem}>
                        {f.isPrimary && <span style={{ color: 'var(--sb-gold)', marginRight: 6 }}>★</span>}
                        <span>#{f.backlogItemId} · {item?.title || '(missing)'}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Field>

            <Field label={`Steps (${scenarioDetail.steps.length})`}>
              {scenarioDetail.steps.length === 0 ? (
                <div style={S.muted}>No steps yet. Add some so testers know what to do.</div>
              ) : (
                <ol style={S.stepList}>
                  {scenarioDetail.steps.map((st) => (
                    <li key={st.id} style={S.stepItem}>
                      <div style={S.stepAction}>{st.action}</div>
                      <div style={S.stepExpected}>Expected: {st.expectedOutcome}</div>
                    </li>
                  ))}
                </ol>
              )}
            </Field>

            <Field label={`Run history (${runsForSelected.length})`}>
              {runsForSelected.length === 0 ? (
                <div style={S.muted}>No runs yet.</div>
              ) : (
                <ul style={S.runList}>
                  {runsForSelected.slice(0, 10).map((r) => (
                    <li key={r.id} style={S.runItem}>
                      <span style={{ color: RESULT_META[r.overallResult]?.color, fontWeight: 600 }}>
                        {RESULT_META[r.overallResult]?.label}
                      </span>
                      <span style={S.muted}> · {r.environment} · {new Date(r.runAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Field>

            <button
              style={{ ...S.primaryBtn, width: '100%', marginTop: '1rem' }}
              disabled={scenarioDetail.steps.length === 0}
              onClick={() => setShowRun(true)}
            >
              Log Test Run
            </button>
            {scenarioDetail.steps.length === 0 && (
              <div style={S.muted}>Add at least one step before logging a run.</div>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <AddScenarioModal
          groups={groups}
          backlogItems={backlogItems}
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            await loadAll();
          }}
        />
      )}

      {showRun && scenarioDetail && (
        <LogRunModal
          scenario={scenarioDetail.scenario}
          steps={scenarioDetail.steps}
          onClose={() => setShowRun(false)}
          onSaved={async (result) => {
            setShowRun(false);
            if (result?.createdDefects?.length) {
              toast(`Run logged · ${result.createdDefects.length} defect${result.createdDefects.length === 1 ? '' : 's'} created in backlog`);
            } else {
              toast('Run logged');
            }
            await loadAll();
            await loadScenarioDetail(selectedScenarioId);
          }}
        />
      )}
    </div>
  );
}

// ── Modal: Add Scenario ──
function AddScenarioModal({ groups, backlogItems, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [capabilityId, setCapabilityId] = useState('');
  // Multi-select: a scenario can cover multiple deployed features. One is marked
  // as primary — that's the one auto-created defects parent to.
  const [featureIds, setFeatureIds] = useState([]);
  const [primaryFeatureId, setPrimaryFeatureId] = useState(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [environmentScope, setEnvironmentScope] = useState('both');
  const [priority, setPriority] = useState('p2');
  const [steps, setSteps] = useState([{ action: '', expectedOutcome: '' }]);
  const [saving, setSaving] = useState(false);

  // Filter backlog items: deployed features (the testable surface), optionally
  // scoped to the chosen capability, optionally filtered by a search box.
  const candidateBacklogItems = useMemo(() => {
    let list = backlogItems.filter((it) => it.status !== 'archived' && it.kind === 'feature');
    if (capabilityId) list = list.filter((it) => it.capabilityId === Number(capabilityId));
    const q = featureSearch.trim().toLowerCase();
    if (q) list = list.filter((it) => (it.title || '').toLowerCase().includes(q));
    return list.slice(0, 200); // cap render for very large backlogs
  }, [backlogItems, capabilityId, featureSearch]);

  function toggleFeature(id) {
    setFeatureIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      // If we just removed the primary, promote the first remaining.
      if (has && primaryFeatureId === id) {
        setPrimaryFeatureId(next[0] ?? null);
      }
      // If nothing was primary yet and we just added one, make it primary.
      if (!has && primaryFeatureId == null) {
        setPrimaryFeatureId(id);
      }
      return next;
    });
  }

  function updateStep(idx, patch) {
    setSteps((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  }
  function addStep() {
    setSteps((s) => [...s, { action: '', expectedOutcome: '' }]);
  }
  function removeStep(idx) {
    setSteps((s) => s.filter((_, i) => i !== idx));
  }

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return toast('Title is required');
    const cleanSteps = steps
      .map((s) => ({ action: s.action.trim(), expectedOutcome: s.expectedOutcome.trim() }))
      .filter((s) => s.action && s.expectedOutcome);
    setSaving(true);
    try {
      await api.createScenario({
        title: title.trim(),
        summary: summary.trim() || null,
        preconditions: preconditions.trim() || null,
        capabilityId: capabilityId ? Number(capabilityId) : null,
        featureBacklogItemIds: featureIds,
        primaryBacklogItemId: primaryFeatureId,
        environmentScope,
        priority,
        steps: cleanSteps,
      });
      onSaved();
    } catch (e) {
      toast('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Add Scenario" onClose={onClose} wide>
      <form onSubmit={submit} style={S.form}>
        <Field label="Title *">
          <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lead can sign up with email + phone" />
        </Field>
        <Field label="Summary">
          <input style={S.input} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One-line description" />
        </Field>
        <Field label="Preconditions">
          <textarea
            style={{ ...S.input, minHeight: 60 }}
            value={preconditions}
            onChange={(e) => setPreconditions(e.target.value)}
            placeholder="What needs to be true before this can run? (e.g., test email account, fresh browser session)"
          />
        </Field>
        <Field label="Capability">
          <select style={S.input} value={capabilityId} onChange={(e) => { setCapabilityId(e.target.value); setFeatureIds([]); setPrimaryFeatureId(null); }}>
            <option value="">— None —</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>

        <Field label={`Linked features (${featureIds.length} selected)`}>
          <div style={S.muted}>
            Pick every deployed feature this scenario exercises. Mark one as <strong>primary</strong> — failed-step defects parent to it.
          </div>
          <input
            style={{ ...S.input, marginTop: '0.5rem' }}
            placeholder="Search backlog items…"
            value={featureSearch}
            onChange={(e) => setFeatureSearch(e.target.value)}
          />
          <div style={S.featurePicker}>
            {candidateBacklogItems.length === 0 ? (
              <div style={{ ...S.muted, padding: '0.5rem' }}>
                {capabilityId ? 'No feature backlog items in this capability.' : 'No matching backlog items.'}
              </div>
            ) : (
              candidateBacklogItems.map((it) => {
                const checked = featureIds.includes(it.id);
                const isPrimary = primaryFeatureId === it.id;
                return (
                  <div key={it.id} style={S.featureRow}>
                    <label style={S.featureCheck}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFeature(it.id)}
                      />
                      <span style={S.featureTitle}>#{it.id} · {it.title}</span>
                    </label>
                    {checked && (
                      <label style={{ ...S.primaryRadio, color: isPrimary ? 'var(--sb-gold)' : 'var(--sb-taupe)' }}>
                        <input
                          type="radio"
                          name="primary-feature"
                          checked={isPrimary}
                          onChange={() => setPrimaryFeatureId(it.id)}
                        />
                        {isPrimary ? '★ primary' : 'set primary'}
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Field>
        <div style={S.row}>
          <Field label="Environment scope">
            <select style={S.input} value={environmentScope} onChange={(e) => setEnvironmentScope(e.target.value)}>
              {ENV_SCOPE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select style={S.input} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
            </select>
          </Field>
        </div>

        <Field label={`Steps (${steps.length})`}>
          <div style={S.muted}>Each row is one tester action with the expected outcome. Failed steps will auto-create defects.</div>
          {steps.map((st, i) => (
            <div key={i} style={S.stepRow}>
              <div style={S.stepRowNumber}>{i + 1}</div>
              <div style={S.stepRowInputs}>
                <input
                  style={S.input}
                  placeholder="Action — what does the tester do?"
                  value={st.action}
                  onChange={(e) => updateStep(i, { action: e.target.value })}
                />
                <input
                  style={S.input}
                  placeholder="Expected outcome — what should happen?"
                  value={st.expectedOutcome}
                  onChange={(e) => updateStep(i, { expectedOutcome: e.target.value })}
                />
              </div>
              {steps.length > 1 && (
                <button type="button" style={S.iconBtn} onClick={() => removeStep(i)}>×</button>
              )}
            </div>
          ))}
          <button type="button" style={S.secondaryBtn} onClick={addStep}>+ Add step</button>
        </Field>

        <div style={S.modalFooter}>
          <button type="button" style={S.secondaryBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" style={S.primaryBtn} disabled={saving}>{saving ? 'Saving…' : 'Save Scenario'}</button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Modal: Log Test Run ──
function LogRunModal({ scenario, steps, onClose, onSaved }) {
  const [environment, setEnvironment] = useState('test');
  const [overallNotes, setOverallNotes] = useState('');
  const [stepResults, setStepResults] = useState(() =>
    steps.map((s) => ({ stepId: s.id, result: '', notes: '', evidenceUrl: '' }))
  );
  const [saving, setSaving] = useState(false);

  function updateResult(idx, patch) {
    setStepResults((r) => r.map((sr, i) => (i === idx ? { ...sr, ...patch } : sr)));
  }

  const allAnswered = stepResults.every((sr) => sr.result);
  const failCount = stepResults.filter((sr) => sr.result === 'fail').length;

  async function submit(e) {
    e.preventDefault();
    if (!allAnswered) return toast('Mark a result for every step');
    setSaving(true);
    try {
      const result = await api.logRun({
        scenarioId: scenario.id,
        environment,
        notes: overallNotes.trim() || null,
        stepResults: stepResults.map((sr) => ({
          stepId: sr.stepId,
          result: sr.result,
          notes: sr.notes.trim() || null,
          evidenceUrl: sr.evidenceUrl.trim() || null,
        })),
      });
      onSaved(result);
    } catch (e) {
      toast('Submit failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={`Log Test Run · ${scenario.title}`} onClose={onClose} wide>
      <form onSubmit={submit} style={S.form}>
        <div style={S.row}>
          <Field label="Environment">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {ENV_OPTIONS.map((v) => (
                <label key={v} style={{
                  ...S.envChip,
                  borderColor: environment === v ? 'var(--sb-gold)' : 'rgba(196,132,58,0.25)',
                  background: environment === v ? 'rgba(196,132,58,0.15)' : 'transparent',
                }}>
                  <input
                    type="radio"
                    name="env"
                    value={v}
                    checked={environment === v}
                    onChange={() => setEnvironment(v)}
                    style={{ display: 'none' }}
                  />
                  {v.toUpperCase()}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div style={{ ...S.muted, marginTop: '0.5rem' }}>
          Mark each step pass / fail / blocked. Failed steps auto-create defects tied to this scenario.
        </div>

        {steps.map((st, i) => {
          const sr = stepResults[i];
          return (
            <div key={st.id} style={S.runStepBlock}>
              <div style={S.runStepHeader}>
                <strong>Step {st.stepOrder}</strong> — {st.action}
                <div style={S.stepExpected}>Expected: {st.expectedOutcome}</div>
              </div>
              <div style={S.resultRow}>
                {['pass', 'fail', 'blocked'].map((v) => (
                  <label key={v} style={{
                    ...S.resultChip,
                    borderColor: sr.result === v ? RESULT_META[v].color : 'rgba(196,132,58,0.25)',
                    background: sr.result === v ? 'rgba(196,132,58,0.10)' : 'transparent',
                    color: sr.result === v ? RESULT_META[v].color : 'var(--sb-cream)',
                  }}>
                    <input
                      type="radio"
                      name={`r-${st.id}`}
                      value={v}
                      checked={sr.result === v}
                      onChange={() => updateResult(i, { result: v })}
                      style={{ display: 'none' }}
                    />
                    {RESULT_META[v].label}
                  </label>
                ))}
              </div>
              <input
                style={{ ...S.input, fontSize: '0.85rem' }}
                placeholder="Notes for this step (what actually happened?)"
                value={sr.notes}
                onChange={(e) => updateResult(i, { notes: e.target.value })}
              />
              <input
                style={{ ...S.input, fontSize: '0.85rem' }}
                placeholder="Evidence URL (screenshot, log link) — optional"
                value={sr.evidenceUrl}
                onChange={(e) => updateResult(i, { evidenceUrl: e.target.value })}
              />
            </div>
          );
        })}

        <Field label="Overall notes (optional)">
          <textarea
            style={{ ...S.input, minHeight: 60 }}
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Anything about the run as a whole"
          />
        </Field>

        {failCount > 0 && (
          <div style={S.warningBox}>
            ⚠ {failCount} step{failCount === 1 ? '' : 's'} marked failed — that many defects will be created in the backlog on submit.
          </div>
        )}

        <div style={S.modalFooter}>
          <button type="button" style={S.secondaryBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" style={S.primaryBtn} disabled={saving || !allAnswered}>
            {saving ? 'Submitting…' : 'Submit Run'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Small reusable bits ──
function RailItem({ label, count, color, active, onClick }) {
  return (
    <div
      style={{
        ...S.railItem,
        background: active ? 'rgba(196,132,58,0.12)' : 'transparent',
        borderLeft: color ? `3px solid ${color}` : '3px solid transparent',
      }}
      onClick={onClick}
    >
      <span>{label}</span>
      <span style={S.muted}>{count}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={S.field}>
      <div style={S.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

function ModalShell({ title, onClose, wide, children }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div
        style={{ ...S.modal, width: wide ? 720 : 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={S.modalHeader}>
          <div style={S.modalTitle}>{title}</div>
          <button style={S.iconBtn} onClick={onClose}>×</button>
        </div>
        <div style={S.modalBody}>{children}</div>
      </div>
    </div>
  );
}

// ── Inline styles ──
// Co-located to match the surrounding admin panels' convention.
const S = {
  shell: { display: 'flex', height: '100%', background: 'var(--sb-navy)', color: 'var(--sb-cream)' },
  rail: { width: 220, flexShrink: 0, padding: '1rem 0.5rem', borderRight: '0.5px solid rgba(196,132,58,0.18)', overflowY: 'auto' },
  railHeader: { fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', padding: '0 0.75rem', marginBottom: '0.5rem' },
  railItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem', marginBottom: 2 },
  main: { flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { fontFamily: 'var(--sb-font-display)', fontSize: '1.5rem' },
  subtitle: { fontSize: '0.85rem', color: 'var(--sb-taupe)' },
  scenarioList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  scenarioCard: { padding: '0.75rem 1rem', background: 'var(--sb-navy-deep)', borderRadius: 4, cursor: 'pointer', borderLeft: '3px solid transparent' },
  scenarioTitle: { fontWeight: 600, marginBottom: '0.3rem' },
  scenarioMeta: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' },
  metaChip: { padding: '0.15rem 0.5rem', background: 'rgba(196,132,58,0.10)', borderRadius: 999, color: 'var(--sb-cream)' },
  statusChip: { padding: '0.15rem 0.5rem', background: 'rgba(196,132,58,0.10)', borderRadius: 999, fontWeight: 600 },
  muted: { color: 'var(--sb-taupe)', fontSize: '0.8rem' },

  empty: { textAlign: 'center', padding: '3rem 1rem', border: '1px dashed rgba(196,132,58,0.25)', borderRadius: 4, marginBottom: '1.5rem' },
  emptyTitle: { fontSize: '1.1rem', marginBottom: '0.5rem' },
  emptyHint: { color: 'var(--sb-taupe)', marginBottom: '1rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' },

  drawer: { width: 420, flexShrink: 0, background: 'var(--sb-navy-deep)', borderLeft: '0.5px solid rgba(196,132,58,0.25)', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.18)' },
  drawerTitle: { fontFamily: 'var(--sb-font-display)', fontSize: '1.1rem', marginBottom: '0.25rem' },
  drawerBody: { padding: '1rem 1.25rem' },

  field: { marginBottom: '1rem' },
  fieldLabel: { fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 4, color: 'var(--sb-cream)', fontFamily: 'inherit', fontSize: '0.9rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  form: { display: 'flex', flexDirection: 'column' },

  stepList: { paddingLeft: '1.25rem', margin: 0 },
  stepItem: { marginBottom: '0.5rem' },
  stepAction: { fontWeight: 500 },
  stepExpected: { fontSize: '0.8rem', color: 'var(--sb-taupe)', marginTop: '0.15rem' },

  stepRow: { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' },
  stepRowNumber: { width: 24, height: 24, borderRadius: '50%', background: 'rgba(196,132,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' },
  stepRowInputs: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },

  runList: { listStyle: 'none', padding: 0, margin: 0 },
  runItem: { padding: '0.4rem 0', fontSize: '0.85rem', borderBottom: '0.5px dashed rgba(196,132,58,0.12)' },

  runStepBlock: { padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 4, marginBottom: '0.75rem' },
  runStepHeader: { marginBottom: '0.5rem' },
  resultRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' },
  resultChip: { padding: '0.3rem 0.8rem', borderRadius: 4, border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 },
  envChip: { padding: '0.4rem 1rem', borderRadius: 4, border: '1px solid', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },

  warningBox: { padding: '0.75rem', background: 'rgba(196,132,58,0.15)', border: '0.5px solid var(--sb-gold)', borderRadius: 4, fontSize: '0.85rem', margin: '0.5rem 0' },

  featurePicker: { maxHeight: 240, overflowY: 'auto', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 4, marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)' },
  featureRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', borderBottom: '0.5px dashed rgba(196,132,58,0.10)', fontSize: '0.85rem' },
  featureCheck: { display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, cursor: 'pointer' },
  featureTitle: { color: 'var(--sb-cream)' },
  primaryRadio: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer' },

  primaryBtn: { padding: '0.6rem 1.25rem', background: 'var(--sb-gold)', color: 'var(--sb-navy)', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' },
  secondaryBtn: { padding: '0.6rem 1.25rem', background: 'transparent', color: 'var(--sb-cream)', border: '0.5px solid rgba(196,132,58,0.4)', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' },
  iconBtn: { width: 28, height: 28, padding: 0, background: 'transparent', color: 'var(--sb-cream)', border: 'none', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--sb-navy-deep)', borderRadius: 6, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '0.5px solid rgba(196,132,58,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.18)' },
  modalTitle: { fontFamily: 'var(--sb-font-display)', fontSize: '1.1rem' },
  modalBody: { padding: '1.25rem', overflowY: 'auto' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid rgba(196,132,58,0.18)' },
};
