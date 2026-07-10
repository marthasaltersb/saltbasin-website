# Salt Basin Metadata Model — Atom / Joint / Molecule

Purpose: a small, canonical vocabulary for describing the metadata that makes up a Salt Basin Net Work (the Enterprise Ecosystem Salt Basin MRS designs and builds for a client, applying the HOS™ methodology). This is intentionally a small definition, not a full graph-database spec — it exists to name three tiers of metadata consistently across the platform, admin UI, and future 3D/VR rendering work.

## The three tiers

**Atom** — the smallest addressable unit of metadata. An irreducible fact: a single skill, a single role, a single contract data field, a single data point. Atoms don't carry relationships on their own — they're the raw material.

**Joint** — a directional relationship connecting two or more atoms. A joint carries context and reasoning about *how* the atoms relate (e.g. "applied to," "traced to," "led to"). In the eventual platform, joints are where a reasoning agent gets assigned — the agent's job is to interpret and maintain the relationship, not the atoms themselves.

**Molecule** — a composed, portfolio-visible unit built from atoms plus joints. A job, a case study, a capability, a product, a Journey Data Rod — these are all molecules. This is the level a member actually configures and interacts with in the admin layer; atoms and joints are the substrate underneath it.

## Why this matters

A client's Salt Basin Net Work — the Enterprise Ecosystem Salt Basin MRS designs and builds for them — is structurally an atom/joint/molecule graph. Salt Basin MRS (Measurement Rendering Systems) is literally the system that measures and renders that graph. This is the same direction as the platform's longer-term 3D/VR career-journey rendering ambition: each node in that future interactive experience is a molecule, each edge is a joint, and the underlying data points are atoms.

## Scope note

This document defines vocabulary only. It does not specify a graph database schema, storage layer, or rendering engine — those are follow-on platform work once the vocabulary itself is validated against real usage on the homepage's metadata model diagram.
