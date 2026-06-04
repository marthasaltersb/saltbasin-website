// Push selected env vars from .env to GitHub Actions repository secrets.
//
// Why: workflows like render-deploy-monitor.yml need RENDER_API_KEY and
// RENDER_SERVICE_ID as GitHub Actions secrets to call Render's API from a
// runner. Rather than copy/pasting them into the GitHub web UI, this script
// reads them from .env and PUTs them via the GitHub REST API.
//
// Usage:
//   node scripts/push-github-secrets.mjs
//
// Requires in .env (in addition to the secrets being pushed):
//   GITHUB_TOKEN  — Personal Access Token with secrets:write on the repo
//                   (classic with `repo` scope, OR fine-grained with
//                   "Repository secrets: read/write" + "Metadata: read")
//   GITHUB_OWNER  — defaults to 'marthasaltersb'
//   GITHUB_REPO   — defaults to 'saltbasin-website'
//
// What it does:
//   1. Fetches the repo's public key for sealed-box encryption
//   2. Encrypts each secret value with libsodium (GitHub's required format)
//   3. PUTs each encrypted secret to the GitHub Actions secrets API
//
// GitHub never sees plaintext; the script never logs values.

import 'dotenv/config';
import sodium from 'libsodium-wrappers';

const githubToken = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER || 'marthasaltersb';
const repo = process.env.GITHUB_REPO || 'saltbasin-website';

if (!githubToken) {
  console.error('✗ GITHUB_TOKEN is not set in .env. Create one at:');
  console.error('  https://github.com/settings/personal-access-tokens/new');
  console.error('  (fine-grained → Repository access: this repo only → Permissions:');
  console.error('   Repository secrets: read/write, Metadata: read)');
  process.exit(1);
}

// ── Configure: which env vars get pushed as GitHub Actions secrets ──
// Add to this list when new workflows need additional secrets.
const SECRETS_TO_PUSH = ['RENDER_API_KEY', 'RENDER_SERVICE_ID'];

const missing = SECRETS_TO_PUSH.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing in .env: ${missing.join(', ')}`);
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${githubToken}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
};

const apiBase = `https://api.github.com/repos/${owner}/${repo}/actions/secrets`;

// ── 1. Fetch the repo's public key (used to encrypt each secret) ──
console.log(`• Fetching ${owner}/${repo} public key…`);
const keyRes = await fetch(`${apiBase}/public-key`, { headers });
if (!keyRes.ok) {
  console.error(`✗ Failed to fetch public key: ${keyRes.status} ${keyRes.statusText}`);
  console.error(await keyRes.text());
  if (keyRes.status === 401) {
    console.error('  → Check your GITHUB_TOKEN value and scope.');
  } else if (keyRes.status === 403) {
    console.error('  → Token lacks permission. Needs Repository secrets: write.');
  } else if (keyRes.status === 404) {
    console.error('  → Repo not found. Check GITHUB_OWNER and GITHUB_REPO in .env.');
  }
  process.exit(1);
}
const { key: keyBase64, key_id } = await keyRes.json();

await sodium.ready;
const publicKey = sodium.from_base64(keyBase64, sodium.base64_variants.ORIGINAL);

// ── 2 + 3. Encrypt and upload each secret ──
console.log('• Pushing secrets…');
for (const name of SECRETS_TO_PUSH) {
  const value = process.env[name];
  const valueBytes = sodium.from_string(value);
  const encrypted = sodium.crypto_box_seal(valueBytes, publicKey);
  const encryptedValue = sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);

  const putRes = await fetch(`${apiBase}/${name}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id }),
  });

  if (!putRes.ok) {
    console.error(`✗ Failed to set ${name}: ${putRes.status} ${putRes.statusText}`);
    console.error(await putRes.text());
    process.exit(1);
  }
  console.log(`  ✓ ${name}`);
}

console.log('\n✓ Secrets uploaded to GitHub Actions.');
console.log('  Workflows will use the new values on their next run.');
