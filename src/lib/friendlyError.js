// Owner error rule (2026-10-10): the first sentence says what went wrong and what to do, in plain
// words; technical detail follows on its own line. Never show a bare parser or HTTP message.
// Messages here are plain strings: "headline\ndetail". Render with white-space: pre-line,
// or use headlineOf() where only the first sentence fits (toasts).

export function describeParseDetail(err) {
  const raw = String((err && err.message) || err || '').trim();
  return raw ? `Technical detail: ${raw}` : '';
}

// what: "snapshot", "package file", "gate list" ... -> "The snapshot could not be read because ..."
export function jsonProblem(what, err) {
  const head = `The ${what} could not be read because part of its text is mistyped or missing. Check for a missing comma, quote or bracket, fix it, then try again.`;
  const detail = describeParseDetail(err);
  return detail ? `${head}\n${detail}` : head;
}

export function headlineOf(message) {
  return String(message || '').split('\n')[0];
}

const STATUS_WORDS = {
  400: 'The request was not accepted. Check what you entered and try again.',
  401: 'You are signed out. Sign in again, then retry.',
  403: 'You do not have permission to do that. Ask an administrator if you need access.',
  404: 'That item could not be found. It may have been removed. Reload the page and try again.',
  409: 'Someone else changed this first. Reload the page to see the latest, then try again.',
  413: 'That is too large to send. Use a smaller file or less text, then try again.',
  428: 'You need to finish a required step first. Reload the page and follow the prompt.',
  429: 'Too many tries in a short time. Wait a few minutes, then try again.',
};

// A plain sentence for an HTTP status when the server gave no message of its own.
export function httpProblem(status, serverMessage) {
  const s = Number(status) || 0;
  if (serverMessage && String(serverMessage).trim()) return String(serverMessage);
  const head = STATUS_WORDS[s]
    || (s >= 500 ? 'The server had a problem and could not finish. Wait a moment and try again; if it keeps happening, tell an administrator.'
      : 'That did not work. Reload the page and try again.');
  return s ? `${head}\nTechnical detail: the server answered ${s}.` : head;
}
