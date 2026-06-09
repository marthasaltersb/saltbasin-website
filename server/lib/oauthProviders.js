// OAuth 2.0 provider configurations.
// Each entry defines the authorization URL, token URL, scopes, and how to
// fetch a basic identity record after authorization.
//
// Env vars required (add to .env and Render/Netlify):
//   MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET
//   SALESFORCE_CLIENT_ID / SALESFORCE_CLIENT_SECRET
//   QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET
//   LINKEDIN_CLIENT_ID  / LINKEDIN_CLIENT_SECRET
//   SUPABASE_CLIENT_ID  / SUPABASE_CLIENT_SECRET  (Supabase partner program)
//   WORKDAY_CLIENT_ID   / WORKDAY_CLIENT_SECRET    (per-tenant — see docs)
//   SNOWFLAKE_CLIENT_ID / SNOWFLAKE_CLIENT_SECRET  (per-account — account ID supplied at connect)
//   TABLEAU_CLIENT_ID   / TABLEAU_CLIENT_SECRET    (Tableau Cloud Connected App)
//   ZUORA_CLIENT_ID     / ZUORA_CLIENT_SECRET      (client_credentials flow)
//   DEALHUB_CLIENT_ID   / DEALHUB_CLIENT_SECRET
//   MARKETO_CLIENT_ID   / MARKETO_CLIENT_SECRET    (client_credentials — Munchkin ID at connect)
//   HUBSPOT_CLIENT_ID   / HUBSPOT_CLIENT_SECRET
//   SAP_CLIENT_ID       / SAP_CLIENT_SECRET        (BTP subaccount — tenant URL at connect)
//   ORACLE_CLIENT_ID    / ORACLE_CLIENT_SECRET      (Cloud tenant URL at connect)
//   APP_BASE_URL  (e.g. https://saltbasin.net)

const base = () => process.env.APP_BASE_URL || 'http://localhost:3001';

export const PROVIDERS = {
  microsoft: {
    id: 'microsoft',
    label: 'Microsoft',
    icon: '🪟',
    description: 'Excel, SharePoint, Azure SQL, Dynamics 365',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['offline_access', 'Files.ReadWrite', 'Sites.ReadWrite.All', 'User.Read'],
    clientId: () => process.env.MICROSOFT_CLIENT_ID,
    clientSecret: () => process.env.MICROSOFT_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/microsoft/callback`,
    async fetchIdentity(accessToken) {
      const r = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();
      return { externalId: d.id, label: d.displayName || d.mail };
    },
  },

  salesforce: {
    id: 'salesforce',
    label: 'Salesforce',
    icon: '☁️',
    description: 'CRM — accounts, opportunities, contacts, pipeline',
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token', 'offline_access'],
    clientId: () => process.env.SALESFORCE_CLIENT_ID,
    clientSecret: () => process.env.SALESFORCE_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/salesforce/callback`,
    async fetchIdentity(accessToken, extra) {
      // Salesforce returns instance_url in the token response
      const instanceUrl = extra?.instanceUrl || 'https://login.salesforce.com';
      const r = await fetch(`${instanceUrl}/services/oauth2/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();
      return { externalId: d.user_id, label: d.name || d.email, instanceUrl };
    },
  },

  quickbooks: {
    id: 'quickbooks',
    label: 'QuickBooks',
    icon: '📊',
    description: 'Invoices, P&L, payments, AR/AP, financial statements',
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scopes: ['com.intuit.quickbooks.accounting'],
    clientId: () => process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: () => process.env.QUICKBOOKS_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/quickbooks/callback`,
    async fetchIdentity(accessToken, extra) {
      return { externalId: extra?.realmId, label: `QuickBooks (${extra?.realmId})` };
    },
  },

  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '🔗',
    description: 'Your own profile data — name, headline, positions, skills',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_liteprofile', 'r_emailaddress'],
    clientId: () => process.env.LINKEDIN_CLIENT_ID,
    clientSecret: () => process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/linkedin/callback`,
    async fetchIdentity(accessToken) {
      const r = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();
      const name = [d.localizedFirstName, d.localizedLastName].filter(Boolean).join(' ');
      return { externalId: d.id, label: name || 'LinkedIn Profile' };
    },
  },

  supabase: {
    id: 'supabase',
    label: 'Supabase',
    icon: '⚡',
    description: 'Your Supabase project — query any table directly',
    // Supabase Management API OAuth (partner program required).
    // Falls back to personal access token flow if CLIENT_ID is not set.
    authUrl: 'https://api.supabase.com/v1/oauth/authorize',
    tokenUrl: 'https://api.supabase.com/v1/oauth/token',
    scopes: ['all'],
    clientId: () => process.env.SUPABASE_CLIENT_ID,
    clientSecret: () => process.env.SUPABASE_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/supabase/callback`,
    // Supabase uses personal access tokens if not in partner program
    supportsPatFallback: true,
    async fetchIdentity(accessToken) {
      const r = await fetch('https://api.supabase.com/v1/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();
      return { externalId: d.id, label: d.username || d.primary_email };
    },
  },

  workday: {
    id: 'workday',
    label: 'Workday',
    icon: '🏢',
    description: 'Jobs, candidates, employees — requires IT setup in your Workday tenant',
    authUrl: null, // set dynamically from member's tenantUrl
    tokenUrl: null,
    scopes: ['openid', 'profile'],
    clientId: () => process.env.WORKDAY_CLIENT_ID,
    clientSecret: () => process.env.WORKDAY_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/workday/callback`,
    requiresTenantUrl: true,
    async fetchIdentity(accessToken) {
      return { externalId: 'workday', label: 'Workday' };
    },
  },

  snowflake: {
    id: 'snowflake',
    label: 'Snowflake',
    icon: '❄️',
    description: 'Data cloud — query any warehouse, schema, or table',
    // Auth URL is per-account: https://<account>.snowflakecomputing.com/oauth/authorize
    authUrl: null, // set dynamically from accountId
    tokenUrl: null,
    scopes: ['session:role:PUBLIC'],
    clientId: () => process.env.SNOWFLAKE_CLIENT_ID,
    clientSecret: () => process.env.SNOWFLAKE_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/snowflake/callback`,
    requiresAccountId: true, // member supplies <account>.snowflakecomputing.com
    async fetchIdentity(accessToken, extra) {
      return { externalId: extra?.accountId, label: `Snowflake (${extra?.accountId || 'account'})` };
    },
  },

  tableau: {
    id: 'tableau',
    label: 'Tableau',
    icon: '📈',
    description: 'Tableau Cloud — workbooks, data sources, published views',
    // Tableau Cloud Connected Apps use JWT auth; OAuth via site-level app.
    authUrl: 'https://sso.online.tableau.com/public/idp/SSO',
    tokenUrl: 'https://api.online.tableau.com/v1/auth/token',
    scopes: ['tableau:views:read', 'tableau:datasources:read'],
    clientId: () => process.env.TABLEAU_CLIENT_ID,
    clientSecret: () => process.env.TABLEAU_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/tableau/callback`,
    requiresTenantUrl: true, // member provides their Tableau Cloud site URL
    async fetchIdentity(accessToken, extra) {
      return { externalId: extra?.siteId, label: `Tableau (${extra?.siteName || 'site'})` };
    },
  },

  zuora: {
    id: 'zuora',
    label: 'Zuora',
    icon: '💳',
    description: 'Subscription billing — accounts, subscriptions, invoices, revenue',
    // Zuora uses client_credentials (no user redirect). Member supplies their own client ID/secret.
    authUrl: null,
    tokenUrl: 'https://rest.zuora.com/oauth/token', // or sandbox: rest.apisandbox.zuora.com
    scopes: [],
    clientId: () => process.env.ZUORA_CLIENT_ID,
    clientSecret: () => process.env.ZUORA_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/zuora/callback`,
    grantType: 'client_credentials', // no user-facing redirect
    async fetchIdentity(accessToken) {
      return { externalId: 'zuora', label: 'Zuora' };
    },
  },

  dealhub: {
    id: 'dealhub',
    label: 'DealHub',
    icon: '🤝',
    description: 'CPQ & CLM — quotes, contracts, deal rooms, approval workflows',
    authUrl: 'https://app.dealhub.io/oauth/authorize',
    tokenUrl: 'https://app.dealhub.io/oauth/token',
    scopes: ['read', 'write'],
    clientId: () => process.env.DEALHUB_CLIENT_ID,
    clientSecret: () => process.env.DEALHUB_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/dealhub/callback`,
    async fetchIdentity(accessToken) {
      const r = await fetch('https://app.dealhub.io/api/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) return { externalId: 'dealhub', label: 'DealHub' };
      const d = await r.json();
      return { externalId: d.id || 'dealhub', label: d.name || d.email || 'DealHub' };
    },
  },

  marketo: {
    id: 'marketo',
    label: 'Marketo',
    icon: '📣',
    description: 'Marketing automation — leads, campaigns, programs, activity logs',
    // Marketo uses client_credentials only. Member provides their Munchkin ID (REST endpoint).
    authUrl: null,
    tokenUrl: null, // built dynamically: https://<munchkinId>.mktorest.com/identity/oauth/token
    scopes: [],
    clientId: () => process.env.MARKETO_CLIENT_ID,
    clientSecret: () => process.env.MARKETO_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/marketo/callback`,
    grantType: 'client_credentials',
    requiresMunchkinId: true, // member supplies their Munchkin account ID
    async fetchIdentity(accessToken, extra) {
      return { externalId: extra?.munchkinId, label: `Marketo (${extra?.munchkinId || 'account'})` };
    },
  },

  hubspot: {
    id: 'hubspot',
    label: 'HubSpot',
    icon: '🟠',
    description: 'CRM & marketing — contacts, deals, companies, emails, workflows',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['crm.objects.contacts.read', 'crm.objects.deals.read', 'crm.objects.companies.read', 'oauth'],
    clientId: () => process.env.HUBSPOT_CLIENT_ID,
    clientSecret: () => process.env.HUBSPOT_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/hubspot/callback`,
    async fetchIdentity(accessToken) {
      const r = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken);
      if (!r.ok) return { externalId: 'hubspot', label: 'HubSpot' };
      const d = await r.json();
      return { externalId: String(d.hub_id), label: d.hub_domain || `HubSpot (${d.hub_id})` };
    },
  },

  sap: {
    id: 'sap',
    label: 'SAP',
    icon: '🔷',
    description: 'SAP BTP / S/4HANA — financials, procurement, HR, analytics',
    // SAP BTP token URL is subaccount-specific. Member supplies their subdomain.
    authUrl: null, // https://<subdomain>.authentication.<region>.hana.ondemand.com/oauth/authorize
    tokenUrl: null,
    scopes: ['openid'],
    clientId: () => process.env.SAP_CLIENT_ID,
    clientSecret: () => process.env.SAP_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/sap/callback`,
    requiresTenantUrl: true, // member provides subaccount URL
    async fetchIdentity(accessToken, extra) {
      return { externalId: extra?.subdomain, label: `SAP (${extra?.subdomain || 'account'})` };
    },
  },

  oracle: {
    id: 'oracle',
    label: 'Oracle',
    icon: '🔴',
    description: 'Oracle Cloud — ERP, EPM, HCM, NetSuite financials',
    // Oracle Cloud tenant URL is customer-specific. Member supplies their identity domain URL.
    authUrl: null, // https://<tenant>.identity.oraclecloud.com/oauth2/v1/authorize
    tokenUrl: null,
    scopes: ['openid', 'profile', 'urn:opc:idm:__myscopes__'],
    clientId: () => process.env.ORACLE_CLIENT_ID,
    clientSecret: () => process.env.ORACLE_CLIENT_SECRET,
    redirectUri: () => `${base()}/api/oauth/oracle/callback`,
    requiresTenantUrl: true,
    async fetchIdentity(accessToken, extra) {
      return { externalId: extra?.tenantUrl, label: `Oracle (${extra?.tenantUrl || 'cloud'})` };
    },
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS);

// Build the authorization redirect URL for a given provider + state.
// Providers with grantType:'client_credentials' skip this step entirely.
export function buildAuthUrl(providerId, state, extra = {}) {
  const p = PROVIDERS[providerId];
  if (!p) throw new Error(`Unknown provider: ${providerId}`);
  if (p.grantType === 'client_credentials') throw new Error(`${providerId} uses client_credentials — no redirect needed`);

  let authUrl = p.authUrl;

  // Providers with tenant-dynamic auth URLs
  if (providerId === 'workday') {
    if (!extra.tenantUrl) throw new Error('Workday requires tenantUrl');
    authUrl = `${extra.tenantUrl}/ccx/api/oauth2/${extra.tenantId || 'tenant'}/authorize`;
  } else if (providerId === 'snowflake') {
    if (!extra.accountId) throw new Error('Snowflake requires accountId (e.g. myorg-myaccount)');
    authUrl = `https://${extra.accountId}.snowflakecomputing.com/oauth/authorize`;
  } else if (providerId === 'sap') {
    if (!extra.tenantUrl) throw new Error('SAP requires tenantUrl (subaccount URL)');
    authUrl = `${extra.tenantUrl}/oauth/authorize`;
  } else if (providerId === 'oracle') {
    if (!extra.tenantUrl) throw new Error('Oracle requires tenantUrl (identity domain URL)');
    authUrl = `${extra.tenantUrl}/oauth2/v1/authorize`;
  } else if (providerId === 'tableau') {
    if (!extra.tenantUrl) throw new Error('Tableau requires tenantUrl (site URL)');
    authUrl = `${extra.tenantUrl}/auth/oauth/authorize`;
  }

  if (!authUrl) throw new Error(`${providerId} has no authUrl configured`);

  const params = new URLSearchParams({
    client_id: p.clientId(),
    redirect_uri: p.redirectUri(),
    response_type: 'code',
    scope: p.scopes.join(' '),
    state,
  });

  if (providerId === 'quickbooks' && extra.realmId) params.set('realm_id', extra.realmId);

  return `${authUrl}?${params.toString()}`;
}

// Obtain tokens via client_credentials (no user redirect).
// Used by Zuora, Marketo (and Snowflake optionally).
export async function clientCredentialsToken(providerId, extra = {}) {
  const p = PROVIDERS[providerId];

  let tokenUrl = p.tokenUrl;
  if (providerId === 'marketo') {
    if (!extra.munchkinId) throw new Error('Marketo requires munchkinId');
    tokenUrl = `https://${extra.munchkinId}.mktorest.com/identity/oauth/token`;
  } else if (providerId === 'snowflake') {
    if (!extra.accountId) throw new Error('Snowflake requires accountId');
    tokenUrl = `https://${extra.accountId}.snowflakecomputing.com/oauth/token-request`;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: p.clientId(),
    client_secret: p.clientSecret(),
  });

  const r = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`client_credentials failed for ${providerId}: ${r.status} ${txt}`);
  }
  return r.json();
}

// Exchange authorization code for tokens.
export async function exchangeCode(providerId, code, extra = {}) {
  const p = PROVIDERS[providerId];

  let tokenUrl = p.tokenUrl;
  if (providerId === 'workday' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/ccx/api/oauth2/${extra.tenantId || 'tenant'}/token`;
  } else if (providerId === 'snowflake' && extra.accountId) {
    tokenUrl = `https://${extra.accountId}.snowflakecomputing.com/oauth/token-request`;
  } else if (providerId === 'sap' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/oauth/token`;
  } else if (providerId === 'oracle' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/oauth2/v1/token`;
  } else if (providerId === 'tableau' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/auth/oauth/token`;
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: p.redirectUri(),
    client_id: p.clientId(),
    client_secret: p.clientSecret(),
  });

  const r = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Token exchange failed for ${providerId}: ${r.status} ${txt}`);
  }

  const tokens = await r.json();
  return tokens; // { access_token, refresh_token, expires_in, ... }
}

// Refresh an expired access token.
export async function refreshToken(providerId, storedRefreshToken, extra = {}) {
  const p = PROVIDERS[providerId];

  // client_credentials providers don't have refresh tokens — re-fetch instead.
  if (p.grantType === 'client_credentials') {
    return clientCredentialsToken(providerId, extra);
  }

  let tokenUrl = p.tokenUrl;
  if (providerId === 'workday' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/ccx/api/oauth2/${extra.tenantId || 'tenant'}/token`;
  } else if (providerId === 'snowflake' && extra.accountId) {
    tokenUrl = `https://${extra.accountId}.snowflakecomputing.com/oauth/token-request`;
  } else if (providerId === 'sap' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/oauth/token`;
  } else if (providerId === 'oracle' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/oauth2/v1/token`;
  } else if (providerId === 'tableau' && extra.tenantUrl) {
    tokenUrl = `${extra.tenantUrl}/auth/oauth/token`;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: storedRefreshToken,
    client_id: p.clientId(),
    client_secret: p.clientSecret(),
  });

  const r = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Token refresh failed for ${providerId}: ${r.status} ${txt}`);
  }

  return r.json();
}
