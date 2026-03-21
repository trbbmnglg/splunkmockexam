import { handleProfile }       from './routes/profile.js';
import { handleCommunity }     from './routes/community.js';
import { handleWrongAnswers }  from './routes/wrongAnswers.js';
import { handleRetrieve }      from './routes/retrieve.js';
import { handleWebhook }       from './routes/webhook.js';
import { handleUsage }         from './routes/usage.js';
import { handleTraces }        from './routes/traces.js';
import { handleSeenConcepts }  from './routes/seenConcepts.js';
import { handlePrivacy }       from './routes/privacy.js';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const ok = (data) => new Response(JSON.stringify(data), {
      status:  200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    const err = (message, status = 500) => new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      // Privacy routes — /api/privacy/register-token, /api/privacy/download, /api/privacy/delete-all
      if (url.pathname.startsWith('/api/privacy/')) {
        return await handlePrivacy(request, env, ok, err);
      }

      return err('Endpoint not found', 404);

    } catch (error) {
      console.error('[Worker Global Error]', error.message);
      return err(error.message, 500);
    }
  }
};
