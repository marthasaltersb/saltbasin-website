import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import CareerMappingPreview from './CareerMappingPreview.jsx';

const INTAKE_KINDS = [
  { value: 'initial_mapping', label: 'Initial Career Master mapping' },
  { value: 'additional_context', label: 'Additional context documentation' },
  { value: 'case_study_portfolio', label: 'Case study portfolio upload' },
];

const SOURCE_TRUTH = [
  { value: 'source_of_truth', label: 'Source of truth' },
  { value: 'primary_validated', label: 'Primary resource documentation validated' },
  { value: 'user_attested', label: 'User-attested context' },
  { value: 'synthetic_scenario', label: 'Synthetic scenario patterns' },
];

const SOURCE_USE = [
  { value: 'career_master_and_outputs', label: 'Career Master, resume, and portfolio outputs' },
  { value: 'career_master_only', label: 'Career Master mapping only' },
  { value: 'case_studies_only', label: 'Case study portfolio only' },
  { value: 'agent_context_only', label: 'Agent context only' },
];

const CLIENT_POLICIES = [
  { value: 'generalize_private_clients', label: 'Generalize private clients by industry and company type' },
  { value: 'approved_names_only', label: 'Use only names explicitly approved for public output' },
  { value: 'public_or_portfolio_allowed', label: 'Allow public, portfolio, PE, VC, or exit names supplied by user' },
];

const PORTFOLIO_POLICIES = [
  { value: 'allow_if_user_provided', label: 'Allow if user provided and did not restrict it' },
  { value: 'generalize_all', label: 'Generalize all portfolio company names' },
  { value: 'approved_names_only', label: 'Use only explicitly approved names' },
];

const CASE_TITLE_POLICIES = [
  { value: 'industry_company_type', label: 'Industry and company-type headline' },
  { value: 'employer_initiative', label: 'Employer initiative with generalized project title' },
  { value: 'approved_public_name', label: 'Use approved public/portfolio name when supplied' },
];

const S = {
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' },
  title: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.25rem' },
  sub: { fontSize: '0.78rem', color: '#666', lineHeight: 1.55, marginBottom: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' },
  label: { display: 'block', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#777', marginBottom: '0.25rem' },
  input: { width: '100%', boxSizing: 'border-box', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 7, padding: '0.48rem 0.65rem', fontSize: '0.8rem', fontFamily: 'inherit', background: 'white' },
  textarea: { width: '100%', minHeight: 76, boxSizing: 'border-box', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 7, padding: '0.55rem 0.65rem', fontSize: '0.8rem', fontFamily: 'inherit', resize: 'vertical' },
  btn: (tone = 'outline') => ({
    padding: '0.5rem 0.9rem',
    borderRadius: 8,
    border: tone === 'outline' ? '0.5px solid rgba(0,0,0,0.18)' : 'none',
    cursor: 'pointer',
    fontSize: '0.76rem',
    fontFamily: 'var(--sb-font-label)',
    letterSpacing: '0.04em',
    background: tone === 'gold' ? 'var(--sb-gold, #c4843a)' : tone === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'white',
    color: tone === 'gold' || tone === 'navy' ? 'white' : '#333',
  }),
  pill: { display: 'inline-flex', padding: '0.15rem 0.45rem', borderRadius: 999, background: 'rgba(2,161,166,0.08)', color: '#027b80', fontSize: '0.66rem', fontWeight: 700 },
};

function SelectField({ label, value, onChange, options }) {
  return (
    <label>
      <span style={S.label}>{label}</span>
      <select style={S.input} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.76rem', color: '#444', lineHeight: 1.45 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 2, accentColor: 'var(--sb-gold, #c4843a)' }}
      />
      <span>{children}</span>
    </label>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CareerIntakePanel({ compact = false, onPrimaryResumeCreated }) {
  const [docs, setDocs] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [syncingMetadata, setSyncingMetadata] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [analysisPreview, setAnalysisPreview] = useState(null);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    intakeKind: 'initial_mapping',
    sourceTruthStatus: 'user_attested',
    sourceUseScope: 'career_master_and_outputs',
    clientNamePolicy: 'generalize_private_clients',
    portfolioNamePolicy: 'allow_if_user_provided',
    caseStudyTitlePolicy: 'industry_company_type',
    publicPrimaryResearch: true,
    primaryResumeRequested: true,
    analysisPassesRequested: 3,
    uploadNotes: '',
    redactionAck: false,
    publicOutputValidationAck: false,
    noPrivateNamePersistenceAck: false,
  });

  const requiredAcksReady = form.redactionAck && form.publicOutputValidationAck && form.noPrivateNamePersistenceAck;

  async function load() {
    setLoading(true);
    try {
      const [docData, runData] = await Promise.all([
        api.listCareerIntakeDocuments(),
        api.listCareerIntakeRuns(),
      ]);
      const nextDocs = docData.items || [];
      setDocs(nextDocs);
      setRuns(runData.items || []);
      setSelectedIds((ids) => ids.length ? ids.filter((id) => nextDocs.some((doc) => doc.id === id)) : nextDocs.map((doc) => doc.id));
    } catch (e) {
      toast('Failed to load Career Master intake: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!runningId) return undefined;
    const timer = setInterval(() => setThinkingStep((step) => (step + 1) % 4), 1400);
    return () => clearInterval(timer);
  }, [runningId]);

  const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadDocument() {
    if (!file) {
      toast('Choose a file first');
      return;
    }
    if (!requiredAcksReady) {
      toast('Complete the redaction and public-output acknowledgements first');
      return;
    }

    const payload = new FormData();
    payload.append('file', file);
    Object.entries(form).forEach(([key, value]) => payload.append(key, String(value)));

    setUploading(true);
    try {
      const result = await api.uploadCareerIntakeDocument(payload);
      const item = result.item;
      setDocs((current) => [item, ...current]);
      setSelectedIds((current) => [item.id, ...current.filter((id) => id !== item.id)]);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast('Career Master source uploaded');
    } catch (e) {
      toast('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  async function queueRun() {
    setQueuing(true);
    try {
      const result = await api.createCareerIntakeRun({
        documentIds: selectedIds,
        runKind: 'career_master_mapping',
        analysisPassesRequested: form.analysisPassesRequested,
        primaryResumeRequested: form.primaryResumeRequested,
        publicPrimaryResearch: form.publicPrimaryResearch,
      });
      setRuns((current) => [result.item, ...current]);
      if (result.primaryResume && onPrimaryResumeCreated) onPrimaryResumeCreated(result.primaryResume);
      toast(result.primaryResume ? 'Analysis queued and primary resume preset refreshed' : 'Analysis queued');
    } catch (e) {
      toast('Queue failed: ' + e.message);
    } finally {
      setQueuing(false);
    }
  }

  async function syncSiteMetadata() {
    setSyncingMetadata(true);
    try {
      const result = await api.syncCareerSiteMetadata();
      toast(`Synced Career Master metadata on ${result.updatedSections || 0} draft section${result.updatedSections === 1 ? '' : 's'}`);
    } catch (e) {
      toast('Metadata sync failed: ' + e.message);
    } finally {
      setSyncingMetadata(false);
    }
  }

  async function runAnalysis(run) {
    setRunningId(run.id);
    setThinkingStep(0);
    setRuns((current) => current.map((item) => item.id === run.id ? { ...item, status: 'running' } : item));
    try {
      const result = await api.runCareerIntakeAnalysis(run.id);
      setAnalysisPreview(result);
      setRuns((current) => current.map((item) => item.id === run.id ? { ...item, status: 'completed', summary: `Analysis completed. Review the proposed mappings below.` } : item));
      if (result.sourceErrors?.length) toast(`${result.sourceErrors.length} source${result.sourceErrors.length === 1 ? '' : 's'} could not be analyzed`);
    } catch (e) {
      setRuns((current) => current.map((item) => item.id === run.id ? { ...item, status: 'failed', summary: e.message } : item));
      toast('Analysis failed: ' + e.message);
    } finally {
      setRunningId(null);
    }
  }

  function toggleDoc(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div style={S.card}>
      <div style={S.title}>Career Master Intake</div>
      <div style={S.sub}>
        Upload redacted source documents for initial mapping, additional context, or case study portfolio material. Do not enter private client names into notes. If private names appear in a source, the default captured case study title is generalized by industry and company type; the user must validate that volunteered names do not transfer into public outputs.
      </div>

      <div style={S.grid}>
        <SelectField label="Intake type" value={form.intakeKind} onChange={(v) => update('intakeKind', v)} options={INTAKE_KINDS} />
        <SelectField label="Source status" value={form.sourceTruthStatus} onChange={(v) => update('sourceTruthStatus', v)} options={SOURCE_TRUTH} />
        <SelectField label="Use scope" value={form.sourceUseScope} onChange={(v) => update('sourceUseScope', v)} options={SOURCE_USE} />
        <SelectField label="Client-name handling" value={form.clientNamePolicy} onChange={(v) => update('clientNamePolicy', v)} options={CLIENT_POLICIES} />
        <SelectField label="Portfolio-name handling" value={form.portfolioNamePolicy} onChange={(v) => update('portfolioNamePolicy', v)} options={PORTFOLIO_POLICIES} />
        <SelectField label="Case-study title policy" value={form.caseStudyTitlePolicy} onChange={(v) => update('caseStudyTitlePolicy', v)} options={CASE_TITLE_POLICIES} />
        <label>
          <span style={S.label}>Analysis passes</span>
          <input
            type="number"
            min="1"
            max="5"
            style={S.input}
            value={form.analysisPassesRequested}
            onChange={(e) => update('analysisPassesRequested', Math.max(1, Math.min(5, Number(e.target.value) || 3)))}
          />
        </label>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <span style={S.label}>Handling notes, no private names</span>
        <textarea
          style={S.textarea}
          value={form.uploadNotes}
          onChange={(e) => update('uploadNotes', e.target.value)}
          placeholder="Example: Focus on revenue operations skills, implementation scale, deal context, and measurable outcomes. Use generalized client names."
        />
      </div>

      <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.75rem' }}>
        <Check checked={form.redactionAck} onChange={(v) => update('redactionAck', v)}>
          I have uploaded redacted information where needed and understand the upload may be used as agent context.
        </Check>
        <Check checked={form.noPrivateNamePersistenceAck} onChange={(v) => update('noPrivateNamePersistenceAck', v)}>
          I will not type private client names into metadata or notes; private names to remove should not be persisted in Salt Basin.
        </Check>
        <Check checked={form.publicOutputValidationAck} onChange={(v) => update('publicOutputValidationAck', v)}>
          I am responsible for validating that private client names do not appear in public-facing objects or outputs.
        </Check>
        <Check checked={form.publicPrimaryResearch} onChange={(v) => update('publicPrimaryResearch', v)}>
          Allow research against public primary sources where useful.
        </Check>
        <Check checked={form.primaryResumeRequested} onChange={(v) => update('primaryResumeRequested', v)}>
          Auto-generate or refresh a default Primary Resume preset using Career Master sections.
        </Check>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
        <input
          ref={fileRef}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.rtf,.jpg,.jpeg,.png,.webp"
          style={{ fontSize: '0.78rem' }}
        />
        <button type="button" style={S.btn('gold')} onClick={uploadDocument} disabled={uploading || !file || !requiredAcksReady}>
          {uploading ? 'Uploading...' : 'Upload Source'}
        </button>
        <button type="button" style={S.btn('navy')} onClick={queueRun} disabled={queuing || loading}>
          {queuing ? 'Queueing...' : `Queue ${form.analysisPassesRequested} Analysis Passes`}
        </button>
        <button type="button" style={S.btn('outline')} onClick={syncSiteMetadata} disabled={syncingMetadata}>
          {syncingMetadata ? 'Syncing...' : 'Sync Site Metadata'}
        </button>
      </div>

      {!compact && (
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          <div>
            <div style={S.label}>Uploaded sources ({docs.length})</div>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {loading && <div style={{ fontSize: '0.78rem', color: '#888' }}>Loading...</div>}
              {!loading && docs.length === 0 && <div style={{ fontSize: '0.78rem', color: '#888' }}>No sources uploaded yet.</div>}
              {docs.slice(0, 6).map((doc) => (
                <label key={doc.id} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8, alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleDoc(doc.id)} style={{ marginTop: 2 }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#333', overflowWrap: 'anywhere' }}>{doc.originalFilename}</span>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#888' }}>{doc.intakeKind} - {doc.sourceTruthStatus} - {formatBytes(doc.fileSize)}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={S.label}>Queued analysis ({runs.length})</div>
            {runningId && (
              <div className="career-analysis-thinking" role="status" aria-live="polite">
                <div className="career-analysis-orbit" aria-hidden="true">
                  <span className="career-analysis-core" />
                  <span className="career-analysis-ring ring-one"><i /></span>
                  <span className="career-analysis-ring ring-two"><i /></span>
                  <span className="career-analysis-ring ring-three"><i /></span>
                </div>
                <div>
                  <div className="career-analysis-thinking-title">Analyzing your Career Orbit</div>
                  <div className="career-analysis-thinking-step">{[
                    'Reading attached source evidence…',
                    'Identifying roles, skills, tools, outcomes, and case studies…',
                    'Bonding source facts to Career Master fields…',
                    'Preparing an editable provenance preview…',
                  ][thinkingStep]}</div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {runs.length === 0 && <div style={{ fontSize: '0.78rem', color: '#888' }}>No analysis runs queued yet.</div>}
              {runs.slice(0, 5).map((run) => (
                <div key={run.id} style={{ padding: '0.55rem', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={S.pill}>{run.status}</span>
                    <span style={{ fontSize: '0.72rem', color: '#666' }}>{run.analysisPassesRequested} passes, {run.documentIds?.length || 0} sources</span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#555', lineHeight: 1.45 }}>{run.summary}</div>
                  {(run.status === 'queued' || run.status === 'failed') && (
                    <button type="button" style={{ ...S.btn('gold'), marginTop: '0.5rem' }} disabled={!!runningId} onClick={() => runAnalysis(run)}>
                      {runningId === run.id ? 'Analyzing…' : run.status === 'failed' ? 'Run Analysis Again' : 'Run Analysis'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {compact && docs.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.74rem', color: '#666' }}>
          {docs.length} uploaded source{docs.length === 1 ? '' : 's'} available. {selectedCount} selected for the next analysis run.
        </div>
      )}

      {analysisPreview && !runningId && (
        <CareerMappingPreview
          proposal={analysisPreview.proposal}
          source={analysisPreview.source}
          sheetWarnings={analysisPreview.sheetWarnings}
          onCancel={() => setAnalysisPreview(null)}
          onCommitted={() => { setAnalysisPreview(null); load(); }}
        />
      )}
    </div>
  );
}
