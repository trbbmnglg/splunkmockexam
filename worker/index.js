/**
 * worker/index.js — Splunk MockTest Cloudflare Worker
 *
 * Routes:
 *   GET  /api/profile?userId=&examType=   → read adaptive profile from D1
 *   POST /api/profile                     → upsert topic stats after exam
 *   POST /api/wrong-answers               → persist missed questions
 *   GET  /api/wrong-answers?userId=&examType= → get wrong answer bank
 *   GET  /api/community?examType=         → get community difficulty heatmap
 *   GET  /api/health                      → sanity check
 *
 * Everything else falls through to static assets (your React app).
 *
 * Bindings required in wrangler.toml:
 *   [[d1_databases]]
 *   binding = "DB"
 *   database_name = "splunk-exam-profiles"
 *   database_id = "YOUR_D1_ID"
 */

import { handleProfile } from './routes/profile.js';
import { handleWrongAnswers } from './routes/wrongAnswers.js';
import { handleCommunity } from './routes/community.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

function errorResponse(message, status = 500) {
  return corsResponse({ error: message }, status);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Route API requests
    if (url.pathname.startsWith('/api/')) {
      try {
        if (!env.DB) {
          return errorResponse('Database not configured. Check D1 binding in wrangler.toml.', 503);
        }

        const path = url.pathname;

        if (path === '/api/health') {
          return corsResponse({ status: 'ok', timestamp: new Date().toISOString() });
        }

        if (path === '/api/profile') {
          return await handleProfile(request, env, corsResponse, errorResponse);
        }

        if (path === '/api/wrong-answers') {
          return await handleWrongAnswers(request, env, corsResponse, errorResponse);
        }

        if (path === '/api/community') {
          return await handleCommunity(request, env, corsResponse, errorResponse);
        }

        return errorResponse('Not found', 404);

      } catch (err) {
        console.error('[Worker] Unhandled error:', err);
        return errorResponse(`Internal error: ${err.message}`);
      }
    }

    // Fall through to static assets (React app)
    return env.ASSETS.fetch(request);
  }
};
