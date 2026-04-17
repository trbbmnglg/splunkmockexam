import { describe, it, expect } from 'vitest';
import {
  computeRollingTrend,
  computeGraduatedAt,
  appendToHistory,
} from './adaptiveProfile.js';

// ─── computeRollingTrend ────────────────────────────────────────────────────
describe('computeRollingTrend', () => {
  it('returns "new" when scoreHistory is empty and no lastScore', () => {
    expect(computeRollingTrend([], undefined, undefined)).toBe('new');
    expect(computeRollingTrend([])).toBe('new');
  });

  it('returns "new" when only one score in history and no prevScore', () => {
    expect(computeRollingTrend([70])).toBe('new');
  });

  it('falls back to single-sample delta when no history is available', () => {
    expect(computeRollingTrend([], 80, 60)).toBe('improving');
    expect(computeRollingTrend([], 60, 80)).toBe('declining');
    expect(computeRollingTrend([], 75, 70)).toBe('stable');
  });

  it('rolls first-half vs second-half average for history ≥ 2', () => {
    // [50, 50, 50, 80, 80, 80] — strongly improving
    expect(computeRollingTrend([50, 50, 50, 80, 80, 80])).toBe('improving');
    // [80, 80, 80, 50, 50, 50] — strongly declining
    expect(computeRollingTrend([80, 80, 80, 50, 50, 50])).toBe('declining');
    // [70, 72, 68, 71] — stable (< 10pt delta)
    expect(computeRollingTrend([70, 72, 68, 71])).toBe('stable');
  });

  it('requires > 10 point delta to flip from stable', () => {
    // (70+80)/2=75, (80+90)/2=85, delta=10 → stable (the threshold is strict >10)
    expect(computeRollingTrend([70, 80, 80, 90])).toBe('stable');
    // avgs 71, 86, delta=15 → improving
    expect(computeRollingTrend([70, 72, 85, 87])).toBe('improving');
  });
});

// ─── computeGraduatedAt ─────────────────────────────────────────────────────
describe('computeGraduatedAt', () => {
  const NOW = '2026-04-18T12:00:00.000Z';
  const EARLIER = '2026-03-01T00:00:00.000Z';

  it('returns null when history shorter than graduation window', () => {
    expect(computeGraduatedAt([100, 100], null, NOW)).toBeNull();
    expect(computeGraduatedAt([], null, NOW)).toBeNull();
    expect(computeGraduatedAt(undefined, null, NOW)).toBeNull();
  });

  it('graduates when last 5 scores are all ≥ threshold', () => {
    const history = [40, 90, 90, 90, 90, 90];
    expect(computeGraduatedAt(history, null, NOW)).toBe(NOW);
  });

  it('preserves original graduatedAt instead of resetting the clock', () => {
    const history = [90, 90, 90, 90, 90];
    expect(computeGraduatedAt(history, EARLIER, NOW)).toBe(EARLIER);
  });

  it('un-graduates (returns null) when latest score dips below threshold', () => {
    const history = [90, 90, 90, 90, 70];
    expect(computeGraduatedAt(history, EARLIER, NOW)).toBeNull();
  });

  it('does not graduate when one mid-window score is below threshold', () => {
    const history = [90, 90, 70, 90, 90];
    expect(computeGraduatedAt(history, null, NOW)).toBeNull();
  });
});

// ─── appendToHistory ────────────────────────────────────────────────────────
describe('appendToHistory', () => {
  it('appends to an empty or missing history', () => {
    expect(appendToHistory([], 80)).toEqual([80]);
    expect(appendToHistory(null, 80)).toEqual([80]);
    expect(appendToHistory(undefined, 80)).toEqual([80]);
  });

  it('preserves chronological order', () => {
    expect(appendToHistory([60, 70, 80], 90)).toEqual([60, 70, 80, 90]);
  });

  it('trims oldest entries so the window stays at 7', () => {
    const result = appendToHistory([10, 20, 30, 40, 50, 60, 70], 80);
    expect(result).toHaveLength(7);
    expect(result[0]).toBe(20); // 10 was trimmed
    expect(result[result.length - 1]).toBe(80);
  });

  it('does not mutate the input array', () => {
    const input = [10, 20, 30];
    const result = appendToHistory(input, 40);
    expect(input).toEqual([10, 20, 30]);
    expect(result).toEqual([10, 20, 30, 40]);
  });
});
