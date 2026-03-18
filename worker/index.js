import profileHandler from './routes/profile.js';
import communityHandler from './routes/community.js';
import wrongAnswersHandler from './routes/wrongAnswers.js';
import { handleRetrieve } from './routes/retrieve.js'; // Use named import

// Standard CORS headers for your API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Define helper functions that the route handlers expect
    const ok = (data) => new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    const err = (message, status = 500) => new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    try {
      // 2. Route the requests to their specific handlers
      // Most of your existing handlers likely expect (request, env, ok, err)
      if (url.pathname === '/api/profile') {
        return await profileHandler(request, env, ok, err);
      }
      
      if (url.pathname === '/api/community') {
        return await communityHandler(request, env, ok, err);
      }
      
      if (url.pathname === '/api/wrongAnswers' || url.pathname === '/api/wrong-answers') {
        return await wrongAnswersHandler(request, env, ok, err);
      }
      
      // Map the /api/retrieve endpoint correctly
      if (url.pathname === '/api/retrieve') {
        return await handleRetrieve(request, env, ok, err);
      }

      // 3. Fallback 404 if no route matches
      return err('Endpoint not found', 404);

    } catch (error) {
      console.error('[Worker Global Error]', error.message);
      return err(error.message, 500);
    }
  }
};
