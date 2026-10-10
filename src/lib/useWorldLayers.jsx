// The World Shell layer stack as a hook + context (see worldLayers.js).
// The URL is the source of truth: every operation is a navigate() so browser
// Back/Forward, refresh and shared links all agree with the in-app controls.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseAt, serializeAt, searchFor, trailKeyOf, sameLayer, structuralProblem, readLayerUi, writeLayerUi } from './worldLayers.js';

const LayersContext = createContext(null);
export const WorldLayersProvider = LayersContext.Provider;
export function useWorldLayersContext() { return useContext(LayersContext); }

// `validate(stack)` -> { stack, problem } lets the shell check data-dependent
// validity (permitted island, existing opportunity). Structural problems are
// handled here. A problem truncates the URL (replace) and shows a visible note.
export function useWorldLayers(validate) {
  const nav = useNavigate();
  const loc = useLocation();
  const at = new URLSearchParams(loc.search).get('at') || '';
  const raw = useMemo(() => parseAt(at), [at]);
  const [labels, setLabels] = useState({});
  const [note, setNote] = useState('');

  const { stack, problem } = useMemo(() => {
    const out = [];
    for (let i = 0; i < raw.length; i += 1) {
      const why = structuralProblem(raw[i], out[i - 1], i);
      if (why) return { stack: out, problem: { layer: raw[i], why } };
      out.push(raw[i]);
    }
    const v = validate ? validate(out) : { stack: out };
    return { stack: v.stack, problem: v.problem || null };
  }, [raw, validate]);

  const stackRef = useRef(stack);
  stackRef.current = stack;
  const trailKey = trailKeyOf(stack);
  const trailKeyRef = useRef(trailKey);
  trailKeyRef.current = trailKey;

  const searchRef = useRef(loc.search);
  searchRef.current = loc.search;
  // Remember the URL of every history entry this page visited, so a pop that retraces the
  // path (crumb, Escape, a Back button) is a real history.back() - then the browser's own
  // Back/Forward stay in step with the stack instead of piling up forward entries.
  const seenRef = useRef({});
  const historyIdx = typeof window !== 'undefined' ? (window.history.state?.idx ?? 0) : 0;
  seenRef.current[historyIdx] = loc.search || '';
  const historyIdxRef = useRef(historyIdx);
  historyIdxRef.current = historyIdx;
  const go = useCallback((next, opts = {}) => {
    const search = searchFor(next);
    if (!opts.replace && search === (searchRef.current || '')) return; // already there: no duplicate history entry
    nav({ pathname: '/world', search }, { replace: !!opts.replace });
  }, [nav]);

  const goPop = useCallback((next) => {
    const target = searchFor(next);
    const idx = historyIdxRef.current;
    for (let k = 1; k <= idx; k += 1) {
      const seen = seenRef.current[idx - k];
      if (seen === undefined) break;
      if (seen === target) { nav(-k); return; }
    }
    go(next);
  }, [go, nav]);

  const rememberLabel = useCallback((layer, label) => {
    if (!label) return;
    const k = `${layer.kind}:${layer.key}`;
    setLabels((m) => (m[k] === label ? m : { ...m, [k]: label }));
  }, []);

  const push = useCallback((layer) => {
    const cur = stackRef.current;
    const next = { kind: layer.kind, key: layer.key == null ? '' : String(layer.key) };
    if (sameLayer(cur[cur.length - 1], next)) return;
    if (layer.label) rememberLabel(next, layer.label);
    setNote('');
    go([...cur, next]);
  }, [go, rememberLabel]);
  const pop = useCallback(() => { const cur = stackRef.current; if (cur.length) { setNote(''); goPop(cur.slice(0, -1)); } }, [goPop]);
  // index -1 = the Sun (root)
  const popTo = useCallback((index) => { const cur = stackRef.current; if (index < cur.length - 1) { setNote(''); goPop(cur.slice(0, index + 1)); } }, [goPop]);
  const reset = useCallback((layers) => {
    const next = layers.map((l) => ({ kind: l.kind, key: l.key == null ? '' : String(l.key) }));
    layers.forEach((l, i) => { if (l.label) rememberLabel(next[i], l.label); });
    setNote('');
    go(next);
  }, [go, rememberLabel]);
  // A component discovered that layer `index` no longer resolves (output deleted,
  // permission removed): fall back to the layer above it and say so.
  const invalidate = useCallback((index, why) => {
    const cur = stackRef.current;
    if (index >= cur.length) return;
    setNote(why);
    go(cur.slice(0, index), { replace: true });
  }, [go]);

  // Problems found by validation: fix the URL once (replace) and show the note.
  const problemKey = problem ? `${problem.layer.kind}:${problem.layer.key}:${problem.why}` : '';
  useEffect(() => {
    if (!problem) return;
    const name = problem.layer.key ? `${problem.layer.kind} ${problem.layer.key}` : problem.layer.kind;
    setNote(`The link pointed to "${name}", which is not available here (${problem.why}). Showing the deepest layer that is.`);
    go(stackRef.current, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemKey]);

  const saveUi = useCallback((patch, key) => writeLayerUi(key || trailKeyRef.current, patch), []);
  const getUi = useCallback((key) => readLayerUi(key || trailKeyRef.current), []);

  return {
    stack, labels, note, clearNote: () => setNote(''),
    trailKey, trailKeyRef, push, pop, popTo, reset, invalidate, rememberLabel, saveUi, getUi,
    serialized: serializeAt(stack),
  };
}
