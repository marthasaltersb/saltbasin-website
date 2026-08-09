// Generic notification/task API — available to any authenticated user (not
// admin-only), since notifications/tasks are a platform-wide primitive.
//
//   GET   /api/notifications/               → my notifications (?unreadOnly=1)
//   PATCH /api/notifications/:id/read        → mark one read
//   POST  /api/notifications/read-all        → mark all mine read
//
//   GET   /api/notifications/tasks           → my tasks (?status=open)
//   PATCH /api/notifications/tasks/:id       → update a task's status
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';

const router = Router();
router.use(requireUser);

function rowToNotification(r) {
  return {
    id: Number(r.id),
    sourceType: r.source_type,
    sourceId: r.source_id == null ? null : Number(r.source_id),
    title: r.title,
    body: r.body,
    severity: r.severity,
    actionUrl: r.action_url,
    readAt: r.read_at ? Number(r.read_at) : null,
    createdAt: Number(r.created_at),
  };
}

function rowToTask(r) {
  return {
    id: Number(r.id),
    sourceType: r.source_type,
    sourceId: r.source_id == null ? null : Number(r.source_id),
    title: r.title,
    detail: r.detail,
    status: r.status,
    dueAt: r.due_at ? Number(r.due_at) : null,
    createdAt: Number(r.created_at),
    completedAt: r.completed_at ? Number(r.completed_at) : null,
  };
}

router.get('/', async (req, res) => {
  const rows = req.query.unreadOnly === '1'
    ? await db.prepare(`SELECT * FROM notifications WHERE user_id=$1 AND read_at IS NULL ORDER BY created_at DESC LIMIT 100`).all(req.user.id)
    : await db.prepare(`SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`).all(req.user.id);
  const unreadCount = await db.prepare(`SELECT COUNT(*)::int AS n FROM notifications WHERE user_id=$1 AND read_at IS NULL`).get(req.user.id);
  res.json({ notifications: rows.map(rowToNotification), unreadCount: unreadCount?.n || 0 });
});

router.patch('/:id/read', async (req, res) => {
  await db.prepare(`UPDATE notifications SET read_at=$1 WHERE id=$2 AND user_id=$3`).run(Date.now(), req.params.id, req.user.id);
  res.json({ ok: true });
});

router.post('/read-all', async (req, res) => {
  await db.prepare(`UPDATE notifications SET read_at=$1 WHERE user_id=$2 AND read_at IS NULL`).run(Date.now(), req.user.id);
  res.json({ ok: true });
});

router.get('/tasks', async (req, res) => {
  const { status } = req.query;
  const rows = status
    ? await db.prepare(`SELECT * FROM user_tasks WHERE user_id=$1 AND status=$2 ORDER BY created_at DESC LIMIT 200`).all(req.user.id, status)
    : await db.prepare(`SELECT * FROM user_tasks WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`).all(req.user.id);
  res.json({ tasks: rows.map(rowToTask) });
});

router.patch('/tasks/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!['open', 'done', 'dismissed'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  const completedAt = status === 'done' ? Date.now() : null;
  await db.prepare(`
    UPDATE user_tasks SET status=$1, completed_at=$2 WHERE id=$3 AND user_id=$4
  `).run(status, completedAt, req.params.id, req.user.id);
  const row = await db.prepare(`SELECT * FROM user_tasks WHERE id=$1`).get(req.params.id);
  res.json({ task: rowToTask(row) });
});

export default router;
