// integrations.memberDbs[] holds a member/org's own external database
// connections (server/routes/memberAgent.js's query_db_{id} tool gives the
// agent a live, read-only-by-default SQL tool per configured source). The
// connection string was stored as plaintext JSON in member_configs.data —
// unlike OAuth tokens, which are already AES-256-GCM encrypted (crypto.js) —
// flagged in HANDOVER_member_security_and_identity_graph.md as the natural
// follow-on to the anthropicKey encryption fix. This module is the one place
// that reads/writes a memberDbs entry's connection string, so
// memberConfig.js's PUT /draft (the only place a real url is ever accepted)
// and memberAgent.js's pool-builder + get_config tool (which must only ever
// see the encrypted/redacted shape) can't drift out of sync with each other.

import { encrypt, decrypt } from './crypto.js';

// What the client is allowed to see: never url, never urlEnc — just whether
// a connection string is currently configured.
export function redactMemberDbsForClient(memberDbs) {
  return (memberDbs || []).map(({ url, urlEnc, clearUrl, ...rest }) => ({
    ...rest,
    urlConfigured: !!urlEnc,
  }));
}

// Reconciles an incoming memberDbs array (a PUT /draft body) against the
// previously stored one. Since GET always redacts the real url, every
// untouched item arrives back with no `url` field at all — that must leave
// the existing encrypted connection alone, not clear it. Disconnecting a
// source is therefore an explicit `clearUrl: true` on that item (see
// ConfigPanel.jsx's MemberDbsCard "Disconnect" action), not an empty string,
// since an empty/absent url is also the default shape of every item the
// client never touched.
export function mergeMemberDbsForStorage(incomingDbs, existingDbs) {
  const existingById = new Map((existingDbs || []).map((d) => [d.id, d]));
  return (incomingDbs || []).map((item) => {
    const { url, urlEnc: _ignoredClientEnc, clearUrl, urlConfigured: _ignoredClientFlag, ...rest } = item;
    const prior = existingById.get(item.id);
    let urlEnc;
    if (url) urlEnc = encrypt(url);
    else if (clearUrl) urlEnc = undefined;
    else urlEnc = prior?.urlEnc;
    return urlEnc ? { ...rest, urlEnc } : rest;
  });
}

export function decryptMemberDbUrl(dbCfg) {
  return dbCfg?.urlEnc ? decrypt(dbCfg.urlEnc) : null;
}
