import crypto from 'node:crypto';

const keyName = (providerKey, suffix) => `ORG_SSO_${String(providerKey || '').replace(/[^a-z0-9]/gi, '_').toUpperCase()}_${suffix}`;

export function organizationSsoConfig(providerKey) {
  const issuer = process.env[keyName(providerKey, 'ISSUER_URL')]?.replace(/\/$/, '');
  const clientId = process.env[keyName(providerKey, 'CLIENT_ID')];
  const clientSecret = process.env[keyName(providerKey, 'CLIENT_SECRET')];
  if (!issuer || !clientId || !clientSecret) return null;
  return { issuer, clientId, clientSecret, scope: process.env[keyName(providerKey, 'SCOPE')] || 'openid profile email' };
}

export async function discoverOidc(config) {
  const response = await fetch(`${config.issuer}/.well-known/openid-configuration`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`OIDC discovery failed (${response.status})`);
  const metadata = await response.json();
  if (!metadata.authorization_endpoint || !metadata.token_endpoint || !metadata.userinfo_endpoint) throw new Error('OIDC provider is missing required endpoints');
  if (metadata.issuer && metadata.issuer.replace(/\/$/, '') !== config.issuer) throw new Error('OIDC issuer mismatch');
  return metadata;
}

export const hashSsoState = (state) => crypto.createHash('sha256').update(state).digest('hex');
export const randomSsoValue = () => crypto.randomBytes(32).toString('base64url');

export async function exchangeOidcCode({ config, metadata, code, redirectUri, expectedNonce }) {
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: config.clientId, client_secret: config.clientSecret });
  const tokenResponse = await fetch(metadata.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body });
  if (!tokenResponse.ok) throw new Error(`OIDC token exchange failed (${tokenResponse.status})`);
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) throw new Error('OIDC access token missing');
  if (!tokens.id_token) throw new Error('OIDC ID token missing');
  let claims;
  try { claims = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf8')); } catch { throw new Error('OIDC ID token is invalid'); }
  if (claims.nonce !== expectedNonce) throw new Error('OIDC nonce mismatch');
  if (claims.iss && String(claims.iss).replace(/\/$/, '') !== config.issuer) throw new Error('OIDC token issuer mismatch');
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(config.clientId)) throw new Error('OIDC token audience mismatch');
  if (!claims.exp || Number(claims.exp) * 1000 <= Date.now()) throw new Error('OIDC ID token expired');
  const userResponse = await fetch(metadata.userinfo_endpoint, { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' } });
  if (!userResponse.ok) throw new Error(`OIDC user info failed (${userResponse.status})`);
  return userResponse.json();
}
