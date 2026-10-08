// Pure (no DB) comparison of the roles a tailored resume states against the
// member's Career Master jobs — the live evidence that a package was built
// from this site's Career Master data. Shared by server/lib/applicationPackages.js
// (provenance card) and scripts/sync-site-with-application-package.mjs.

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const yearsOf = (s) => (String(s || '').match(/(?:19|20)\d{2}|present/gi) || []).map((y) => y.toLowerCase());

/**
 * Roles from a document_blocks resume. Handles both layouts in use: a role
 * line "COMPANY | Title" (designed resume) and a role line "Company" followed
 * by an italic title paragraph (ATS resume).
 */
export function rolesFromDocument(content) {
  const blocks = content?.blocks || [];
  const roles = [];
  blocks.forEach((b, i) => {
    if (b.type !== 'role') return;
    const [company, ...rest] = String(b.title || '').split('|').map((s) => s.trim());
    const next = blocks[i + 1];
    const title = rest.length ? rest.join(' | ') : (next?.type === 'paragraph' && next.emphasis === 'italic' ? next.text : '');
    roles.push({ company, title, dates: b.dates || '' });
  });
  return roles;
}

/** One row per package role: does Career Master agree on title and years? */
export function compareRolesWithCareerMaster(roles, jobs) {
  return roles.map((role) => {
    const key = norm(role.company).split(' ')[0];
    const job = (jobs || []).find((j) => norm(j.company).split(' ')[0] === key);
    if (!job) return { ...role, status: 'missing', careerMaster: null };
    const pkgTitle = norm(String(role.title).split('|')[0]);
    const titleMatch = !pkgTitle || norm(job.title).includes(pkgTitle) || pkgTitle.includes(norm(job.title));
    const datesMatch = yearsOf(`${job.startDate || job.start_date} ${job.endDate || job.end_date}`).join('–') === yearsOf(role.dates).join('–');
    return {
      ...role,
      status: titleMatch && datesMatch ? 'match' : 'differs',
      titleMatch,
      datesMatch,
      careerMaster: {
        id: Number(job.id),
        title: job.title,
        dates: [job.startDate || job.start_date, job.endDate || job.end_date].filter(Boolean).join(' – '),
      },
    };
  });
}
