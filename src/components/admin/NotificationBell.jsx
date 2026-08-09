import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';

const SEVERITY_DOT = {
  info: 'var(--sb-admin-gold)',
  success: 'var(--sb-admin-success)',
  warning: 'var(--sb-admin-gold-warm)',
  danger: 'var(--sb-admin-danger)',
};

function timeAgo(ts) {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Global, generic notification/task indicator — reads from /api/notifications,
// a platform-wide primitive that any feature can write to via
// notificationEngine.emitEvent() on the server. Lives in AdminShell's topbar
// so it's visible from every admin tab, not just Agent Hub's own panels.
export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef(null);

  function refresh() {
    api.getNotifications().then((data) => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
    api.getMyTasks('open').then((data) => setTasks(data.tasks || [])).catch(() => {});
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function openNotification(n) {
    if (!n.readAt) await api.markNotificationRead(n.id).catch(() => {});
    if (n.actionUrl) {
      window.location.href = n.actionUrl;
    } else {
      refresh();
    }
  }

  async function markAllRead() {
    await api.markAllNotificationsRead().catch(() => {});
    refresh();
  }

  async function completeTask(task) {
    await api.updateMyTask(task.id, 'done').catch(() => {});
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="sb-btn-outline"
        style={{ padding: '0.4rem 0.7rem', fontSize: '0.85rem', position: 'relative' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8,
            background: 'var(--sb-admin-danger)', color: '#fff', fontSize: '0.62rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="sb-card" style={{
          position: 'absolute', right: 0, top: '2.4rem', width: 340, maxHeight: 460, overflowY: 'auto',
          zIndex: 40, padding: '0.75rem', background: 'var(--sb-admin-surface)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.85rem' }}>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--sb-admin-gold-warm)', fontSize: '0.72rem', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--sb-admin-text-soft)' }}>Nothing yet.</div>}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { openNotification(n); onNavigate?.(); }}
              style={{
                display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem 0.25rem',
                borderBottom: '0.5px solid var(--sb-admin-border)', cursor: 'pointer',
                opacity: n.readAt ? 0.6 : 1,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_DOT[n.severity] || SEVERITY_DOT.info, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: n.readAt ? 400 : 600 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: '0.74rem', color: 'var(--sb-admin-text-soft)', marginTop: '0.15rem' }}>{n.body.slice(0, 120)}</div>}
                <div style={{ fontSize: '0.68rem', color: 'var(--sb-admin-text-soft)', marginTop: '0.2rem' }}>{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))}

          {tasks.length > 0 && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.75rem 0 0.4rem' }}>My Tasks</div>
              {tasks.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.35rem 0.25rem' }}>
                  <input type="checkbox" onChange={() => completeTask(t)} />
                  <span style={{ fontSize: '0.8rem' }}>{t.title}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
