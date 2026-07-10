// One-off: pushes the new Salt Basin MRS "Product Experience" home page
// sections (server/data/defaultSite.js HOME_SECTIONS) into the live
// site_state draft + published rows. This is Betsy's own site content (not
// a member row), so a direct one-time replacement is the intended action —
// bootstrap() never overwrites existing site_state rows, so without this
// script the live homepage would keep rendering old content until someone
// manually re-authors it in /admin.
//
// Only touches pages.home.sections (and home.type, to match the new
// productHero-driven layout) — every other page and the draft/published
// divergence elsewhere is left untouched. Safe to re-run.
import 'dotenv/config';
import { getJSON, setJSON } from '../server/db.js';
import { defaultSite } from '../server/data/defaultSite.js';

const newHome = defaultSite.pages.home;

async function updateHome(kind) {
  const site = await getJSON('site_state', kind);
  if (!site || !site.pages || !site.pages.home) {
    console.log(`[seed-new-homepage] site_state.${kind} has no home page yet — skipping.`);
    return;
  }
  site.pages.home.sections = newHome.sections;
  site.pages.home.type = newHome.type;
  await setJSON('site_state', kind, site);
  console.log(`[seed-new-homepage] Updated site_state.${kind} home page with ${newHome.sections.length} Product Experience sections.`);
}

await updateHome('draft');
await updateHome('published');

console.log('[seed-new-homepage] Done.');
process.exit(0);
