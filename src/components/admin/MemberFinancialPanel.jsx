import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const card = { border: '1px solid rgba(196,132,58,.24)', borderRadius: 12, padding: '1rem', background: 'rgba(255,255,255,.72)' };
const input = { width: '100%', padding: '.65rem', border: '1px solid rgba(20,35,58,.2)', borderRadius: 7, background: '#fff' };

export default function MemberFinancialPanel() {
  const [catalog, setCatalog] = useState(null);
  const [data, setData] = useState({ connections: [], accounts: [] });
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ providerId: '', permittedAccountClasses: [] });

  const load = async () => {
    const [nextCatalog, nextData] = await Promise.all([api.getFinancialProviders(), api.getFinancialConnections()]);
    setCatalog(nextCatalog);
    setForm((current) => current.providerId ? current : {
      providerId: nextCatalog.policy.experience.defaultProviderId,
      permittedAccountClasses: nextCatalog.policy.experience.defaultPermittedAccountClasses,
    });
    setData(nextData);
  };

  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);
  const selectedProvider = useMemo(() => catalog?.providers?.find((item) => item.providerId === form.providerId), [catalog, form.providerId]);

  const toggleClass = (value) => setForm((current) => ({
    ...current,
    permittedAccountClasses: current.permittedAccountClasses.includes(value)
      ? current.permittedAccountClasses.filter((item) => item !== value)
      : [...current.permittedAccountClasses, value],
  }));

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.createFinancialConnection(form);
      await load();
      toast.success('Private financial connection created');
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  };

  const revoke = async (id) => {
    setBusy(true);
    try { await api.revokeFinancialConnection(id); await load(); toast.success('Connection revoked'); }
    catch (error) { toast.error(error.message); } finally { setBusy(false); }
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', color: 'var(--sb-navy)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <header>
          <div className="sb-kicker">{catalog?.policy?.experience?.kicker}</div>
          <h1 className="sb-display" style={{ margin: '.25rem 0' }}>{catalog?.policy?.experience?.title}</h1>
          <p style={{ maxWidth: 760 }}>{catalog?.policy?.experience?.privacyNotice}</p>
        </header>

        <form onSubmit={create} style={card}>
          <h2 style={{ marginTop: 0 }}>Add a connection</h2>
          <label>Provider<select style={{ ...input, marginTop: '.35rem' }} value={form.providerId} onChange={(event) => setForm((value) => ({ ...value, providerId: event.target.value }))}>
            {(catalog?.providers || []).map((provider) => <option key={provider.providerId} value={provider.providerId} disabled={provider.availability === 'configuration_required'}>{provider.label}{provider.availability === 'configuration_required' ? ' — setup required' : ''}</option>)}
          </select></label>
          <fieldset style={{ border: 0, padding: '1rem 0' }}><legend>Permitted account classes</legend>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>{(selectedProvider?.supportedAccountClasses || []).map((value) => <label key={value}><input type="checkbox" checked={form.permittedAccountClasses.includes(value)} onChange={() => toggleClass(value)} /> {value.replaceAll('_', ' ')}</label>)}</div>
          </fieldset>
          <button className="sb-btn sb-btn-primary" disabled={busy || !form.permittedAccountClasses.length}>Create private connection</button>
        </form>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Connections</h2>
          {!data.connections.length ? <p>No financial connections configured.</p> : data.connections.map((connection) => (
            <div key={connection.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem 0', borderTop: '1px solid rgba(20,35,58,.1)' }}>
              <div><strong>{connection.provider_id}</strong><div style={{ fontSize: '.8rem' }}>{connection.status} · {connection.data_scope}</div></div>
              {connection.status !== 'revoked' && <button className="sb-btn sb-btn-outline" disabled={busy} onClick={() => revoke(connection.id)}>Revoke</button>}
            </div>
          ))}
        </section>

        <section style={card}><h2 style={{ marginTop: 0 }}>Accounts</h2><p>{data.accounts.length ? `${data.accounts.length} active account reference(s).` : 'No account references imported yet.'}</p><small>{catalog?.policy?.experience?.credentialsNotice}</small></section>
      </div>
    </div>
  );
}
