// The drill-down layers of the release tracker: overview -> stat tile / feature -> round / bug / agent,
// and status updates -> update. Each layer function takes the route args and returns
// { crumbs: [[label, href?]...], node } or null when the item no longer exists.
import React from 'react';
import TrackerTrends from './TrackerTrends.jsx';
import { groupByScope } from '../../../server/lib/releaseScope.js';
import {
  STATS, STATUS, SCOPE, EVENT, BACKLOG, ROLE, statusText, isRunningLabel, sortBugs, ownBugs, agentName, ago, k, updateLabel,
} from '../../lib/releaseTrackerModel.js';

const mdb = (t) => {
  const parts = String(t ?? '').split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p));
};

export const Pill = ({ s }) => <span className={`rt-pill rt-s-${s}`}>{STATUS[s] || String(s).replace(/_/g, ' ')}</span>;
export const FeatStatus = ({ s }) => (isRunningLabel(s) ? <span className="rt-pill rt-s-running rt-running-anim">{statusText(s)}</span> : <Pill s={s} />);
const Section = ({ title, children }) => <section><h2>{title}</h2>{children}</section>;
const go = (href) => { window.location.hash = href; };
const RowLink = ({ href, children }) => (
  <tr className="rt-rowlink" onClick={(e) => { if (e.target.closest('a')) return; go(href); }}>{children}</tr>
);
const Commit = ({ snap, c }) => (c ? <> <a className="rt-mono" href={`${snap.repoUrl || ''}/commit/${c}`} target="_blank" rel="noopener noreferrer">{String(c).slice(0, 7)}</a></> : null);

// Release scope (server/lib/releaseScope.js): planned = this release's work, added = joined after the cut,
// backlog = kept on the record but not this release's work. Snapshots from before scopes existed show one list.
function FeatureSections({ snap, ctx }) {
  const list = snap.features || [];
  if (!list.some((f) => f.scope)) return <Section title="Features"><FeatureRows list={list} ctx={ctx} /></Section>;
  const other = list.filter((f) => f.scope === 'not_in_release');
  const g = groupByScope(list.filter((f) => f.scope !== 'not_in_release'));
  const { planned } = g;
  const done = planned.filter((f) => f.status === 'passed' || f.status === 'passed_with_backlog').length;
  return (
    <>
      <Section title={`Planned at the cut: ${done} of ${planned.length} passed`}><FeatureRows list={planned} ctx={ctx} /></Section>
      {g.added.length ? (
        <Section title={`Added after the cut (${g.added.length})`}>
          <div className="rt-panel rt-muted" style={{ marginBottom: 8 }} data-testid="rt-added-after-cut">
            {g.added.map((f) => <div key={f.key} style={{ marginBottom: 6 }}><b>{f.key}</b> · added {String(f.added.at || '').slice(0, 10)}{f.added.commit ? ` (${f.added.commit})` : ''} · {f.scope === 'planned' ? 'counted in this release' : 'kept in backlog'} · {f.added.reason || ''}</div>)}
          </div>
          <FeatureRows list={g.added} ctx={ctx} />
        </Section>
      ) : null}
      <Section title={`Backlog: kept on the record, not this release's work (${g.backlog.length})`}><FeatureRows list={g.backlog} ctx={ctx} /></Section>
      {other.length ? <Section title={`Other tracked work (${other.length})`}><FeatureRows list={other} ctx={ctx} /></Section> : null}
    </>
  );
}

function FeatureRows({ list, ctx }) {
  const { snap, href } = ctx;
  if (!list.length) return <div className="rt-panel rt-empty">Nothing here.</div>;
  return (
    <div className="rt-panel"><table>
      <thead><tr><th>Feature</th><th>Status</th><th>Latest test</th><th className="rt-num">Rounds</th><th>Its own bugs verified</th></tr></thead>
      <tbody>{list.map((f) => {
        const r = f.lastResult; const pct = r && r.stepsTotal ? Math.round((r.stepsPassed / r.stepsTotal) * 100) : 0;
        const own = ownBugs(snap, f.key); const v = own.filter((b) => b.status === 'verified').length;
        return (
          <RowLink key={f.key} href={href('feature', f.key)}>
            <td><a className="rt-cell" href={href('feature', f.key)}>{f.key}</a></td>
            <td data-label="Status"><FeatStatus s={f.status} /></td>
            <td data-label="Latest test">{r ? <><div className="rt-num">Round {r.round}: {r.stepsPassed}/{r.stepsTotal} steps{r.baseline ? ` · baseline v${r.baseline}` : ''}</div><div className="rt-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div></> : <span className="rt-muted">Not tested yet</span>}</td>
            <td data-label="Rounds" className="rt-num">{f.rounds}</td>
            <td data-label="Its own bugs verified">{own.length ? <><div className="rt-num">{v} of {own.length}</div><div className="rt-bar" aria-hidden="true"><i style={{ width: `${Math.round((v / own.length) * 100)}%` }} /></div></> : <span className="rt-muted">None of its own</span>}{f.backlog ? <div className="rt-muted">+ {f.backlog} in backlog</div> : null}</td>
          </RowLink>
        );
      })}</tbody>
    </table></div>
  );
}

function BugRows({ list, ctx, showFeature = true }) {
  const { snap, href } = ctx;
  if (!list.length) return <div className="rt-panel rt-empty">No bugs here.</div>;
  return (
    <div className="rt-panel"><table>
      <thead><tr><th>Bug</th>{showFeature ? <th>Feature</th> : null}<th>Status</th><th className="rt-num">Fix attempts</th><th>What fails</th></tr></thead>
      <tbody>{sortBugs(list).map((b) => (
        <RowLink key={b.id} href={href('bug', b.id)}>
          <td className="rt-mono"><a className="rt-cell" href={href('bug', b.id)}>{b.id}</a>{b.carriedOver ? <div className="rt-muted">kept from an earlier run</div> : null}</td>
          {showFeature ? <td data-label="Feature">{b.feature}{b.status === 'reassigned' && b.scope?.owner ? <div className="rt-muted">→ {b.scope.owner}</div> : null}</td> : null}
          <td data-label="Status"><Pill s={b.status} /></td>
          <td className="rt-num" data-label="Fix attempts">{b.attempts || 0} / {snap.maxFixAttemptsPerBug}</td>
          <td data-label="What fails">{b.step}</td>
        </RowLink>
      ))}</tbody>
    </table></div>
  );
}

function AgentRows({ list, ctx }) {
  const { snap, href, now } = ctx;
  const trimmed = snap.agentsTrimmed ? <div className="rt-muted" style={{ fontSize: 13, margin: '6px 0' }}>{snap.agentsTrimmed} older finished agent runs are not shown here to keep the live tracker fast; their full records are in the release logs.</div> : null;
  if (!list.length) return <>{trimmed}<div className="rt-panel rt-empty">No agent runs here.</div></>;
  return (
    <>{trimmed}<div className="rt-panel"><table>
      <thead><tr><th>Agent</th><th>Status</th><th>Result</th><th className="rt-num">Tokens (out / cache read)</th><th>Last activity</th></tr></thead>
      <tbody>{list.map((a) => (
        <RowLink key={a.id} href={href('agent', a.id)}>
          <td><a className="rt-cell" href={href('agent', a.id)}>{agentName(a)}</a><div className="rt-muted">{a.feature || '—'}</div></td>
          <td data-label="Status"><Pill s={a.status} /></td>
          <td data-label="Result">{a.summary || '—'}{a.failures?.length ? <div className="rt-muted">{a.failures.length} command failure{a.failures.length > 1 ? 's' : ''} reported</div> : null}</td>
          <td className="rt-num" data-label="Tokens (out / cache read)">{k(a.tokens?.output)} / {k(a.tokens?.cacheRead)}</td>
          <td className="rt-muted" data-label="Last activity">{ago(a.lastActivityAt, now)}</td>
        </RowLink>
      ))}</tbody>
    </table></div></>
  );
}

function AgentCards({ list, ctx }) {
  const { href, now } = ctx;
  if (!list.length) return <div className="rt-panel rt-empty">No agent is running here right now.</div>;
  return (
    <div className="rt-now">{list.map((a) => (
      <a key={a.id} className="rt-agent" href={href('agent', a.id)}>
        <div className="rt-role">{agentName(a)}</div><div className="rt-feat">{a.feature}</div><div className="rt-act">{a.activity || 'Starting…'}</div>
        {a.role === 'validate' && a.liveSteps ? <div className="rt-meta">{a.liveSteps.checked} checks · {a.liveSteps.passed} passed · <b>{(a.liveSteps.failed || []).length} failed</b></div> : null}
        <div className="rt-meta">Started {ago(a.startedAt, now)} · last step {ago(a.lastActivityAt, now)}</div>
      </a>
    ))}</div>
  );
}

export function RoundLayer(ctx, f, n) {
  const { snap, href } = ctx;
  const agents = snap.agents.filter((a) => a.feature === f.key);
  const STAGE = ['validate', 'triage', 'scope', 'fix', 'reconcile', 'integrate'];
  const inRound = agents.filter((a) => a.round === n || String(a.label || '').includes(`-r${n}`)).sort((x, y) => STAGE.indexOf(x.role) - STAGE.indexOf(y.role));
  const touched = (snap.bugs || []).filter((b) => b.feature === f.key && (b.history || []).some((h) => h.round === n));
  const v = inRound.find((a) => a.role === 'validate');
  return {
    crumbs: [[f.key, href('feature', f.key)], [`Round ${n}`]],
    node: (
      <>
        <div><h3 className="rt-layer-title">{f.key} — round {n}</h3><div className="rt-layer-sub">{v ? <><Pill s={v.status} /> · {v.summary || 'Test in progress'}</> : (f.lastResult && f.lastResult.round === n ? `Result recorded in the release log: ${f.lastResult.stepsPassed}/${f.lastResult.stepsTotal} steps${f.lastResult.report ? ` (${f.lastResult.report})` : ''}` : 'No browser test recorded for this round yet')}</div></div>
        <Section title="Stages in this round"><AgentRows list={inRound} ctx={ctx} /></Section>
        <Section title={`Bugs found, fixed or verified in this round (${touched.length})`}><BugRows list={touched} ctx={ctx} showFeature={false} /></Section>
      </>
    ),
  };
}

export const LAYERS = {
  '': (ctx) => {
    const { snap, href } = ctx;
    const human = STATS.human.count(snap);
    return {
      crumbs: [],
      node: (
        <>
          <TrackerTrends ctx={ctx} />
          <div className="rt-strip">{Object.entries(STATS).map(([key, st]) => (
            <a key={key} className={`rt-stat ${st.tone}`} href={href('stat', key)}><div className="rt-n">{String(st.count(snap))}</div><div className="rt-l">{st.label}</div><div className="rt-go">Open ›</div></a>
          ))}</div>
          {human ? <a className="rt-callout" href={href('stat', 'human')}><b>{human} {human === 1 ? 'bug needs' : 'bugs need'} a person.</b> Open them ›</a> : null}
          <Section title="Agents working now"><AgentCards list={snap.agents.filter((a) => a.status === 'running')} ctx={ctx} /></Section>
          <FeatureSections snap={snap} ctx={ctx} />
        </>
      ),
    };
  },
  stat: (ctx, [key]) => {
    const st = STATS[key]; if (!st) return null;
    if (st.list === 'updates') return LAYERS.updates(ctx, []);
    const items = st.pick(ctx.snap);
    const body = st.list === 'features' ? <FeatureRows list={items} ctx={ctx} /> : st.list === 'bugs' ? <BugRows list={items} ctx={ctx} /> : <AgentRows list={items} ctx={ctx} />;
    return { crumbs: [[st.label]], node: <><div><h3 className="rt-layer-title">{st.label}: {String(st.count(ctx.snap))}</h3><div className="rt-layer-sub">{st.note}</div></div>{body}</> };
  },
  feature: (ctx, [key, sub, n]) => {
    const { snap, href } = ctx;
    const f = snap.features.find((x) => x.key === key); if (!f) return null;
    if (sub === 'round') return RoundLayer(ctx, f, Number(n));
    const agents = snap.agents.filter((a) => a.feature === key);
    const own = ownBugs(snap, key); const backlog = (snap.bugs || []).filter((b) => b.feature === key && BACKLOG.includes(b.status));
    const rounds = [...new Set(agents.map((a) => a.round).filter((r) => r != null))].sort((a, b) => a - b);
    const r = f.lastResult;
    const roundNums = rounds.length ? rounds : (r ? [r.round] : []);
    return {
      crumbs: [[key]],
      node: (
        <>
          <div><h3 className="rt-layer-title">{key}</h3><div className="rt-layer-sub"><FeatStatus s={f.status} /> · {f.rounds} test round{f.rounds === 1 ? '' : 's'}{r ? ` · latest: round ${r.round}, ${r.stepsPassed}/${r.stepsTotal} steps${r.baseline ? ` on baseline v${r.baseline} (scores compare only within one baseline version)` : ''}` : ''}</div></div>
          <Section title="Test rounds">{roundNums.length ? <div className="rt-chips">{roundNums.map((nn) => { const v = agents.find((a) => a.role === 'validate' && a.round === nn); return <a key={nn} className="rt-chip" href={href('feature', key, 'round', nn)}>Round {nn}{v?.summary ? ` · ${v.summary}` : v ? ` · ${STATUS[v.status] || v.status}` : ''}</a>; })}</div> : <div className="rt-panel rt-empty">Not tested yet.</div>}</Section>
          <Section title="Working now"><AgentCards list={agents.filter((a) => a.status === 'running')} ctx={ctx} /></Section>
          <Section title={`Its own bugs (${own.length})`}><BugRows list={own} ctx={ctx} showFeature={false} /></Section>
          {backlog.length ? <Section title={`Moved to backlog (${backlog.length})`}><BugRows list={backlog} ctx={ctx} showFeature={false} /></Section> : null}
          <Section title={`Agent runs (${agents.length})`}><AgentRows list={agents} ctx={ctx} /></Section>
        </>
      ),
    };
  },
  round: (ctx, [key, n]) => { const f = ctx.snap.features.find((x) => x.key === key); return f ? RoundLayer(ctx, f, Number(n)) : null; },
  updates: (ctx) => {
    const { snap, href } = ctx;
    const ups = [...(snap.updates || [])].reverse();
    return {
      crumbs: [['Status updates']],
      node: (
        <>
          <div><h3 className="rt-layer-title">Status updates{snap.release?.version ? ` — release ${snap.release.version}` : ''}</h3><div className="rt-layer-sub">Each update is numbered, pinned to a commit and compared with the one before. Newest first.</div></div>
          {ups.length ? <div className="rt-panel"><table>
            <thead><tr><th>Version</th><th>Headline</th><th>Features passed</th><th className="rt-num">Open bugs</th><th className="rt-num">Verified</th></tr></thead>
            <tbody>{ups.map((u) => (
              <RowLink key={u.version} href={href('update', u.version)}>
                <td className="rt-num"><a className="rt-cell" href={href('update', u.version)}>{u.version}</a><div className="rt-muted">{u.at.replace('T', ' ').slice(0, 16)} UTC</div></td>
                <td data-label="Headline">{u.headline || '—'}</td>
                <td className="rt-num" data-label="Features passed">{u.metrics.featuresPassed} / {u.metrics.featuresTotal}</td>
                <td className="rt-num" data-label="Open bugs">{u.metrics.openBugs}</td>
                <td className="rt-num" data-label="Verified">{u.metrics.verified}</td>
              </RowLink>
            ))}</tbody>
          </table></div> : <div className="rt-panel rt-empty">No updates recorded yet.</div>}
        </>
      ),
    };
  },
  update: (ctx, [v]) => {
    const { snap, href } = ctx;
    const ups = snap.updates || []; const i = ups.findIndex((x) => x.version === v); const u = ups[i]; if (!u) return null;
    const prev = ups[i - 1]; const next = ups[i + 1];
    return {
      crumbs: [['Status updates', href('updates')], [`Update ${v}`]],
      node: (
        <>
          <div><h3 className="rt-layer-title">{u.headline || u.version}</h3><div className="rt-layer-sub">{updateLabel(u)} · commit<Commit snap={snap} c={u.commit} />{prev ? <> · compared with <a href={href('update', prev.version)}>{prev.version}</a></> : ' · baseline'}{next ? <> · next: <a href={href('update', next.version)}>{next.version}</a></> : null}</div></div>
          <section><h2>What happened</h2><div className="rt-panel pad">{u.note}</div></section>
          <Section title="Compared with the previous update"><div className="rt-panel pad"><ul className="rt-md">{(u.comparison?.lines || []).map((l, j) => <li key={j}>{mdb(l)}</li>)}</ul></div></Section>
          {u.comparison?.featureChanges?.length ? <Section title="Feature changes"><div className="rt-panel pad"><ul className="rt-md">{u.comparison.featureChanges.map((l, j) => { const kk = l.split(':')[0]; return <li key={j}><a href={href('feature', kk)}>{kk}</a>{mdb(l.slice(kk.length))}</li>; })}</ul></div></Section> : null}
          <Section title="Every feature at this update"><div className="rt-panel"><table>
            <thead><tr><th>Feature</th><th>Status</th><th>Latest test</th></tr></thead>
            <tbody>{Object.entries(u.metrics.features).map(([kk, f]) => (
              <RowLink key={kk} href={href('feature', kk)}>
                <td><a className="rt-cell" href={href('feature', kk)}>{kk}</a></td><td data-label="Status"><FeatStatus s={f.status} /></td>
                <td className="rt-num" data-label="Latest test">{f.round ? `Round ${f.round}: ${f.score}` : <span className="rt-muted">Not tested yet</span>}</td>
              </RowLink>
            ))}</tbody>
          </table></div></Section>
        </>
      ),
    };
  },
  bug: (ctx, [id]) => {
    const { snap, href } = ctx;
    const b = (snap.bugs || []).find((x) => x.id === id); if (!b) return null;
    const touched = [...new Set((b.history || []).map((h) => h.round).filter((x) => x))];
    return {
      crumbs: [[b.feature, href('feature', b.feature)], [id]],
      node: (
        <>
          <div><h3 className="rt-layer-title">{b.step || id}</h3><div className="rt-layer-sub"><Pill s={b.status} /> · <span className="rt-mono">{id}</span> · fix attempts {b.attempts || 0} of {snap.maxFixAttemptsPerBug}</div></div>
          {b.question ? <div className="rt-callout"><b>Question for you:</b> {b.question}</div> : null}
          <section><h2>Details</h2><div className="rt-panel"><dl className="rt-kv">
            <dt>Root cause</dt><dd>{b.rootCause || '—'}</dd>
            <dt>Class</dt><dd>{b.class || '—'}</dd>
            <dt>Files</dt><dd className="rt-mono">{(b.files || []).join(', ') || '—'}</dd>
            <dt>Whose bug</dt><dd>{b.scope ? <>{SCOPE[b.scope.scope] || b.scope.scope}{b.scope.owner ? <> — <a href={href('feature', b.scope.owner)}>{b.scope.owner}</a></> : null}<div className="rt-muted">{b.scope.evidence} ({b.scope.decidedBy})</div></> : <span className="rt-muted">Not scope-checked yet</span>}</dd>
            <dt>Reported against</dt><dd><a href={href('feature', b.feature)}>{b.feature}</a>{touched.length ? <> · rounds {touched.map((nn, j) => <React.Fragment key={nn}>{j ? ', ' : ''}<a href={href('feature', b.feature, 'round', nn)}>{nn}</a></React.Fragment>)}</> : null}</dd>
          </dl></div></section>
          <Section title="History"><div className="rt-panel"><ul className="rt-timeline">{(b.history || []).length ? b.history.map((h, j) => (
            <li key={j}><span className="rt-muted">{h.round ? <a href={href('feature', b.feature, 'round', h.round)}>R{h.round}</a> : 'Build'}</span><span><b>{EVENT[h.event] || h.event}</b></span><span>{h.note}{h.files?.length ? <> <span className="rt-mono rt-muted">{h.files.join(', ')}</span></> : null}<Commit snap={snap} c={h.commit} /></span></li>
          )) : <li className="rt-muted">No history recorded.</li>}</ul></div></Section>
        </>
      ),
    };
  },
  agent: (ctx, [id]) => {
    const { snap, href, now } = ctx;
    const a = (snap.agents || []).find((x) => x.id === id); if (!a) return null;
    const ls = a.liveSteps;
    const crumbs = a.feature ? [[a.feature, href('feature', a.feature)], ...(a.round ? [[`Round ${a.round}`, href('feature', a.feature, 'round', a.round)]] : []), [agentName(a)]] : [[agentName(a)]];
    return {
      crumbs,
      node: (
        <>
          <div><h3 className="rt-layer-title">{agentName(a)}{a.feature ? ` — ${a.feature}` : ''}</h3><div className="rt-layer-sub"><Pill s={a.status} /> · <span className="rt-mono">{a.label}</span></div></div>
          <section><h2>Details</h2><div className="rt-panel"><dl className="rt-kv">
            <dt>Result</dt><dd>{a.summary || '—'}</dd>
            <dt>Latest step</dt><dd className="rt-mono">{a.activity || '—'}</dd>
            <dt>Started</dt><dd>{ago(a.startedAt, now)}</dd>
            <dt>Last activity</dt><dd>{ago(a.lastActivityAt, now)}</dd>
            <dt>Tokens</dt><dd className="rt-num">{k(a.tokens?.input)} in · {k(a.tokens?.cacheWrite)} cache write · {k(a.tokens?.cacheRead)} cache read · {k(a.tokens?.output)} out</dd>
          </dl></div></section>
          {ls ? <Section title="Live test log"><div className="rt-panel">
            <dl className="rt-kv"><dt>Checks logged</dt><dd>{ls.checked} ({ls.passed} passed)</dd></dl>
            {ls.failedTotal > (ls.failed || []).length ? <div className="rt-muted" style={{ padding: '0 14px' }}>Showing {(ls.failed || []).length} of {ls.failedTotal} failed checks; the full log is in the round's test report.</div> : null}
            {(ls.failed || []).length ? <ul className="rt-timeline">{ls.failed.map((f, j) => <li key={j}><span className="rt-muted">Failed</span><b>{f.step}</b><span>Expected: {f.expect || '—'}<br />Saw: {f.seen || '—'}</span></li>)}</ul> : null}
            {(ls.errors || []).length ? <ul className="rt-timeline">{ls.errors.map((e, j) => <li key={j}><span className="rt-muted">Error</span><b>{e.type}</b><span>{e.detail}</span></li>)}</ul> : null}
          </div></Section> : null}
          {a.signals?.length ? <Section title="Page errors and failed requests seen"><div className="rt-panel"><ul className="rt-timeline">{a.signals.map((e, j) => <li key={j}><span className="rt-muted">Seen</span><b>{e.type}</b><span>{e.detail}</span></li>)}</ul></div></Section> : null}
          {a.failures?.length ? <Section title={`Command failures it reported (${a.failures.length})`}><div className="rt-panel"><ul className="rt-timeline">{a.failures.map((f, j) => <li key={j}><span className="rt-muted">#{j + 1}</span><span /><span>{typeof f === 'string' ? f : JSON.stringify(f)}</span></li>)}</ul></div></Section> : null}
        </>
      ),
    };
  },
};

export { Section, FeatureRows, BugRows, AgentRows, AgentCards, ROLE };
