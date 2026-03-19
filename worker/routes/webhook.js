/**
 * worker/routes/webhook.js
 *
 * POST /api/webhook
 *   → Body: { targetEmail, exam, status, evidence, feedback, validationConfidence, timestamp }
 *   → Stores feedback submission in D1 for the maintainer to review
 *   → Optionally forwards via email if SENDGRID_API_KEY or RESEND_API_KEY env var is set
 *
 * No auth required — AI pre-validation in FeedbackModal is the spam gate.
 * Rate limiting: max 5 submissions per IP per day (tracked in D1).
 */

export async function handleWebhook(request, env, ok, err) {
  if (request.method !== 'POST') {
    return err('Method not allowed', 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const { targetEmail, exam, status, evidence, feedback, validationConfidence, timestamp } = body;

  if (!exam || !status || !evidence || !feedback) {
    return err('exam, status, evidence, and feedback are required', 400);
  }

  // Basic confidence gate — reject if AI validation was very low confidence
  if (typeof validationConfidence === 'number' && validationConfidence < 30) {
    return err('Submission rejected: validation confidence too low', 422);
  }

  const submittedAt = timestamp || new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  try {
    // ── Rate limit: max 5 submissions per IP per day ──────────────────────
    const today = submittedAt.split('T')[0];
    const rateLimitRow = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM feedback_submissions
      WHERE ip_hash = ? AND DATE(submitted_at) = ?
    `).bind(simpleHash(ip), today).first();

    if (rateLimitRow && rateLimitRow.count >= 5) {
      return err('Rate limit reached: max 5 feedback submissions per day', 429);
    }

    // ── Store in D1 ───────────────────────────────────────────────────────
    await env.DB.prepare(`
      INSERT INTO feedback_submissions
        (exam_type, result_status, evidence_text, feedback_text, validation_confidence, ip_hash, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      exam,
      status,
      evidence.slice(0, 4000),   // cap evidence length
      feedback.slice(0, 2000),
      validationConfidence ?? null,
      simpleHash(ip),
      submittedAt
    ).run();

    // ── Optional: forward via Resend (set RESEND_API_KEY in Cloudflare dashboard) ──
    if (env.RESEND_API_KEY && targetEmail) {
      await forwardViaResend(env.RESEND_API_KEY, targetEmail, {
        exam, status, evidence, feedback, validationConfidence, submittedAt
      }).catch(e => console.warn('[Webhook] Email forward failed (non-fatal):', e.message));
    }

    return ok({ success: true, message: 'Feedback received. Thank you!' });

  } catch (e) {
    console.error('[Webhook] DB error:', e.message);
    // Check if table doesn't exist yet
    if (e.message?.includes('no such table')) {
      return err('Feedback table not yet created. Run the schema migration.', 503);
    }
    return err('Failed to store feedback', 500);
  }
}

// ── Resend email forward (optional) ─────────────────────────────────────────
async function forwardViaResend(apiKey, toEmail, data) {
  const body = {
    from: 'Splunk MockTest <feedback@splunkmocktest.com>',
    to: [toEmail],
    subject: `[MockTest Feedback] ${data.exam} — ${data.status.toUpperCase()}`,
    text: [
      `Exam: ${data.exam}`,
      `Result: ${data.status.toUpperCase()}`,
      `AI Validation Confidence: ${data.validationConfidence ?? 'N/A'}%`,
      `Submitted: ${data.submittedAt}`,
      '',
      '── Evidence ──',
      data.evidence,
      '',
      '── Feedback ──',
      data.feedback,
    ].join('\n'),
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}

// Simple hash for IP anonymization (same as wrongAnswers.js)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 200); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
