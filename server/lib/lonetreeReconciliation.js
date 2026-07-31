// Lonetree MVP reconciliation engine (2026-07-29) — computes the
// Operational -> Financial -> Fund Economics chain (Usage -> Invoice ->
// Revenue Schedule -> GL -> EBITDA -> Enterprise Value -> Fund Economics)
// from the real seeded evidence (journey_rod_evidence rows created by
// server/scripts/seedLonetreeMvpFund.js), per MVP_21_Metric_Registry's
// governed formula definitions — every exported function documents the
// exact Formula_Logic string from that sheet it implements, so a formula
// change is a one-line edit here plus a comment update, not a hunt through
// UI code. Read-heavy; nothing here mutates evidence.
//
// Honest limitation, not silently hidden: Salt_Basin_LoneTree_MVP_Detailed_
// Build_and_Test_Spec_v1.0.docx (referenced by Betsy as "the authoritative
// product specification") was not present in her Downloads folder as of
// 2026-07-29 and has not been read. MVP_26_Dashboard's reference cell
// ("Modeled Exit MOIC: 2.018063492063492") could not be exactly
// reverse-engineered from the workbook's own MVP_22_Fund_Economics inputs
// alone — the standard PE MOIC formula implemented below (see
// computeFundEconomics) produces a materially different number. Flagged in
// that function's return value as `moicReferenceMismatch`, not silently
// reconciled to match — if the missing spec defines the exact waterfall,
// swap the formula here once it's available.
import { db } from '../db.js';

async function getEvidenceRows(rodId, moleculeKey) {
  const rows = await db.prepare(
    `SELECT source_reference, value, confidence, observed_at FROM journey_rod_evidence WHERE rod_id=$1 AND molecule_key=$2 ORDER BY observed_at ASC`
  ).all(rodId, moleculeKey);
  return rows.map((r) => ({
    sourceReference: r.source_reference,
    value: r.value, // journey_rod_evidence.value is JSONB — postgres.js already deserializes it to a native JS value (object/string/number); re-parsing a plain string here throws (CLAUDE.md's jsonb param convention note applies to reads too, not just writes).
    confidence: r.confidence === null ? null : Number(r.confidence),
    observedAt: Number(r.observed_at),
  }));
}

/**
 * MET-001 Revenue: SUM(Recognized_Revenue).
 * MET-002 Cash Collections: SUM(Cash_Collected).
 * MET-003 Collection Rate: Cash / Invoice Amount.
 * Plus TC-004's GL double-entry check: for each invoice, AR debit must equal
 * revenue credit, and a cash entry must settle AR by the collected amount.
 */
export async function computePortcoCommercialReconciliation(portcoRodId) {
  const [invoices, revenueSchedules, glEntries, usageEvents] = await Promise.all([
    getEvidenceRows(portcoRodId, 'commercial_invoice'),
    getEvidenceRows(portcoRodId, 'commercial_revenue_schedule'),
    getEvidenceRows(portcoRodId, 'commercial_gl_entry'),
    getEvidenceRows(portcoRodId, 'commercial_usage_event'),
  ]);

  const totalInvoiced = invoices.reduce((sum, r) => sum + (Number(r.value['Invoice_Amount_$']) || 0), 0);
  const totalCashCollected = invoices.reduce((sum, r) => sum + (Number(r.value['Cash_Collected_$']) || 0), 0);
  const totalRecognizedRevenue = revenueSchedules.reduce((sum, r) => sum + (Number(r.value['Recognized_Revenue_$']) || 0), 0);
  const collectionRate = totalInvoiced > 0 ? totalCashCollected / totalInvoiced : null;

  // TC-003: invoice amount must equal usage quantity x contract price.
  // TC-004: AR debit == revenue credit per invoice, cash entry settles AR.
  const invoiceChecks = invoices.map((inv) => {
    const usage = usageEvents.find((u) => u.sourceReference === inv.value.Usage_Event_ID);
    const expectedInvoiceAmount = usage ? Number(usage.value.Actual_Quantity) * Number(inv.value['Unit_Price_$']) : null;
    const usageMatch = expectedInvoiceAmount === null ? null : Math.abs(expectedInvoiceAmount - Number(inv.value['Invoice_Amount_$'])) < 0.01;

    const linkedGl = glEntries.filter((g) => g.value.Source_Document_ID === inv.sourceReference);
    const arDebit = linkedGl.filter((g) => /accounts receivable/i.test(g.value.GL_Account)).reduce((s, g) => s + (Number(g.value['Debit_$']) || 0), 0);
    const revenueCredit = linkedGl.filter((g) => /revenue/i.test(g.value.GL_Account)).reduce((s, g) => s + (Number(g.value['Credit_$']) || 0), 0);
    const cashDebit = linkedGl.filter((g) => /^1000|cash/i.test(g.value.GL_Account)).reduce((s, g) => s + (Number(g.value['Debit_$']) || 0), 0);
    const arCreditFromCash = linkedGl.filter((g) => /accounts receivable/i.test(g.value.GL_Account)).reduce((s, g) => s + (Number(g.value['Credit_$']) || 0), 0);

    return {
      invoiceId: inv.sourceReference,
      usageMatch,
      glBalanced: Math.abs(arDebit - revenueCredit) < 0.01,
      cashSettlesAr: Math.abs(cashDebit - arCreditFromCash) < 0.01 && Math.abs(cashDebit - Number(inv.value['Cash_Collected_$'])) < 0.01,
    };
  });

  return {
    portcoRodId,
    totalInvoiced,
    totalCashCollected,
    totalRecognizedRevenue,
    collectionRate,
    invoiceCount: invoices.length,
    usageEventCount: usageEvents.length,
    glLineCount: glEntries.length,
    invoiceChecks,
    allInvoicesReconciled: invoiceChecks.every((c) => c.usageMatch !== false && c.glBalanced && c.cashSettlesAr),
  };
}

/**
 * MET-007 Adjusted EBITDA (exit-year): Base Exit EBITDA + sum of approved
 * Value Creation Initiatives' Expected_Annual_EBITDA_Impact.
 * MET-008 Enterprise Value: EBITDA x Exit_Multiple.
 * MET-009 MOIC: Gross_Value / Invested_Equity — standard PE definition used
 * here: Invested_Equity = Equity_Purchase_Price x Fund_Ownership; Gross_Value
 * = (Exit_Enterprise_Value - Debt_Financing) x Fund_Ownership. See file
 * header for the known mismatch against MVP_26_Dashboard's reference cell.
 */
export async function computeFundEconomics(fundRodId, portcoRodId) {
  const [inputRows, initiativeRows] = await Promise.all([
    getEvidenceRows(fundRodId, 'fund_economics_input'),
    getEvidenceRows(portcoRodId, 'fund_value_creation_initiative'),
  ]);
  const inputs = Object.fromEntries(inputRows.map((r) => [r.value.Input, Number(r.value.Value)]));

  const purchaseEnterpriseValue = inputs['Purchase Enterprise Value'];
  const debtFinancing = inputs['Debt Financing'];
  const equityPurchasePrice = inputs['Equity Purchase Price'];
  const fundOwnership = inputs['Fund Ownership'];
  const entryAdjustedEbitda = inputs['Entry Adjusted EBITDA'];
  const entryMultiple = inputs['Entry Multiple'];
  const baseExitEbitda = inputs['Base Exit EBITDA'];
  const exitMultiple = inputs['Exit Multiple'];
  const holdPeriodYears = inputs['Hold Period'];

  const valueCreationEbitdaUplift = initiativeRows.reduce((sum, r) => sum + (Number(r.value['Expected_Annual_EBITDA_Impact_$']) || 0), 0);
  const exitAdjustedEbitda = baseExitEbitda + valueCreationEbitdaUplift;

  const entryEnterpriseValue = purchaseEnterpriseValue; // given directly (Entry_Multiple x Entry EBITDA should reconcile: 10 x 52.5M = 525M)
  const exitEnterpriseValue = exitAdjustedEbitda * exitMultiple;

  const investedEquity = equityPurchasePrice * fundOwnership;
  const exitEquityValue = (exitEnterpriseValue - debtFinancing) * fundOwnership;
  const moic = investedEquity > 0 ? exitEquityValue / investedEquity : null;

  // Simple annualized-return approximation (single cash-out event at hold
  // end) — MET-010's real formula is XIRR over dated capital calls/
  // distributions, which this demo dataset doesn't carry a full call
  // schedule for. Documented approximation, not the governed XIRR.
  const irrApprox = moic !== null && holdPeriodYears > 0 ? Math.pow(moic, 1 / holdPeriodYears) - 1 : null;

  const dashboardReferenceMoic = 2.018063492063492;
  const dashboardReferenceIrr = 0.15076584955606953;

  return {
    fundRodId, portcoRodId,
    inputs: { purchaseEnterpriseValue, debtFinancing, equityPurchasePrice, fundOwnership, entryAdjustedEbitda, entryMultiple, baseExitEbitda, exitMultiple, holdPeriodYears },
    valueCreationEbitdaUplift,
    exitAdjustedEbitda,
    entryEnterpriseValue,
    exitEnterpriseValue,
    investedEquity,
    exitEquityValue,
    moic,
    irrApprox,
    moicReferenceMismatch: moic === null ? null : Math.abs(moic - dashboardReferenceMoic) > 0.01,
    dashboardReferenceMoic,
    dashboardReferenceIrr,
  };
}

/**
 * Enterprise Value drill-down, per Betsy's 2026-07-29 interaction spec:
 * Enterprise Value -> Commercial/Operational/Financial Drivers -> Modeled
 * Improvements -> Sensitivity -> Underlying Assumptions. "Drivers" are the
 * real Value Creation Initiatives grouped by their Value_Creation_Pillar
 * (the closest real governed grouping to Commercial/Operational/Financial —
 * flagged as a mapping choice, not a literal pillar-to-driver-type registry,
 * since the seed data doesn't carry that finer taxonomy). Sensitivity is a
 * real +/-1x exit-multiple swing on the same computeFundEconomics formula,
 * not a placeholder range.
 */
export async function traceEnterpriseValueDrivers(fundRodId, portcoRodId) {
  const base = await computeFundEconomics(fundRodId, portcoRodId);
  const initiativeRows = await getEvidenceRows(portcoRodId, 'fund_value_creation_initiative');

  const driverGroups = {};
  for (const row of initiativeRows) {
    const pillar = row.value.Value_Creation_Pillar || 'Other';
    if (!driverGroups[pillar]) driverGroups[pillar] = [];
    driverGroups[pillar].push({
      initiativeId: row.sourceReference,
      name: row.value.Initiative_Name,
      status: row.value.Status,
      expectedEbitdaImpact: Number(row.value['Expected_Annual_EBITDA_Impact_$']) || 0,
      expectedEvImpact: Number(row.value['Expected_Enterprise_Value_Impact_$']) || 0,
      confidence: row.confidence,
    });
  }

  const sensitivity = [-1, 0, 1].map((delta) => {
    const exitMultiple = base.inputs.exitMultiple + delta;
    const exitEnterpriseValue = base.exitAdjustedEbitda * exitMultiple;
    const exitEquityValue = (exitEnterpriseValue - base.inputs.debtFinancing) * base.inputs.fundOwnership;
    const moic = base.investedEquity > 0 ? exitEquityValue / base.investedEquity : null;
    return { exitMultiple, exitEnterpriseValue, moic };
  });

  return {
    fundRodId, portcoRodId,
    exitEnterpriseValue: base.exitEnterpriseValue,
    exitAdjustedEbitda: base.exitAdjustedEbitda,
    drivers: Object.entries(driverGroups).map(([pillar, initiatives]) => ({ pillar, initiatives })),
    sensitivity,
    assumptions: base.inputs,
  };
}

/**
 * TC-009's click-to-trace-backward: given a target metric ("moic", "ev",
 * "ebitda", "revenue"), return the ordered evidence chain that supports it —
 * Usage Event -> Invoice -> Revenue Schedule -> GL -> metric — reusing
 * MVP_23_Evidence_Lineage's own From/To edges as the canonical relationship
 * labels rather than inventing new ones.
 */
export async function traceMetricLineage(portcoRodId, metric) {
  const [usageEvents, invoices, revenueSchedules, glEntries] = await Promise.all([
    getEvidenceRows(portcoRodId, 'commercial_usage_event'),
    getEvidenceRows(portcoRodId, 'commercial_invoice'),
    getEvidenceRows(portcoRodId, 'commercial_revenue_schedule'),
    getEvidenceRows(portcoRodId, 'commercial_gl_entry'),
  ]);

  const chain = [];
  for (const rev of revenueSchedules) {
    const invoice = invoices.find((i) => i.sourceReference === rev.value.Invoice_ID);
    const usage = invoice ? usageEvents.find((u) => u.sourceReference === invoice.value.Usage_Event_ID) : null;
    const gl = glEntries.filter((g) => g.value.Source_Document_ID === rev.value.Invoice_ID);
    chain.push({
      revenueScheduleId: rev.sourceReference,
      recognizedRevenue: Number(rev.value['Recognized_Revenue_$']),
      invoiceId: invoice?.sourceReference || null,
      invoiceAmount: invoice ? Number(invoice.value['Invoice_Amount_$']) : null,
      usageEventId: usage?.sourceReference || null,
      usageQuantity: usage ? Number(usage.value.Actual_Quantity) : null,
      glLines: gl.map((g) => ({ journalLineId: g.sourceReference, account: g.value.GL_Account, debit: Number(g.value['Debit_$']) || 0, credit: Number(g.value['Credit_$']) || 0 })),
    });
  }
  return { portcoRodId, metric, chain };
}

const fmtUsd0 = (n) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const fmtPct1 = (n) => `${(Number(n) * 100).toFixed(1)}%`;

/**
 * The scripted demonstration event chain (Betsy's "usage decline -> fund
 * economics" narrative, MVP_25 test case "Apply usage decline projection"):
 * given one open signal, walk its real seeded relationships end-to-end —
 * usage series -> signal -> revenue shortfall -> EBITDA -> Enterprise Value
 * -> MOIC -> hypotheses -> value-creation response — and return an ordered
 * `steps` array the UI plays back. Every edge is derived from evidence the
 * seed actually wrote (signal_affected_structures.evidenceReference,
 * hypothesis_supporting_signals, initiative Origin_References), not a
 * hardcoded SIG-001 script; `signalId` defaults to the open signal with the
 * largest negative magnitude, so re-seeding with different data changes the
 * demonstration without touching this code.
 *
 * Honest assumption, surfaced in the payload rather than buried: the
 * workbook carries no marginal-cost data for usage revenue, so revenue
 * shortfall flows through to EBITDA at 100% (`ebitdaFlowThrough: 1`). The
 * projection annualizes the latest month's shortfall (x12) — labeled a
 * run-rate projection, not a governed forecast.
 */
export async function computeSignalPropagationDemonstration(fundRodId, portcoRodId, signalId = null) {
  const [types, variances, confidences, statuses, structures, usageEvents, contracts, hypStatements, hypSignals, hypConfidences, initiatives] = await Promise.all([
    getEvidenceRows(portcoRodId, 'signal_type'),
    getEvidenceRows(portcoRodId, 'signal_variance'),
    getEvidenceRows(portcoRodId, 'signal_confidence'),
    getEvidenceRows(portcoRodId, 'signal_status'),
    getEvidenceRows(portcoRodId, 'signal_affected_structures'),
    getEvidenceRows(portcoRodId, 'commercial_usage_event'),
    getEvidenceRows(portcoRodId, 'commercial_contract'),
    getEvidenceRows(portcoRodId, 'hypothesis_statement'),
    getEvidenceRows(portcoRodId, 'hypothesis_supporting_signals'),
    getEvidenceRows(portcoRodId, 'hypothesis_confidence'),
    getEvidenceRows(portcoRodId, 'fund_value_creation_initiative'),
  ]);
  const byRef = (rows) => Object.fromEntries(rows.map((r) => [r.sourceReference, r]));
  const varByRef = byRef(variances), confByRef = byRef(confidences), statusByRef = byRef(statuses), structByRef = byRef(structures);

  // Pick the signal: explicit id, else the open signal with the largest
  // negative magnitude (the one most worth demonstrating).
  const candidates = types
    .map((t) => ({ signalId: t.sourceReference, type: t.value, magnitude: Number(varByRef[t.sourceReference]?.value ?? 0), status: statusByRef[t.sourceReference]?.value }))
    .filter((s) => (signalId ? s.signalId === signalId : /open/i.test(String(s.status || ''))));
  const signal = signalId ? candidates[0] : candidates.sort((a, b) => a.magnitude - b.magnitude)[0];
  if (!signal) return { error: signalId ? `Signal ${signalId} not found` : 'No open signals to demonstrate' };

  const struct = structByRef[signal.signalId]?.value || {};
  const confidence = confByRef[signal.signalId]?.value ?? null;

  // Signal -> its referenced usage event -> that contract's full series.
  const refUsage = usageEvents.find((u) => u.sourceReference === struct.evidenceReference);
  const contractId = refUsage?.value?.Contract_ID || null;
  const series = usageEvents
    .filter((u) => u.value.Contract_ID === contractId)
    .sort((a, b) => String(a.value.Usage_Month).localeCompare(String(b.value.Usage_Month)))
    .map((u) => ({
      usageEventId: u.sourceReference,
      month: u.value.Usage_Month,
      actual: Number(u.value.Actual_Quantity),
      baseline: Number(u.value.Baseline_Quantity),
      variance: Number(u.value.Variance_to_Baseline),
    }));
  const latest = series[series.length - 1] || null;
  const contract = contracts.find((c) => c.sourceReference === contractId);
  const unitPrice = contract ? Number(contract.value['Unit_Price_$']) : null;

  if (!refUsage || !latest || !contract) {
    return { error: `Signal ${signal.signalId} has no traceable usage evidence (reference: ${struct.evidenceReference || 'none'})` };
  }

  // Financial projection: latest month's shortfall at contract unit price,
  // annualized as a run rate.
  const monthlyShortfallQty = latest.baseline - latest.actual;
  const monthlyRevenueImpact = monthlyShortfallQty * unitPrice;
  const annualizedRevenueImpact = monthlyRevenueImpact * 12;
  const ebitdaFlowThrough = 1; // no marginal-cost data in the workbook — 100% flow-through, stated openly
  const ebitdaImpact = annualizedRevenueImpact * ebitdaFlowThrough;

  // Fund economics before/after, on the same MET-007/008/009 formulas.
  const base = await computeFundEconomics(fundRodId, portcoRodId);
  const adjustedExitEbitda = base.exitAdjustedEbitda - ebitdaImpact;
  const adjustedExitEv = adjustedExitEbitda * base.inputs.exitMultiple;
  const evImpact = base.exitEnterpriseValue - adjustedExitEv;
  const adjustedExitEquity = (adjustedExitEv - base.inputs.debtFinancing) * base.inputs.fundOwnership;
  const adjustedMoic = base.investedEquity > 0 ? adjustedExitEquity / base.investedEquity : null;

  // Narrative edges from real evidence links.
  const linkedHypotheses = hypStatements
    .filter((h) => String(byRef(hypSignals)[h.sourceReference]?.value || '').includes(signal.signalId))
    .map((h) => ({ hypothesisId: h.sourceReference, statement: h.value, confidence: byRef(hypConfidences)[h.sourceReference]?.value ?? null }));
  const linkedInitiatives = initiatives
    .filter((i) => linkedHypotheses.some((h) => String(i.value.Origin_References || '').includes(h.hypothesisId)))
    .map((i) => ({ initiativeId: i.sourceReference, name: i.value.Initiative_Name, status: i.value.Status, linkedThesisId: i.value.Linked_Thesis_ID || null }));
  const linkedThesisId = linkedInitiatives.find((i) => i.linkedThesisId)?.linkedThesisId || null;

  const steps = [
    {
      stage: 'operational',
      focus: { kind: 'metric', id: 'usageEvents' },
      title: `${contractId} usage is falling`,
      narration: `${struct.primarySubjectId || 'Customer'} · ${series.map((s) => s.actual.toLocaleString('en-US')).join(' → ')} units over ${series.length} months (baseline ${latest.baseline.toLocaleString('en-US')}).`,
      delta: fmtPct1(latest.variance),
    },
    {
      stage: 'recommendations',
      focus: { kind: 'signal', id: signal.signalId },
      title: `Signal ${signal.signalId}: ${signal.type}`,
      narration: `${struct.observation || ''} Detected from ${struct.evidenceReference} with ${fmtPct1(confidence)} confidence.`,
      delta: fmtPct1(signal.magnitude),
    },
    {
      stage: 'financial',
      focus: { kind: 'metric', id: 'recognizedRevenue' },
      title: 'Revenue impact at contract price',
      narration: `${monthlyShortfallQty.toLocaleString('en-US')} lost units × ${fmtUsd0(unitPrice)} = ${fmtUsd0(monthlyRevenueImpact)}/month · annualized run rate ${fmtUsd0(annualizedRevenueImpact)}.`,
      delta: `−${fmtUsd0(annualizedRevenueImpact)}/yr`,
    },
    {
      stage: 'enterprise-value',
      focus: { kind: 'metric', id: 'enterpriseValue' },
      title: 'Enterprise value at exit multiple',
      narration: `EBITDA impact ${fmtUsd0(ebitdaImpact)} (100% flow-through assumption) × ${base.inputs.exitMultiple}x exit multiple = ${fmtUsd0(evImpact)} of enterprise value.`,
      delta: `−${fmtUsd0(evImpact)}`,
    },
    {
      stage: 'enterprise-value',
      focus: { kind: 'metric', id: 'moic' },
      title: 'Fund economics move',
      narration: `Modeled MOIC ${base.moic?.toFixed(2)}x → ${adjustedMoic?.toFixed(2)}x if the decline persists unaddressed.`,
      delta: `${base.moic?.toFixed(2)}x → ${adjustedMoic?.toFixed(2)}x`,
    },
    ...(linkedHypotheses.length ? [{
      stage: 'recommendations',
      focus: linkedThesisId ? { kind: 'thesis', id: linkedThesisId } : { kind: 'signal', id: signal.signalId },
      title: 'The platform already has hypotheses',
      narration: linkedHypotheses.map((h) => h.statement).join(' · '),
      delta: `${linkedHypotheses.length} open`,
    }] : []),
    ...(linkedInitiatives.length ? [{
      stage: 'recommendations',
      focus: { kind: 'initiative', id: linkedInitiatives[0].initiativeId },
      title: `Response underway: ${linkedInitiatives[0].name}`,
      narration: `Value-creation initiative ${linkedInitiatives[0].initiativeId} (${linkedInitiatives[0].status}) originated from these hypotheses — the loop from raw usage to fund action is closed.`,
      delta: linkedInitiatives[0].status,
    }] : []),
  ];

  return {
    fundRodId, portcoRodId,
    signalId: signal.signalId,
    contractId,
    assumptions: { ebitdaFlowThrough, projection: 'latest-month shortfall annualized ×12 (run rate, not a governed forecast)' },
    impacts: { monthlyShortfallQty, monthlyRevenueImpact, annualizedRevenueImpact, ebitdaImpact, evImpact, moicBefore: base.moic, moicAfter: adjustedMoic },
    series,
    steps,
  };
}
