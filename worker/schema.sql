-- ============================================================
-- Splunk MockTest — D1 Schema
-- Last updated: March 2026
--
-- To apply fresh:
--   wrangler d1 create splunk-exam-profiles
--   wrangler d1 execute splunk-exam-profiles --file=worker/schema.sql
--
-- To apply incrementally (add missing tables only):
--   wrangler d1 execute splunk-exam-profiles --file=worker/schema.sql
--   (all statements use CREATE TABLE IF NOT EXISTS — safe to re-run)
-- ============================================================

-- ── Adaptive performance profile per user per exam type per topic ─────────────
-- score_history : JSON array of last 7 session scores (rolling window)
-- graduated_at  : ISO timestamp when topic reached 4× consecutive ≥80% — null if not yet mastered
CREATE TABLE IF NOT EXISTS topic_profiles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT    NOT NULL,
  exam_type     TEXT    NOT NULL,
  topic         TEXT    NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  errors        INTEGER NOT NULL DEFAULT 0,
  last_score    INTEGER NOT NULL DEFAULT 0,       -- % correct last session (0-100)
  trend         TEXT    NOT NULL DEFAULT 'new',   -- new|improving|stable|declining
  score_history TEXT    NOT NULL DEFAULT '[]',    -- JSON array, capped at 7 entries
  graduated_at  TEXT             DEFAULT NULL,    -- ISO timestamp or NULL
  sessions      INTEGER NOT NULL DEFAULT 0,
  last_updated  TEXT    NOT NULL,
  UNIQUE(user_id, exam_type, topic)
);

-- ── Persistent wrong answer bank with spaced repetition ───────────────────────
-- Schedule: 1 → 3 → 7 → 14 → 30 → 60 days based on times_missed
CREATE TABLE IF NOT EXISTS wrong_answers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        TEXT    NOT NULL,
  exam_type      TEXT    NOT NULL,
  topic          TEXT    NOT NULL,
  question_hash  TEXT    NOT NULL,
  question       TEXT    NOT NULL,
  correct_answer TEXT    NOT NULL,
  times_missed   INTEGER NOT NULL DEFAULT 1,
  last_missed    TEXT    NOT NULL,
  next_review    TEXT    NOT NULL,               -- YYYY-MM-DD
  UNIQUE(user_id, exam_type, topic, question_hash)
);

-- ── Community aggregated stats (anonymized) ───────────────────────────────────
-- Written after every session; no user IDs stored here
CREATE TABLE IF NOT EXISTS community_stats (
  exam_type      TEXT    NOT NULL,
  topic          TEXT    NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  total_errors   INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT    NOT NULL,
  PRIMARY KEY(exam_type, topic)
);

-- ── Daily usage rate limiting (dual-signal: userId + hashed IP) ───────────────
CREATE TABLE IF NOT EXISTS usage_limits (
  user_id      TEXT    NOT NULL,   -- anonymous userId OR 'ip_<hash>'
  exam_date    TEXT    NOT NULL,   -- YYYY-MM-DD UTC
  exam_count   INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT    NOT NULL,
  PRIMARY KEY(user_id, exam_date)
);

-- ── Official exam result feedback submissions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_type             TEXT    NOT NULL,
  result_status         TEXT    NOT NULL,   -- 'pass' | 'fail'
  evidence_text         TEXT    NOT NULL,
  feedback_text         TEXT    NOT NULL,
  validation_confidence REAL             DEFAULT NULL,
  ip_hash               TEXT    NOT NULL,
  submitted_at          TEXT    NOT NULL
);

-- ── Generation trace log (observability) ─────────────────────────────────────
-- Written fire-and-forget after every exam generation run
CREATE TABLE IF NOT EXISTS generation_traces (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             TEXT    NOT NULL,
  exam_type           TEXT    NOT NULL,
  provider            TEXT    NOT NULL,   -- llama|gemini|perplexity|qwen
  model               TEXT    NOT NULL,
  prompt_tokens       INTEGER NOT NULL DEFAULT 0,
  completion_tokens   INTEGER NOT NULL DEFAULT 0,
  latency_ms          INTEGER NOT NULL DEFAULT 0,
  schema_enforced     INTEGER NOT NULL DEFAULT 0,   -- 0|1 (boolean)
  parse_strategy      TEXT    NOT NULL DEFAULT 'regex_fallback',
  retries             INTEGER NOT NULL DEFAULT 0,
  error               TEXT             DEFAULT NULL,
  question_count      INTEGER NOT NULL DEFAULT 0,
  validation_cycles   INTEGER NOT NULL DEFAULT 0,
  validation_failures INTEGER NOT NULL DEFAULT 0,
  rag_passage_count   INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL
);

-- ── Cross-session duplicate detection ────────────────────────────────────────
-- Stores hashed question stems so the AI cannot regenerate seen concepts.
-- Capped at 100 per user per exam (oldest trimmed on insert in seenConcepts.js).
CREATE TABLE IF NOT EXISTS seen_concepts (
  user_id      TEXT NOT NULL,
  exam_type    TEXT NOT NULL,
  concept_hash TEXT NOT NULL,
  concept_hint TEXT NOT NULL,   -- first 80 chars of question stem (debugging aid)
  topic        TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY(user_id, exam_type, concept_hash)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_topic_profiles_user    ON topic_profiles(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user     ON wrong_answers(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_review   ON wrong_answers(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_generation_traces_user ON generation_traces(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_seen_concepts_user     ON seen_concepts(user_id, exam_type);
