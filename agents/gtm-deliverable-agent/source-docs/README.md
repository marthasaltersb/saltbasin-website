# Source docs intake

Drop reference material here. Anything in this folder is meant to be committed
to the repo (it's the opposite of `secure_input/`, which is gitignored and
never leaves your local machine) — so only put non-client, non-confidential
reference material here, not client financials or exports.

- `brand/` — Strategic Operator brand voice, citation standards, deliverable
  formatting rules. Used to build the cached system-prompt context block.
- `golden-deliverables/` — 2-3 past HandoverOS deliverables (docx/xlsx or
  extracted text) with known-good output, for the golden test set.
- `schema/` — the real Contract Metadata Master / Contract Revenue Fields
  schema (field names, types, aliases). Replaces the draft schema the agent
  ships with until this is provided.
- `templates/` — an existing HandoverOS docx/xlsx template, if the generated
  deliverable should match its exact structure/formatting instead of the
  brand-standard default.

Attach files in chat and note which of these four they belong to (or say
"sort them yourself" and I will use content/filename to decide) — I'll save
each into the right subfolder and commit.
