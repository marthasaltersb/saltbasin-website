# Website Intelligence Methodology

## Purpose

Website Intelligence is Salt Basin's governed process for turning observable website configuration, approved organization evidence, audience needs, and brand rules into reviewable draft website configuration.

The operating chain is:

`Source evidence -> page inventory -> current-state analysis -> public narrative -> audience journeys -> information architecture -> page intelligence -> section intelligence -> rendering recommendation -> page configuration -> draft changeset -> preview -> validation -> approval -> publish`

The engine is not a copywriter or HTML generator. Its deployable output is the same configuration the platform already renders: admin `site_state` or member `member_sites` data, with sections resolved through the append-only block registry.

## Governing rules

1. Read the configured source before interpreting rendered output. For a Salt Basin-owned site, `site_state` or `member_sites` is the primary crawl source; rendered routes are a visual verification surface.
2. Keep observed source content separate from proposed configuration and generated content.
3. Preserve approved brand tokens and distinctive source language.
4. Attach evidence and claim classification to generated organizational claims. Unsupported capability language must remain aspirational.
5. Define a section by its communication objective before choosing its renderer.
6. Use a registered section type; never encode organization-specific content in a generic React component.
7. Write only to proposed or draft state. Publishing remains an explicit existing workflow.
8. Represent every applied proposal as a reversible, versioned configuration changeset.
9. Validate configuration, content, brand, accessibility, SEO, and visual fitness before approval.
10. Measure named coverage questions independently; never collapse them into an opaque website score.

## Current repository mapping

| Intelligence concept | Existing platform surface |
|---|---|
| Admin source/configuration | `site_state` and `config_state`, each with draft/published rows |
| Member source/configuration | `member_sites` and `member_configs`, keyed by user and kind |
| Page and section renderer | `PublicSite.jsx`, `PublicProfile.jsx`, and `RenderSection` |
| Component selection | append-only `REGISTRY` keyed by `section.type` |
| Content lineage substrate | `section.fieldMeta` and `capabilityTags.js` |
| Approved visual system | `brand.css` `--sb-*` tokens plus configured themes |
| Review surfaces | `AdminShell`, `EditorPane`, and `PreviewPane` |
| Publication control | existing site/member-site API draft and publish routes |

## Phase 1 runtime finding

On 2026-07-12 the local Vite and Express services responded successfully on ports 5173 and 3001. The published Salt Basin API returned the real versioned page configuration. No published member site was discoverable: the featured-member response was empty and attempted public member lookups returned 404. Member visual inspection therefore remains a Phase 1 completion gate; it must use a real published member record rather than a synthetic fixture.
