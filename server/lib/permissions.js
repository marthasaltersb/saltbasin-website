// Permission grants (2026-10-11). Universal capability, provisioned: a feature is gated by a named permission,
// not by the admin role. Administrators hold every permission listed in ADMIN_DEFAULT_PERMISSIONS by default;
// any other user holds one only when it has been granted to that user or to their role.
// Grants live in config_state row `permission_grants`: { grants: { "<permission>": { userIds: [], roles: [] } } }.
// Absent row = no grants beyond the admin default. Nothing is written here.
import { getUserFromCookie } from '../auth.js';

export const GRANTS_ROW_ID = 'permission_grants';
export const ADMIN_DEFAULT_PERMISSIONS = Object.freeze(['datamodel.read', 'datamodel.write']);

async function readGrants() {
  try {
    const { getJSON } = await import('../db.js');
    return (await getJSON('config_state', GRANTS_ROW_ID))?.grants || {};
  } catch { return {}; } // no database: only the admin default applies
}

export async function hasPermission(user, key) {
  if (!user) return false;
  if (user.role === 'admin' && ADMIN_DEFAULT_PERMISSIONS.includes(key)) return true;
  const g = (await readGrants())[key];
  if (!g) return false;
  return (Array.isArray(g.userIds) && g.userIds.map(String).includes(String(user.id))) || (Array.isArray(g.roles) && g.roles.includes(user.role));
}

/** Every permission the user holds (for the website to decide what to show). */
export async function grantedPermissions(user) {
  if (!user) return [];
  const grants = await readGrants();
  const keys = new Set(user.role === 'admin' ? ADMIN_DEFAULT_PERMISSIONS : []);
  for (const [k, g] of Object.entries(grants)) {
    if ((g?.userIds || []).map(String).includes(String(user.id)) || (g?.roles || []).includes(user.role)) keys.add(k);
  }
  return [...keys].sort();
}

export const requirePermission = (keyFor) => async (req, res, next) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  const key = typeof keyFor === 'function' ? keyFor(req) : keyFor;
  if (!(await hasPermission(user, key))) return res.status(403).json({ error: `This needs the ${key} permission. Ask an administrator to grant it to you.`, code: 'forbidden' });
  req.user = user;
  next();
};
