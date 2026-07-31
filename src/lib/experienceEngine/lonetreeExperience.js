// Experience Engine v1 (2026-07-29) — per Betsy's Interaction Layer feedback:
// a first-class layer between the semantic runtime (the Lonetree demo API
// payloads) and React components. It owns NO business logic — every number
// here is computed server-side by lonetreeReconciliation.js. Its only job is
// answering orchestration questions: what is the current focus object, which
// highway stages highlight, which related objects illuminate, what the
// Inspector shows, and what breadcrumb applies. Components render its
// answers; they never decide them.
//
// Focus shape: { kind: 'stage'|'metric'|'thesis'|'signal'|'target'|'initiative', id }
// (id = stage key / metric key / thesisId / signalId / targetId / initiativeId)

const fmtUsd = (n) => (n === null || n === undefined ? '—' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
const fmtPct = (n) => (n === null || n === undefined ? '—' : `${(Number(n) * 100).toFixed(1)}%`);
const fmtX = (n) => (n === null || n === undefined ? '—' : `${Number(n).toFixed(2)}x`);

export const STAGE_ORDER = ['commercial', 'operational', 'financial', 'enterprise-value', 'recommendations'];

export const STAGE_DEFS = {
  commercial: {
    label: 'Commercial',
    purpose: 'Where the deal originates — acquisition targets screened, investment theses formed, contracts monetized.',
    definition: 'Fund-rod evidence: market_target and investment_thesis molecules. PortCo invoicing rolls up into this journey.',
  },
  operational: {
    label: 'Operational',
    purpose: 'The business actually running — usage observed at the source systems before any accounting happens.',
    definition: 'PortCo-rod evidence: commercial_usage_event molecules, plus the open signals derived from them.',
  },
  financial: {
    label: 'Financial',
    purpose: 'Usage converted to money — invoices raised, revenue recognized, GL double-entry proven.',
    definition: 'MET-001/002/003 computed over commercial_invoice, commercial_revenue_schedule, and commercial_gl_entry evidence.',
  },
  'enterprise-value': {
    label: 'Enterprise Value',
    purpose: 'What the business is worth at exit under the modeled value-creation plan.',
    definition: 'MET-007/008/009: Exit Adjusted EBITDA × Exit Multiple; MOIC = exit equity value / invested equity.',
  },
  recommendations: {
    label: 'Recommendations',
    purpose: 'Signals demanding attention, and the hypotheses about why they are happening.',
    definition: 'Signal and Business Hypothesis molecules on the PortCo rod, linked back to the structures they affect.',
  },
};

const invoiceEvidence = (data) => data.recon.invoiceChecks.map((c) => ({
  label: `Invoice ${c.invoiceId}`,
  detail: `Usage match ${c.usageMatch === null ? '—' : c.usageMatch ? '✓' : '✗'} · GL balanced ${c.glBalanced ? '✓' : '✗'} · Cash settles AR ${c.cashSettlesAr ? '✓' : '✗'}`,
}));

const reconConfidence = (data) => {
  const checks = data.recon.invoiceChecks;
  if (!checks.length) return null;
  const passed = checks.filter((c) => c.usageMatch !== false && c.glBalanced && c.cashSettlesAr).length;
  return passed / checks.length;
};

const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

// Every metric the UI displays is registered here with the same standardized
// Inspector contract: purpose / definition / currentState / confidence /
// evidence / dependencies / relatedJourneys. Definitions quote the governed
// formula IDs from MVP_21_Metric_Registry (implemented in
// server/lib/lonetreeReconciliation.js), so the Inspector teaches the user
// where every number comes from.
export const METRIC_DEFS = {
  targetsEvaluated: {
    label: 'Targets Evaluated',
    stage: 'commercial',
    purpose: 'How much of the acquisition universe has been screened against LoneTree investment criteria.',
    definition: 'COUNT(market_target evidence rows on the Fund rod). Composite score = weighted sector/recurring-revenue/growth/execution fit (MVP_04_Targets).',
    value: (d) => d.summary.targetCount,
    currentState: (d) => `${d.summary.targetCount} targets screened · ${(d.summary.targets || []).filter((t) => t.decision === 'Shortlist').length} shortlisted`,
    confidence: (d) => avg((d.summary.targets || []).map((t) => (t.compositeScore || 0) / 100)),
    evidence: (d) => (d.summary.targets || []).map((t) => ({
      label: t.name || t.targetId,
      detail: `${t.sector || '—'} · Composite ${t.compositeScore ?? '—'} · ${t.decision || '—'}`,
      focus: { kind: 'target', id: t.targetId },
    })),
    dependencies: () => [],
    relatedJourneys: ['commercial'],
  },
  activeTheses: {
    label: 'Active Theses',
    stage: 'commercial',
    purpose: 'The investment beliefs the deal is underwritten on — each one links diligence and value-creation work.',
    definition: 'COUNT(investment_thesis evidence on the Fund rod, excluding diligence sub-rows).',
    value: (d) => d.summary.thesisCount,
    currentState: (d) => `${d.summary.thesisCount} theses · ${d.theses.reduce((s, t) => s + t.linkedInitiatives.length, 0)} linked initiatives`,
    confidence: (d) => avg(d.theses.map((t) => t.confidence).filter((c) => c !== null)),
    evidence: (d) => d.theses.map((t) => ({
      label: t.name,
      detail: `${t.status} · Confidence ${fmtPct(t.confidence)} · ${t.linkedDiligence.length} diligence item(s)`,
      focus: { kind: 'thesis', id: t.thesisId },
    })),
    dependencies: (d) => d.theses.map((t) => ({ label: t.name, focus: { kind: 'thesis', id: t.thesisId } })),
    relatedJourneys: ['commercial', 'enterprise-value'],
  },
  collectionRate: {
    label: 'Collection Rate',
    stage: 'commercial',
    purpose: 'Whether invoiced revenue actually turns into cash — the health of the commercial engine.',
    definition: 'MET-003: SUM(Cash_Collected_$) / SUM(Invoice_Amount_$) across all PortCo invoices.',
    value: (d) => fmtPct(d.recon.collectionRate),
    currentState: (d) => `${fmtUsd(d.recon.totalCashCollected)} collected of ${fmtUsd(d.recon.totalInvoiced)} invoiced (${d.recon.invoiceCount} invoices)`,
    confidence: reconConfidence,
    evidence: invoiceEvidence,
    dependencies: () => [
      { label: 'Cash Collected', focus: { kind: 'metric', id: 'cashCollected' } },
      { label: 'Recognized Revenue', focus: { kind: 'metric', id: 'recognizedRevenue' } },
    ],
    relatedJourneys: ['commercial', 'financial'],
  },
  usageEvents: {
    label: 'Usage Events Tracked',
    stage: 'operational',
    purpose: 'The operational ground truth — every unit of product usage observed before it becomes an invoice.',
    definition: 'COUNT(commercial_usage_event evidence on the PortCo rod). Each event carries Actual_Quantity from the source system.',
    value: (d) => d.recon.usageEventCount,
    currentState: (d) => `${d.recon.usageEventCount} events · each traced forward Usage → Invoice → Revenue → GL`,
    confidence: reconConfidence,
    evidence: (d) => d.revenueTrace.chain.map((c) => ({
      label: `Usage ${c.usageEventId}`,
      detail: `${c.usageQuantity} units → Invoice ${c.invoiceId} (${fmtUsd(c.invoiceAmount)}) → Revenue ${c.revenueScheduleId}`,
    })),
    dependencies: () => [{ label: 'Recognized Revenue (downstream)', focus: { kind: 'metric', id: 'recognizedRevenue' } }],
    relatedJourneys: ['operational', 'financial'],
  },
  openSignals: {
    label: 'Open Signals',
    stage: 'operational',
    purpose: 'Deviations the platform is watching — early warnings before they show up in the financials.',
    definition: 'COUNT(signal_type evidence on the PortCo rod with open status). Magnitude = variance vs. baseline.',
    value: (d) => d.summary.openSignalCount,
    currentState: (d) => {
      const negative = d.signals.filter((s) => s.magnitude < 0).length;
      return `${d.summary.openSignalCount} open · ${negative} negative-variance`;
    },
    confidence: (d) => avg(d.signals.map((s) => s.confidence).filter((c) => c !== null && c !== undefined)),
    evidence: (d) => d.signals.map((s) => ({
      label: s.type,
      detail: `${s.observation} · magnitude ${(s.magnitude * 100).toFixed(1)}%`,
      focus: { kind: 'signal', id: s.signalId },
    })),
    dependencies: (d) => d.signals.map((s) => ({ label: s.type, focus: { kind: 'signal', id: s.signalId } })),
    relatedJourneys: ['operational', 'recommendations'],
  },
  recognizedRevenue: {
    label: 'Recognized Revenue',
    stage: 'financial',
    purpose: 'Revenue the accounting standards let us claim — traced line-by-line to the usage that earned it.',
    definition: 'MET-001: SUM(Recognized_Revenue_$) across commercial_revenue_schedule evidence.',
    value: (d) => fmtUsd(d.recon.totalRecognizedRevenue),
    currentState: (d) => `${d.revenueTrace.chain.length} revenue schedule entries, all traced to source usage`,
    confidence: reconConfidence,
    evidence: (d) => d.revenueTrace.chain.slice(0, 6).flatMap((c) => [
      { label: `Usage ${c.usageEventId}`, detail: `${c.usageQuantity} units observed` },
      { label: `Invoice ${c.invoiceId}`, detail: fmtUsd(c.invoiceAmount) },
      { label: `Revenue ${c.revenueScheduleId}`, detail: fmtUsd(c.recognizedRevenue) },
      ...c.glLines.map((g) => ({ label: `GL — ${g.account}`, detail: `Dr ${fmtUsd(g.debit)} / Cr ${fmtUsd(g.credit)}` })),
    ]),
    dependencies: () => [{ label: 'Usage Events (upstream)', focus: { kind: 'metric', id: 'usageEvents' } }],
    relatedJourneys: ['operational', 'financial'],
    evidenceIsChain: true,
  },
  cashCollected: {
    label: 'Cash Collected',
    stage: 'financial',
    purpose: 'Money actually in the bank — the only number that funds operations.',
    definition: 'MET-002: SUM(Cash_Collected_$) across commercial_invoice evidence.',
    value: (d) => fmtUsd(d.recon.totalCashCollected),
    currentState: (d) => `${fmtPct(d.recon.collectionRate)} of total invoiced, across ${d.recon.invoiceCount} invoices`,
    confidence: reconConfidence,
    evidence: invoiceEvidence,
    dependencies: () => [{ label: 'Collection Rate', focus: { kind: 'metric', id: 'collectionRate' } }],
    relatedJourneys: ['commercial', 'financial'],
  },
  reconciliation: {
    label: 'Reconciliation',
    stage: 'financial',
    purpose: 'Proof the whole chain balances — every invoice matches its usage, every GL entry double-books.',
    definition: 'TC-003/TC-004: invoice = usage × unit price; AR debit = revenue credit; cash entry settles AR.',
    value: (d) => (d.recon.allInvoicesReconciled ? '✓ Reconciled' : '⚠ Discrepancy'),
    currentState: (d) => `${d.recon.invoiceCount} invoices checked against ${d.recon.glLineCount} GL lines`,
    confidence: reconConfidence,
    evidence: invoiceEvidence,
    dependencies: () => [
      { label: 'Recognized Revenue', focus: { kind: 'metric', id: 'recognizedRevenue' } },
      { label: 'Cash Collected', focus: { kind: 'metric', id: 'cashCollected' } },
    ],
    relatedJourneys: ['financial'],
  },
  enterpriseValue: {
    label: 'Enterprise Value (Exit)',
    stage: 'enterprise-value',
    purpose: 'The modeled exit outcome — what the value-creation plan is worth if it lands.',
    definition: 'MET-008: (Base Exit EBITDA + Σ initiative EBITDA impact) × Exit Multiple.',
    value: (d) => fmtUsd(d.fundEconomics.exitEnterpriseValue),
    currentState: (d) => `Exit Adjusted EBITDA ${fmtUsd(d.fundEconomics.exitAdjustedEbitda)} · uplift ${fmtUsd(d.fundEconomics.valueCreationEbitdaUplift)} from initiatives`,
    confidence: (d) => avg(d.initiatives.map((i) => i.confidence).filter((c) => c !== null && c !== undefined)),
    evidence: (d) => d.evDrivers.drivers.flatMap((dr) => dr.initiatives.map((init) => ({
      label: `${dr.pillar} — ${init.name}`,
      detail: `EBITDA ${fmtUsd(init.expectedEbitdaImpact)} · EV ${fmtUsd(init.expectedEvImpact)} (${init.status})`,
      focus: { kind: 'initiative', id: init.initiativeId },
    }))),
    dependencies: (d) => d.theses.map((t) => ({ label: t.name, focus: { kind: 'thesis', id: t.thesisId } })),
    relatedJourneys: ['enterprise-value', 'commercial'],
  },
  moic: {
    label: 'Modeled MOIC',
    stage: 'enterprise-value',
    purpose: 'The fund-level multiple on invested equity if the model holds.',
    definition: 'MET-009: (Exit EV − Debt) × Ownership / (Equity Purchase Price × Ownership).',
    value: (d) => fmtX(d.fundEconomics.moic),
    currentState: (d) => {
      const s = d.evDrivers.sensitivity.map((x) => `${x.exitMultiple}x → ${fmtX(x.moic)}`).join(' · ');
      return `Sensitivity (±1x exit multiple): ${s}`;
    },
    confidence: (d) => avg(d.initiatives.map((i) => i.confidence).filter((c) => c !== null && c !== undefined)),
    evidence: (d) => [
      { label: 'Invested equity', detail: fmtUsd(d.fundEconomics.investedEquity) },
      { label: 'Exit equity value', detail: fmtUsd(d.fundEconomics.exitEquityValue) },
      { label: 'Assumptions', detail: `Entry ${d.fundEconomics.inputs.entryMultiple}x / Exit ${d.fundEconomics.inputs.exitMultiple}x · Debt ${fmtUsd(d.fundEconomics.inputs.debtFinancing)} · Ownership ${fmtPct(d.fundEconomics.inputs.fundOwnership)}`,
      },
    ],
    dependencies: () => [{ label: 'Enterprise Value (Exit)', focus: { kind: 'metric', id: 'enterpriseValue' } }],
    relatedJourneys: ['enterprise-value'],
  },
};

export const STAGE_METRICS = {
  commercial: ['targetsEvaluated', 'activeTheses', 'collectionRate'],
  operational: ['usageEvents', 'openSignals'],
  financial: ['recognizedRevenue', 'cashCollected', 'reconciliation'],
  'enterprise-value': ['enterpriseValue', 'moic'],
  recommendations: [],
};

const baseCrumbs = (data) => [
  { label: data.summary.fund.name || 'LoneTree', focus: null },
  { label: data.summary.portco.name || 'Veradigm', focus: null },
];

// The one resolver every component consults. Pure and synchronous — all trace
// data is prefetched, so a click never loads: it re-contextualizes.
export function resolveExperience(focus, data) {
  const none = {
    breadcrumb: baseCrumbs(data),
    highlightStages: new Set(),
    expandedStage: 'commercial',
    related: { thesisIds: new Set(), signalIds: new Set(), initiativeIds: new Set(), metricKeys: new Set() },
    inspector: null,
  };
  if (!focus) return none;

  const stageCrumb = (key) => ({ label: STAGE_DEFS[key].label, focus: { kind: 'stage', id: key } });

  if (focus.kind === 'stage') {
    const def = STAGE_DEFS[focus.id];
    if (!def) return none;
    return {
      breadcrumb: [...baseCrumbs(data), stageCrumb(focus.id)],
      highlightStages: new Set([focus.id]),
      expandedStage: focus.id,
      related: { thesisIds: new Set(), signalIds: new Set(), initiativeIds: new Set(), metricKeys: new Set(STAGE_METRICS[focus.id]) },
      inspector: {
        kind: 'Journey Stage',
        title: def.label,
        purpose: def.purpose,
        definition: def.definition,
        currentState: `${STAGE_METRICS[focus.id].length} governed metrics live on this stage`,
        confidence: null,
        evidence: STAGE_METRICS[focus.id].map((k) => ({
          label: METRIC_DEFS[k].label,
          detail: String(METRIC_DEFS[k].value(data)),
          focus: { kind: 'metric', id: k },
        })),
        dependencies: [],
        relatedJourneys: [focus.id],
      },
    };
  }

  if (focus.kind === 'metric') {
    const def = METRIC_DEFS[focus.id];
    if (!def) return none;
    const deps = def.dependencies(data);
    return {
      breadcrumb: [...baseCrumbs(data), stageCrumb(def.stage), { label: def.label, focus }],
      highlightStages: new Set(def.relatedJourneys),
      expandedStage: def.stage,
      related: {
        thesisIds: new Set(deps.filter((x) => x.focus?.kind === 'thesis').map((x) => x.focus.id)),
        signalIds: new Set(deps.filter((x) => x.focus?.kind === 'signal').map((x) => x.focus.id)),
        initiativeIds: new Set(),
        metricKeys: new Set([focus.id, ...deps.filter((x) => x.focus?.kind === 'metric').map((x) => x.focus.id)]),
      },
      inspector: {
        kind: 'Governed Metric',
        title: def.label,
        value: String(def.value(data)),
        purpose: def.purpose,
        definition: def.definition,
        currentState: def.currentState(data),
        confidence: def.confidence(data),
        evidence: def.evidence(data),
        evidenceIsChain: !!def.evidenceIsChain,
        dependencies: deps,
        relatedJourneys: def.relatedJourneys,
      },
    };
  }

  if (focus.kind === 'thesis') {
    const t = data.theses.find((x) => x.thesisId === focus.id);
    if (!t) return none;
    const initiativeIds = new Set(t.linkedInitiatives.map((i) => i.initiativeId));
    return {
      breadcrumb: [...baseCrumbs(data), stageCrumb('commercial'), { label: t.name, focus }],
      highlightStages: new Set(['commercial', 'enterprise-value']),
      expandedStage: 'commercial',
      related: { thesisIds: new Set([t.thesisId]), signalIds: new Set(), initiativeIds, metricKeys: new Set(['activeTheses', 'enterpriseValue']) },
      inspector: {
        kind: 'Investment Thesis',
        title: t.name,
        purpose: t.statement,
        definition: `investment_thesis evidence on the Fund rod · pillar: ${t.pillar || '—'}`,
        currentState: `${t.status} · ${t.linkedInitiatives.length} linked initiative(s) · ${t.linkedDiligence.length} diligence item(s)`,
        confidence: t.confidence,
        evidence: t.linkedDiligence.map((dg) => ({
          label: dg.question,
          detail: `${dg.status} · confidence ${fmtPct(dg.confidence)}`,
        })),
        dependencies: t.linkedInitiatives.map((i) => ({ label: i.name, detail: i.status, focus: { kind: 'initiative', id: i.initiativeId } })),
        relatedJourneys: ['commercial', 'enterprise-value'],
      },
    };
  }

  if (focus.kind === 'signal') {
    const s = data.signals.find((x) => x.signalId === focus.id);
    if (!s) return none;
    const linkedHyps = data.hypotheses.filter((h) => (h.supportingSignals || '').includes(s.signalId));
    return {
      breadcrumb: [...baseCrumbs(data), stageCrumb('recommendations'), { label: s.type, focus }],
      highlightStages: new Set(['operational', 'financial', 'recommendations']),
      expandedStage: 'recommendations',
      related: { thesisIds: new Set(), signalIds: new Set([s.signalId]), initiativeIds: new Set(), metricKeys: new Set(['openSignals', 'usageEvents']) },
      inspector: {
        kind: 'Signal',
        title: s.type,
        value: `${(s.magnitude * 100).toFixed(1)}%`,
        purpose: s.observation,
        definition: 'Signal molecule on the PortCo rod: observed variance vs. governed baseline, with confidence and affected structures.',
        currentState: `Status ${s.status || 'open'} · affects ${s.affectedHighways || '—'}`,
        confidence: s.confidence,
        evidence: linkedHyps.map((h) => ({
          label: `Hypothesis — ${h.status}`,
          detail: h.statement,
        })),
        dependencies: [{ label: 'Usage Events Tracked', focus: { kind: 'metric', id: 'usageEvents' } }],
        relatedJourneys: ['operational', 'financial'],
      },
    };
  }

  if (focus.kind === 'target') {
    const t = (data.summary.targets || []).find((x) => x.targetId === focus.id);
    if (!t) return none;
    return {
      breadcrumb: [...baseCrumbs(data), stageCrumb('commercial'), { label: t.name || t.targetId, focus }],
      highlightStages: new Set(['commercial']),
      expandedStage: 'commercial',
      related: { thesisIds: new Set(), signalIds: new Set(), initiativeIds: new Set(), metricKeys: new Set(['targetsEvaluated']) },
      inspector: {
        kind: 'Market Target',
        title: t.name || t.targetId,
        value: t.compositeScore != null ? `${t.compositeScore}` : undefined,
        purpose: 'An acquisition target evaluated against LoneTree investment criteria.',
        definition: 'market_target evidence on the Fund rod (MVP_04_Targets). Composite = weighted fit scores.',
        currentState: `${t.sector || '—'} · Decision: ${t.decision || '—'}`,
        confidence: t.compositeScore != null ? t.compositeScore / 100 : null,
        evidence: [{ label: 'Composite score', detail: `${t.compositeScore ?? '—'} / 100` }],
        dependencies: [{ label: 'Targets Evaluated', focus: { kind: 'metric', id: 'targetsEvaluated' } }],
        relatedJourneys: ['commercial'],
      },
    };
  }

  if (focus.kind === 'initiative') {
    const i = data.initiatives.find((x) => x.initiativeId === focus.id);
    if (!i) return none;
    const linkedThesis = data.theses.find((t) => t.thesisId === i.Linked_Thesis_ID);
    return {
      breadcrumb: [...baseCrumbs(data), stageCrumb('enterprise-value'), { label: i.Initiative_Name, focus }],
      highlightStages: new Set(['enterprise-value', 'commercial']),
      expandedStage: 'enterprise-value',
      related: {
        thesisIds: new Set(linkedThesis ? [linkedThesis.thesisId] : []),
        signalIds: new Set(),
        initiativeIds: new Set([i.initiativeId]),
        metricKeys: new Set(['enterpriseValue', 'moic']),
      },
      inspector: {
        kind: 'Value Creation Initiative',
        title: i.Initiative_Name,
        value: fmtUsd(Number(i['Expected_Annual_EBITDA_Impact_$']) || 0),
        purpose: `Pillar: ${i.Value_Creation_Pillar || '—'} — modeled EBITDA uplift feeding exit enterprise value.`,
        definition: 'fund_value_creation_initiative evidence on the PortCo rod; its EBITDA impact is a direct MET-007 input.',
        currentState: `${i.Status || '—'} · Expected EV impact ${fmtUsd(Number(i['Expected_Enterprise_Value_Impact_$']) || 0)}`,
        confidence: i.confidence,
        evidence: [
          { label: 'Expected annual EBITDA impact', detail: fmtUsd(Number(i['Expected_Annual_EBITDA_Impact_$']) || 0) },
          { label: 'Expected enterprise value impact', detail: fmtUsd(Number(i['Expected_Enterprise_Value_Impact_$']) || 0) },
        ],
        dependencies: linkedThesis ? [{ label: linkedThesis.name, focus: { kind: 'thesis', id: linkedThesis.thesisId } }] : [],
        relatedJourneys: ['enterprise-value', 'commercial'],
      },
    };
  }

  return none;
}
