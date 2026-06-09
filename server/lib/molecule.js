// Molecular data primitives — form, render, react, preview
//
// A molecule has three bond axes that must all close simultaneously
// for the structure to be stable enough to persist:
//
//   security    — who can perform this operation and in what orientation
//   compliance  — what must be witnessed (audit) for this to be a real event
//   variables   — what inputs must be valid and present
//
// If any axis fails, nothing commits. No partial existence.

// ── form ─────────────────────────────────────────────────────────────────────
//
// Attempts to close all three bond axes simultaneously.
// If all close → runs commit() and returns { ok: true, result }
// If any fail  → returns { ok: false, bonds: { axis: reason } }
// commit() is never called on failure.
//
// Usage:
//   const result = await form({
//     security:   () => verifyOwner(req.user, userId),
//     compliance: () => writeAudit(...),
//     variables:  () => validatePages(incoming.pages),
//     commit:     () => writeState(userId, 'draft', incoming),
//   })

export async function form({ security, compliance, variables, commit }) {
  const axes = { security, compliance, variables };
  const failed = {};

  // Run all three axes in parallel — none depends on the others
  const results = await Promise.allSettled(
    Object.entries(axes).map(async ([axis, fn]) => {
      try {
        await fn();
        return { axis, ok: true };
      } catch (err) {
        return { axis, ok: false, reason: err.message || String(err) };
      }
    })
  );

  for (const result of results) {
    const val = result.value;
    if (!val.ok) failed[val.axis] = val.reason;
  }

  if (Object.keys(failed).length > 0) {
    return { ok: false, bonds: failed };
  }

  try {
    const result = await commit();
    return { ok: true, result };
  } catch (err) {
    return { ok: false, bonds: { commit: err.message || String(err) } };
  }
}

// ── preview ───────────────────────────────────────────────────────────────────
//
// Dry-run version of form — checks all three axes without calling commit().
// Like a slicer preview before sending to the printer.
// Returns the same shape as form() but never writes anything.

export async function preview({ security, compliance, variables }) {
  return form({
    security,
    compliance,
    variables,
    commit: async () => ({ previewed: true }),
  });
}

// ── render ────────────────────────────────────────────────────────────────────
//
// Returns only the bonds the reader is allowed to see.
// The molecule definition declares visibility per bond.
// The reader's orientation determines what gets included.
// Nothing is manually stripped — the geometry excludes it.
//
// molecule shape:
//   {
//     owner:  user_id,
//     bonds: {
//       pages:        { value: [...], visibility: 'public' },
//       integrations: { value: {...}, visibility: 'owner-only' },
//       audit_trail:  { value: [...], visibility: 'admin-only' },
//     }
//   }
//
// reader shape:
//   { id: user_id, role: 'member' | 'admin' | 'public' }

export function render(molecule, reader) {
  const out = {};

  for (const [key, bond] of Object.entries(molecule.bonds)) {
    if (bond.state === 'open') continue;        // open bonds never render

    if (canRead(bond.visibility, molecule.owner, reader)) {
      out[key] = bond.value;
    }
  }

  return out;
}

function canRead(visibility, ownerId, reader) {
  if (visibility === 'public')      return true;
  if (visibility === 'owner-only')  return reader?.id === ownerId;
  if (visibility === 'admin-only')  return reader?.role === 'admin';
  return false;
}

// ── react ─────────────────────────────────────────────────────────────────────
//
// A reaction takes two or more input molecules and produces new output molecules.
// Inputs are not mutated — the reaction produces something new.
// If conditions fail, inputs are unchanged and no outputs form.
//
// Usage:
//   const result = await react({
//     inputs:     { draft, actor },
//     conditions: () => validateReactionConditions(draft, actor),
//     produce:    () => buildOutputMolecules(draft, actor),
//     catalyst:   adminToken,   // optional — enables reaction, not consumed
//   })

export async function react({ inputs, conditions, produce, catalyst }) {
  // Check catalyst if required
  if (catalyst !== undefined && !catalyst) {
    return { ok: false, reason: 'catalyst required but not present' };
  }

  // Check reaction conditions
  try {
    await conditions();
  } catch (err) {
    return { ok: false, reason: err.message || String(err) };
  }

  // Produce outputs — the new molecules that form from this reaction
  try {
    const outputs = await produce();
    return { ok: true, outputs };
  } catch (err) {
    return { ok: false, reason: err.message || String(err) };
  }
}
