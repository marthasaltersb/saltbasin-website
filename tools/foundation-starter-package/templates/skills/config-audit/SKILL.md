---
name: config-audit
description: Audit a plan before building, and a diff after, for hardcoded product assumptions that should instead be configuration, metadata, a versioned definition, policy, formula, semantic mapping or seeded data. Use before planning and after implementing any module, view, agent behavior, rule or 3D scene element.
---

# Configuration audit

The question for every visible object, business rule, agent behavior, state and visual treatment:

> Would the owner need to edit source code to change this for another member, organization, product or
> industry?

If yes, it must come from configuration, metadata, a versioned definition, a policy, a formula, a
semantic mapping or seeded data. It must not come from a hardcoded value, a conditional on a name, a
component name, CSS, scene code or a comment.

## When

- **Before building:** audit the plan and flag anything about to be hardcoded.
- **After building:** audit the diff.

## Rules

- Prefer one indexed registry over repeated `if`/`switch` chains keyed on names.
- Check the existing registries first. The fix is usually "route through the existing one", not "build a
  new one".
- Business meaning never lives only in UI code. Visual meaning comes from a semantic registry.
- Agent authority comes from policy, not from role strings compared inline in route handlers.
- Every configurable thing has a screen. No API-only configuration.

## Classify everything still hardcoded

- **INTENTIONAL PLATFORM CONSTANT**: the same for everyone by design. Say why.
- **FOUNDATION-LOCKED BRAND RULE**: fixed by a written brand or foundation rule. Cite it.
- **SHOULD BECOME CONFIGURATION**: convert it now if it's in scope.
- **TEMPORARY PROTOTYPE DEBT**: known, recorded where it won't be lost, and not converted in this pass.

End with what was converted, the classified list, and the debt items called out separately.
