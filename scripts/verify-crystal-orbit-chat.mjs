import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const catalog = JSON.parse(read('tests/fixtures/crystal-orbit-chat-scenarios.json'));
const failures = [];
const pass = [];
function check(name, fn) { try { fn(); pass.push(name); } catch (error) { failures.push({ name, error: error.message }); } }
function includes(file, values) { const source = read(file); for (const value of values) assert.ok(source.includes(value), `${file} is missing ${JSON.stringify(value)}`); }

check('scenario IDs are unique and expectations are complete', () => {
  assert.equal(new Set(catalog.scenarios.map((item) => item.id)).size, catalog.scenarios.length);
  for (const item of catalog.scenarios) { assert.ok(item.title && item.precondition); assert.ok(item.steps.length); assert.ok(item.expected.length); }
});
check('canonical member orbit and account/logout contracts exist', () => includes('src/components/MemberCrystalOrbit.jsx', ['CrystalSolarSystem', 'Available worlds', 'Log out of Salt Basin', "navigate('/login', { replace: true })"]));
check('worlds are provisioned from licenses and organizations', () => includes('src/data/memberWorldRegistry.js', ['My Account', 'Salt Basin Member', 'organization']));
check('3D orbit and entered-world renderers remain mounted', () => {
  includes('src/components/MemberCrystalOrbit.jsx', ['CrystalSolarSystem', 'CrystalWorldCityScene']);
  includes('src/components/CrystalSolarSystem.jsx', ['THREE.', 'WebGLRenderer']);
  includes('src/components/CrystalWorldCityScene.jsx', ['THREE.', 'WebGLRenderer']);
});
check('definition-to-operation journey remains connected', () => includes('src/components/MemberCrystalOrbit.jsx', ['definition-to-operation', 'DefinitionStudioJourney']));
check('career foundation stages match the requested process', () => includes('src/data/memberWorldRegistry.js', ['Upload source documents', 'Parse and map evidence', 'Review recommended mappings', 'Define jobs and roles', 'Link skills, tools, and projects', 'Approve Career Master']));
check('career operation embeds upload, review, formation and lineage', () => includes('src/components/FlowingJourneyDeck.jsx', ['UploadDataScreen', 'FORMED CAREER STRUCTURES', 'FIELD-LEVEL LINEAGE', 'listCareerMappingLineage']));
check('mapping commit is review-gated and lineage-preserving', () => {
  includes('src/components/admin/CareerMappingPreview.jsx', ['Confirm & Save', 'sourceLocation', 'commitCareerMappings']);
  includes('server/routes/careerMaster.js', ["router.get('/mappings/lineage'", "router.post('/mappings/commit'", 'career_source_mappings']);
});
check('maturity and integrity formulas remain visible', () => includes('src/components/FlowingJourneyDeck.jsx', ['Gate completion {completion}% x 45%', 'Evidence coverage {calculations.evidenceCoverage}% x 30%', 'Field completeness {calculations.completeness}% x 40%', 'Source traceability {calculations.traceability}% x 30%']));
check('responsive scene and collapsible-panel contracts exist', () => includes('src/brand.css', ['@media(max-width:900px)', '@media(max-width:600px)', '.fjd-control-panel.collapsed', '.fjd-shell:has(.fjd-career-operation) .fjd-control-panel{display:none}']));
check('outbound email defaults to blocked without authorization', () => includes('server/lib/email.js', ['recipient_confirmation_required', "authorization?.mode === 'user_requested'", "authorization?.mode !== 'automatic'", 'email_delivery_preferences']));
check('member email preference stores confirmation and recipient attribute', () => {
  includes('server/db.js', ['CREATE TABLE IF NOT EXISTS email_delivery_preferences', 'recipient_attribute', 'confirmed_at']);
  includes('server/routes/members.js', ["router.put('/me/email-delivery-preference'", 'member.email.delivery_preference']);
  includes('src/components/MemberCrystalOrbit.jsx', ['Automatic email permission', 'Email recipient attribute', 'window.confirm']);
});
check('demo seed requires an explicit target', () => includes('server/scripts/seedLoneTreeDemo.js', ['Explicit --userId or --targetUserEmail is required', '--targetUserEmail']));

if (process.argv.includes('--live')) {
  const base = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    pass.push('live site responds');
  } catch (error) {
    failures.push({ name: 'live site responds', error: error.message });
  }
}

console.log(JSON.stringify({ suite: catalog.suite, scenarios: catalog.scenarios.length, passedContracts: pass.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
