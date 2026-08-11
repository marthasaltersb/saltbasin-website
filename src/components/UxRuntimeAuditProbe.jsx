import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { publishUxRuntimeAudit } from '../lib/uxRuntimeAudit.js';

export default function UxRuntimeAuditProbe() {
  const location = useLocation();
  const [report, setReport] = useState(null);
  if (typeof window !== 'undefined') window.__SB_RUN_UX_AUDIT__ = () => { const next = publishUxRuntimeAudit(document); setReport(next); return next; };
  useEffect(() => {
    const run = () => { const next = publishUxRuntimeAudit(document); setReport(next); };
    let timer = window.setTimeout(run, 1200);
    const rerun = () => { window.clearTimeout(timer); timer = window.setTimeout(run, 300); };
    const observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => mutation.target.closest?.('[data-ux-audit-probe]'))) return;
      rerun();
    });
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    window.addEventListener('resize', rerun);
    return () => { window.clearTimeout(timer); observer.disconnect(); window.removeEventListener('resize', rerun); };
  }, [location.pathname, location.search]);
  return <output data-ux-audit-probe="active" hidden>{report ? JSON.stringify(report) : ''}</output>;
}
