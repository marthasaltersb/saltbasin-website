// In-process route invoker for the platform MCP server (parity fix, 2026-10-09).
//
// Many website capabilities keep their logic inside the Express route handler. Rather than copy that logic into
// a second place (which would let the website and the MCP tool drift apart), an MCP tool can run the SAME
// route handler, with the same middleware (requireUser / requireAdmin) and the same validation, as the token's
// owner. The request is synthetic: it is built here, never from the network, so the `platformUser` property that
// server/auth.js getUserFromCookie() honours cannot be set by any HTTP caller.
//
// Failures keep the status the route answered with (>= 400 becomes an Error with status/code/message/details), so
// MCP clients see exactly what the website would have been told. Binary and streamed routes are not invoked.

const ROUTERS = {
  careerAgents: () => import('../routes/careerPlacementAgents.js'),
  resumeOutputs: () => import('../routes/resumeOutputs.js'),
  coverLetters: () => import('../routes/coverLetters.js'),
  career: () => import('../routes/careerMaster.js'),
  careerReconciliation: () => import('../routes/careerReconciliation.js'),
  careerBound: () => import('../routes/careerBound.js'),
  outputTemplates: () => import('../routes/outputTemplates.js'),
};
export const MOUNTS = Object.freeze({
  careerAgents: '/api/career-agents',
  resumeOutputs: '/api/resume-outputs',
  coverLetters: '/api/cover-letters',
  career: '/api/career',
  careerReconciliation: '/api/career-reconciliation',
  careerBound: '/api/career-bound',
  outputTemplates: '/api/output-templates',
});

function makeResponse(done) {
  const headers = {};
  let status = 200;
  let finished = false;
  const finish = (body) => { if (!finished) { finished = true; done({ status, headers, body }); } };
  const res = {
    statusCode: 200,
    headersSent: false,
    status(code) { status = code; res.statusCode = code; return res; },
    sendStatus(code) { status = code; finish({ status: code }); return res; },
    setHeader(k, v) { headers[String(k).toLowerCase()] = v; return res; },
    set(k, v) { return res.setHeader(k, v); },
    header(k, v) { return res.setHeader(k, v); },
    getHeader(k) { return headers[String(k).toLowerCase()]; },
    type(t) { return res.setHeader('content-type', t); },
    cookie() { return res; },
    json(body) { res.setHeader('content-type', 'application/json'); finish(body); return res; },
    send(body) { finish(body); return res; },
    write() { return true; },
    end(body) { finish(body); return res; },
    redirect() { status = 302; finish({ error: 'redirect not supported' }); return res; },
  };
  return res;
}

/**
 * Runs `METHOD path` on a route file's router as `ctx.user`.
 * @returns the JSON the route answered with (status < 400), else throws an Error carrying status/code/details.
 */
export async function invokeRoute(routerKey, method, path, { user, req: outer }, { params = {}, query = {}, body = undefined } = {}) {
  const mod = await ROUTERS[routerKey]();
  const router = mod.default;
  const mount = MOUNTS[routerKey];
  let url = path;
  for (const [k, v] of Object.entries(params)) url = url.replace(`:${k}`, encodeURIComponent(String(v)));
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
  const fullUrl = `${url}${qs ? `?${qs}` : ''}`;
  const headers = { host: outer?.headers?.host || 'localhost', 'x-forwarded-proto': outer?.headers?.['x-forwarded-proto'] || outer?.protocol || 'http', 'content-type': 'application/json' };
  const req = {
    method: method.toUpperCase(), url: fullUrl, originalUrl: `${mount}${fullUrl}`, baseUrl: '', path: url,
    query: Object.fromEntries(new URLSearchParams(qs)), body: body ?? {}, params: {}, headers, cookies: {},
    protocol: outer?.protocol || 'http', platformUser: user, viaMcp: true,
    get(h) { return this.headers[String(h).toLowerCase()]; },
    header(h) { return this.get(h); },
    app: outer?.app,
  };
  const result = await new Promise((resolve, reject) => {
    const res = makeResponse(resolve);
    router.handle(req, res, (err) => {
      if (err) return reject(err);
      resolve({ status: 404, headers: {}, body: { error: `No route for ${method} ${mount}${path}` } });
    });
  });
  if (result.status >= 400) {
    const b = result.body && typeof result.body === 'object' ? result.body : {};
    const msg = typeof b.error === 'string' ? b.error : typeof b.message === 'string' ? b.message : `Request failed with status ${result.status}`;
    const e = new Error(msg);
    e.status = result.status;
    if (typeof b.code === 'string') e.code = b.code;
    else if (typeof b.error === 'string' && /^[a-z0-9_]+$/.test(b.error)) e.code = b.error;
    e.details = b;
    throw e;
  }
  const b = result.body;
  if (b == null) return { ok: true, status: result.status };
  if (Buffer.isBuffer(b)) {
    const e = new Error('This route returns a binary file, which MCP tools do not return.');
    e.status = 415; e.code = 'binary_not_supported';
    throw e;
  }
  return b;
}
