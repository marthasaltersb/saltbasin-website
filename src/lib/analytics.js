// Client-side analytics event tracker.
// All events POST to /api/analytics/events — fire-and-forget, never throws.

let _sessionId = null;
function getSessionId() {
  if (_sessionId) return _sessionId;
  try {
    _sessionId = sessionStorage.getItem('sb_session_id');
    if (!_sessionId) {
      _sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('sb_session_id', _sessionId);
    }
  } catch {
    _sessionId = Math.random().toString(36).slice(2);
  }
  return _sessionId;
}

export function track(eventType, { appId, objectType, objectId, memberUserId, metadata } = {}) {
  try {
    fetch('/api/analytics/events', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        app_id: appId || null,
        object_type: objectType || null,
        object_id: objectId ? String(objectId) : null,
        member_user_id: memberUserId || null,
        session_id: getSessionId(),
        metadata: metadata || {},
      }),
    }).catch(() => {});
  } catch {
    // Never let tracking break the page
  }
}
