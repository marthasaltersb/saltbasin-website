// Generic notification/task write path. Any feature that wants to surface a
// notification and/or a task for a user calls emitEvent() with its own
// source_type — routing (whether to notify, whether to create a task,
// severity, title) is governed by the 'notification_rules' config_state row,
// not by code here. Adding a new event source later means adding a rule to
// that config, not touching this file.
import { db } from '../db.js';

async function getRules() {
  const row = await db.prepare(`SELECT data FROM config_state WHERE id='notification_rules'`).get();
  if (!row) return {};
  try {
    return JSON.parse(row.data)?.rules || {};
  } catch {
    return {};
  }
}

function fillTemplate(template, vars) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : ''));
}

async function resolveUserIds({ userId, notifyRole }) {
  if (userId) return [userId];
  if (notifyRole) {
    const rows = await db.prepare(`SELECT id FROM users WHERE role=$1`).all(notifyRole);
    return rows.map((r) => Number(r.id));
  }
  return [];
}

// emitEvent({ sourceType, sourceId, userId, notifyRole, title, body, actionUrl, severity, vars })
// userId targets one specific user; notifyRole (e.g. 'admin') fans out to every
// user with that role. Explicit title/body/severity override the rule's
// template when provided; otherwise the rule's titleTemplate + vars are used.
export async function emitEvent(event) {
  const rules = await getRules();
  const rule = rules[event.sourceType];
  if (!rule) return { notified: 0, tasked: 0 };

  const userIds = await resolveUserIds({ userId: event.userId, notifyRole: event.notifyRole || rule.notifyRole });
  if (userIds.length === 0) return { notified: 0, tasked: 0 };

  const title = event.title || fillTemplate(rule.titleTemplate, event.vars || {});
  const body = event.body || null;
  const severity = event.severity || rule.severity || 'info';
  const actionUrl = event.actionUrl || null;
  const now = Date.now();

  let notified = 0;
  let tasked = 0;

  for (const uid of userIds) {
    if (rule.createNotification) {
      await db.prepare(`
        INSERT INTO notifications (user_id, source_type, source_id, title, body, severity, action_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `).run(uid, event.sourceType, event.sourceId ?? null, title, body, severity, actionUrl, now);
      notified += 1;
    }
    if (rule.createTask) {
      await db.prepare(`
        INSERT INTO user_tasks (user_id, source_type, source_id, title, detail, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `).run(uid, event.sourceType, event.sourceId ?? null, title, body, now);
      tasked += 1;
    }
  }

  return { notified, tasked };
}
