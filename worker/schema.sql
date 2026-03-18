-- ============================================================
-- Splunk MockTest — D1 Schema
-- Run once:
--   wrangler d1 create splunk-exam-profiles
--   wrangler d1 execute splunk-exam-profiles --file=worker/schema.sql
-- ============================================================

-- Adaptive performance profile per user per exam type per topic
CREATE TABLE IF NOT EXISTS topic_profiles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT    NOT NULL,
  exam_type     TEXT    NOT NULL,
  topic         TEXT    NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  errors        INTEGER NOT NULL DEFAULT 0,
  last_score    INTEGER NOT NULL DEFAULT 0,  -- % correct last session (0-100)
  trend         TEXT    NOT NULL DEFAULT 'new', -- new|improving|stable|declining
  sessions      INTEGER NOT NULL DEFAULT 0,
  last_updated  TEXT    NOT NULL,
  UNIQUE(user_id, exam_type, topic)
);

-- Persistent wrong answer bank
CREATE TABLE IF NOT EXISTS wrong_answers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT    NOT NULL,
  exam_type     TEXT    NOT NULL,
  topic         TEXT    NOT NULL,
  question_hash TEXT    NOT NULL,  -- SHA-1 of question text for dedup
  question      TEXT    NOT NULL,
  correct_answer TEXT   NOT NULL,
  times_missed  INTEGER NOT NULL DEFAULT 1,
  last_missed   TEXT    NOT NULL,
  next_review   TEXT    NOT NULL  -- ISO date for spaced repetition
);

-- Community aggregated stats (anonymized)
CREATE TABLE IF NOT EXISTS community_stats (
  exam_type     TEXT    NOT NULL,
  topic         TEXT    NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  total_errors   INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT    NOT NULL,
  PRIMARY KEY(exam_type, topic)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_topic_profiles_user ON topic_profiles(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user  ON wrong_answers(user_id, exam_type);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_review ON wrong_answers(user_id, next_review);
