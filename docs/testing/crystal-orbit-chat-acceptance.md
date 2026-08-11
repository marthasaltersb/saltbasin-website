# Crystal Orbit chat acceptance suite

This suite is the reproducible baseline for the member-centered Crystal Orbit experience built through the August 2026 conversation. The JSON catalog is the record of visual, process, data, security, and responsive expectations; the Node scripts protect the corresponding implementation contracts.

## Commands

```bash
npm run verify:crystal-orbit
npm run test:crystal-orbit
npm run verify:crystal-orbit:live
```

The live command performs a public availability check. Authenticated destructive workflows—uploading evidence, committing mappings, changing email permission, and logging out—remain guided scenarios so a tester must consciously choose a disposable test account and source file.

## Visual run procedure

Run every `visual`, `orbit`, `world`, `journey`, and `responsive` scenario in `tests/fixtures/crystal-orbit-chat-scenarios.json` at all declared viewports. Capture the orbit landing, entered world, active journey, expanded inspector, collapsed inspector, Structures layer, Lineage layer, and Records layer. A pass requires spatial information architecture, readable controls, no unintended overlap, no horizontal page overflow, and no flat-card substitution for the 3D scene.

## Data safety

Use a disposable member for uploads and mapping commits. Never use a real third-party email address. Automatic email must begin disabled. If a test enables it, confirm the prompt, validate the stored recipient attribute, then disable it again before ending the run.

## Evidence to retain

- Scenario ID and build commit
- Role and organization scope
- Viewport and browser
- Before/after screenshots for visual scenarios
- API status and created record IDs for process scenarios
- Displayed maturity/integrity inputs and independently calculated totals
- Pass/fail result plus defect link for every failed expectation
