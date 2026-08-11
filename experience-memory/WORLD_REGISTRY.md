# World Registry

Domain navigation contexts: Foundation, Channel Rod, Query Channel, Career, Pricing, Infrastructure, Template.

Spatial variants: Crystal Basin, Orbital Intelligence, Monetary River, Enterprise Highway, Neural Constellation, Temporal Canyon, Maturity Lattice.

All contexts and journeys reference one governed semantic/query state. A context selection narrows or
orients that state; it does not create a context-specific copy. Spatial variants are presentation lenses
over the same referenced state and may ultimately be composed together into scoped/converged views.

`resolveWorldComposition()` is currently a backward-compatible candidate resolver for one navigation
context plus one active lens. It must not be interpreted as `worldId × variantKey` producing a distinct
data version, and the single-select variant control in `SpatialJourneyWorld.jsx` is not the canonical
destination model. Replacing that candidate control with governed scenario-scope/lens composition remains
design debt. `role` and `journeyState` have no live registries yet and must not be treated as composition
axes until those registries exist.
