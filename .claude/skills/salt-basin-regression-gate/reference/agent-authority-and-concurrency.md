# Collaborative Handoffs, Concurrency, and Agent Authority

## Concurrent interaction

- Validate that multiple interacting users may occupy or interact with the same Checkpoint at once.
- Validate that the assigned Agent knows multiple users are contributing context — not just the last
  writer.
- Validate source interaction location and contributor identity lineage (who contributed what, from
  where).
- Validate collaborative reasoning before persistence — the Agent should reconcile/reason over concurrent
  contributions before anything is written, not last-write-wins.

## Agent authority test (multiple interacting-user profiles)

Concrete scenario to run, using at least two distinct authenticated user profiles:

1. An Account Executive may travel to onboarding and view authorized customers and statuses. Confirm this
   works — it's the permitted path, not the boundary being tested.
2. The same Account Executive must **not** be permitted to update post-onboarding billing terms if their
   effective authority does not permit that action.
3. The Agent must mediate the request — the attempt should route through the Agent, not directly hit a
   mutating endpoint.
4. The Agent must explain the boundary (a real, specific explanation of why the action is denied — not a
   generic "not authorized" with no context).
5. The user must not be able to directly bypass the Agent to mutate governed semantic state (e.g. no
   direct API call from the UI that skips Agent mediation for a governed field).

If step 5 is bypassable — even if the UI doesn't expose a button for it — that's a gate failure. Check the
actual route/endpoint the mutation would use, not just the UI affordance.

Cross-reference: `server/routes/bestyStaff.js`, `server/routes/memberAgent.js`,
`org_memberships.role` / `product_licenses.tier` / `data_entitlements.scope` for where authority is
actually supposed to be enforced.
