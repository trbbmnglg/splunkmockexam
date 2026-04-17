import { handleProfile }       from './routes/profile.js';
import { handleCommunity }     from './routes/community.js';
import { handleWrongAnswers }  from './routes/wrongAnswers.js';
import { handleRetrieve }      from './routes/retrieve.js';
import { handleWebhook }       from './routes/webhook.js';
import { handleUsage }         from './routes/usage.js';
import { handleTraces }        from './routes/traces.js';
import { handleSeenConcepts }  from './routes/seenConcepts.js';
import { handlePrivacy }       from './routes/privacy.js';

// CORS origin allow-list — set via wrangler ALLOWED_ORIGINS env var as a
// comma-separated list (e.g., "https://splunkmockexam.pages.dev,https://custom.domain").
// In dev, localhost origins are always allowed. Previously this was '*',
// which — combined with client-supplied userId — let any website on the
// internet read or write any user's data from inside the user's browser.
const DEV_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
];

function resolveAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowList = (env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (allowList.includes(origin)) return origin;
  if (DEV_ORIGIN_PATTERNS.some(re => re.test(origin))) return origin;

  // Same-origin Workers-Sites fetches have no Origin header — safe to echo nothing.
  return allowList[0] || null;
}

function corsHeadersFor(allowedOrigin) {
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-Auth-Timestamp',
    'Vary': 'Origin',
  };
  if (allowedOrigin) h['Access-Control-Allow-Origin'] = allowedOrigin;
  return h;
}

// Generic client-safe error message for unhandled exceptions. Raw error
// details still go to console.error for server-side observability.
function safeErrorMessage(status) {
  if (status === 400) return 'Bad request';
  if (status === 401) return 'Unauthorized';
  if (status === 404) return 'Not found';
  if (status === 405) return 'Method not allowed';
  if (status === 429) return 'Too many requests';
  return 'Internal error';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeadersFor(resolveAllowedOrigin(request, env));

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const ok = (data) => new Response(JSON.stringify(data), {
      status:  200,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });

    // Trusted error helper — callers may pass a domain-specific message
    // (e.g. "Rate limit reached") that is safe to show the client.
    const err = (message, status = 500) => new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });

    try {
      if (url.pathname === '/api/profile') {
        return await handleProfile(request, env, ok, err);
      }
      if (url.pathname === '/api/community') {
        return await handleCommunity(request, env, ok, err);
      }
      if (url.pathname === '/api/wrongAnswers' || url.pathname === '/api/wrong-answers') {
        return await handleWrongAnswers(request, env, ok, err);
      }
      if (url.pathname === '/api/retrieve') {
        return await handleRetrieve(request, env, ok, err);
      }
      if (url.pathname === '/api/webhook') {
        return await handleWebhook(request, env, ok, err);
      }
      if (url.pathname === '/api/usage') {
        return await handleUsage(request, env, ok, err);
      }
      if (url.pathname === '/api/traces') {
        return await handleTraces(request, env, ok, err);
      }
      if (url.pathname === '/api/seen-concepts') {
        return await handleSeenConcepts(request, env, ok, err);
      }
      // Privacy routes — /api/privacy/register-token, /api/privacy/rotate-token,
      // /api/privacy/download, /api/privacy/delete-all
      if (url.pathname.startsWith('/api/privacy/')) {
        return await handlePrivacy(request, env, ok, err);
      }

      return err('Endpoint not found', 404);

    } catch (error) {
      // Log full detail server-side for observability, return a generic
      // message to the client so we never leak SQL / API / stack details.
      console.error('[Worker Global Error]', error?.stack || error?.message || error);
      return err(safeErrorMessage(500), 500);
    }
  }
};
