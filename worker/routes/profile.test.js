import { describe, it, expect } from 'vitest';
import {
  computeTrend,
  appendScore,
  computeGraduatedAt,
} from './profile.js';

// ─── computeTrend (server-side) ─────────────────────────────────────────────
describe('computeTrend', () => {
  it('returns "new" when history shorter than 2', () => {
    expect(computeTrend([])).toBe('new');
    expect(computeTrend([80])).toBe('new');
    expect(computeTrend(null)).toBe('new');
    expect(computeTrend(undefined)).toBe('new');
  });

  it('detects improvement over the window split', () => {
    expect(computeTrend([50, 50, 80, 80])).toBe('improving');
  });

  it('detects decline over the window split', () => {
    expect(computeTrend([80, 80, 50, 50])).toBe('declining');
  });

  it('stays stable when average delta is within ±10 points', () => {
    expect(computeTrend([70, 72, 75, 78])).toBe('stable');
  });
});

// ─── appendScore (JSON-encoded, capped at 7) ────────────────────────────────
describe('appendScore', () => {
  it('creates a single-element history when input is empty', () => {
    expect(JSON.parse(appendScore('', 80))).toEqual([80]);
    expect(JSON.parse(appendScore(null, 80))).toEqual([80]);
    expect(JSON.parse(appendScore(undefined, 80))).toEqual([80]);
  });

  it('appends in order when under the cap', () => {
    const result = appendScore(JSON.stringify([60, 70]), 80);
    expect(JSON.parse(result)).toEqual([60, 70, 80]);
  });

  it('trims oldest entries so history stays at 7', () => {
    const result = appendScore(JSON.stringify([10, 20, 30, 40, 50, 60, 70]), 80);
    expect(JSON.parse(result)).toEqual([20, 30, 40, 50, 60, 70, 80]);
  });

  it('recovers from corrupt JSON by starting fresh', () => {
    expect(JSON.parse(appendScore('not json', 80))).toEqual([80]);
  });

  it('returns a JSON string (not an array)', () => {
    expect(typeof appendScore('[]', 80)).toBe('string');
  });
});

// ─── computeGraduatedAt (server-side, window 4) ─────────────────────────────
describe('computeGraduatedAt', () => {
  const NOW = '2026-04-18T12:00:00.000Z';
  const EARLIER = '2026-03-01T00:00:00.000Z';

  it('returns null when history has fewer than 4 entries', () => {
    expect(computeGraduatedAt([90, 90, 90], null, NOW)).toBeNull();
    expect(computeGraduatedAt([], null, NOW)).toBeNull();
  });

  it('graduates when the last 4 scores are all ≥ 80', () => {
    expect(computeGraduatedAt([50, 82, 85, 90, 92], null, NOW)).toBe(NOW);
  });

  it('preserves original graduation date to avoid clock-reset abuse', () => {
    expect(computeGraduatedAt([90, 90, 90, 90], EARLIER, NOW)).toBe(EARLIER);
  });

  it('un-graduates immediately when latest score dips below threshold', () => {
    expect(computeGraduatedAt([90, 90, 90, 90, 70], EARLIER, NOW)).toBeNull();
  });

  it('requires all 4 window scores to meet threshold (strict)', () => {
    expect(computeGraduatedAt([90, 79, 90, 90], null, NOW)).toBeNull();
  });
});
