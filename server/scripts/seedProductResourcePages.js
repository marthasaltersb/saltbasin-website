// One-off, manually-run seed (2026-07-27) — adds a new "Product Resource
// Library" page to site_state's DRAFT only (never touches 'published'),
// exactly as if it had been built through the admin Sections editor. Uses
// the three new diagram blocks (evidenceChainDiagram, orbitModelDiagram,
// maturitySignalsDiagram — src/components/blocks/index.jsx) with content
// generalized from Betsy's own established Salt Basin methodology naming
// (Evidence Chain & Cost to Produce Truth™, Crystal Atom -> Molecule -> Rod
// -> Orbit, Maturity Is the Strength of the Evidence Signals — see
// VISUAL_REFERENCE_MANIFEST.md in the LoneTree Capital reference package),
// not any one prospect's wording. Existing pages are untouched — this only
// adds one new key to the pages object, respecting the append-only /
// additive-only invariants for site_state.
//
// Usage: node server/scripts/seedProductResourcePages.js
import 'dotenv/config';
import { getJSON, setJSON } from '../db.js';

const PAGE_KEY = 'product-resource-library';

const PAGE = {
  key: PAGE_KEY,
  name: 'Product Resource Library',
  slug: 'resources/product-library',
  type: 'standard',
  status: 'draft',
  order: 900,
  sections: [
    {
      id: 'resource-library-evidence-chain',
      type: 'evidenceChainDiagram',
      name: 'Evidence Chain & Cost to Produce Truth',
      status: 'draft',
      bg: 'navy',
      fields: {
        eyebrow: 'Evidence Chain & Cost to Produce Truth™',
        heading: 'From claim to exit-defensible proof',
        intro: 'Every claim Salt Basin governs is connected, end to end, to the attribution, evidence, and timing that let it survive scrutiny — from an investment committee, an LP, a lender, or a buyer.',
        links: [
          { label: 'Claim', description: 'What was believed or asserted.', accent: 'gold' },
          { label: 'Attribution', description: 'Who or what is responsible for the outcome.', accent: 'teal' },
          { label: 'Evidence', description: 'The governed data that supports it.', accent: 'teal' },
          { label: 'Time', description: 'When it was true, and for how long.', accent: 'sage' },
          { label: 'Exit-Defense', description: 'Whether it holds up under independent review.', accent: 'gold' },
        ],
        summary: 'Remove any link and the claim stops being defensible — the chain is the product, not a single number.',
      },
    },
    {
      id: 'resource-library-orbit-model',
      type: 'orbitModelDiagram',
      name: 'Crystal Atom → Molecule → Rod → Orbit',
      status: 'draft',
      bg: 'ivory',
      fields: {
        eyebrow: 'Salt Basin Data Model',
        heading: 'Crystal Atom → Molecule → Rod → Orbit',
        intro: 'A bounded Atom is the smallest governed fact. Molecules bond Atoms with a rule. A Channel Rod carries them through a journey. The Orbit is where converged Rods become a decision.',
        centerLabel: 'Atom',
        rings: [
          { label: 'Atom', description: 'A bounded, governed fact', accent: 'gold' },
          { label: 'Molecule', description: 'Atoms bonded by a rule', accent: 'teal' },
          { label: 'Channel Rod', description: 'Molecules carried through a journey', accent: 'sage' },
          { label: 'Orbit', description: 'Converged Rods, ready for a decision', accent: 'pink' },
        ],
      },
    },
    {
      id: 'resource-library-maturity-signals',
      type: 'maturitySignalsDiagram',
      name: 'Maturity Is the Strength of the Evidence Signals',
      status: 'draft',
      bg: 'navy',
      fields: {
        eyebrow: 'Maturity Model',
        heading: 'Maturity is the strength of the evidence signals',
        intro: 'A claim’s maturity is set by its weakest signal, not an average of all seven — one broken link still breaks the chain.',
        levels: [
          { label: 'None', accent: 'sage' },
          { label: 'Asserted', accent: 'sage' },
          { label: 'Sourced', accent: 'gold' },
          { label: 'Reconciled', accent: 'gold' },
          { label: 'Attributed', accent: 'teal' },
          { label: 'Exit-Defensible', accent: 'teal' },
        ],
        signals: [
          { label: 'Source Traceability', description: 'Can the number be traced to its origin system?' },
          { label: 'Attribution Clarity', description: 'Is responsibility for the outcome assigned?' },
          { label: 'Time Consistency', description: 'Does the evidence hold across the period claimed?' },
          { label: 'Reconciliation', description: 'Does it agree with independent records?' },
          { label: 'Actor Confirmation', description: 'Did a named person or system confirm it?' },
          { label: 'Independence', description: 'Was it validated outside the claiming party?' },
          { label: 'Durability', description: 'Does it survive a change in personnel or systems?' },
        ],
        summary: 'Weakest-signal-constrains-claim: a strong Source Traceability score cannot compensate for a missing Independence check.',
      },
    },
  ],
};

async function main() {
  const draft = await getJSON('site_state', 'draft');
  if (!draft) throw new Error('No site_state draft found — run npm run seed first.');
  if (draft.pages[PAGE_KEY]) {
    console.log(`[seed-resources] Page "${PAGE_KEY}" already exists in the draft — skipping.`);
  } else {
    draft.pages[PAGE_KEY] = PAGE;
    await setJSON('site_state', 'draft', draft);
    console.log(`[seed-resources] Added draft page "${PAGE_KEY}" at /${PAGE.slug} — review and publish via the admin Sections editor.`);
  }
  process.exit(0);
}

main().catch((e) => { console.error('[seed-resources] failed:', e); process.exit(1); });
