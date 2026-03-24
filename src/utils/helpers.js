/**
 * Shared utility functions extracted from useExamSession and other modules.
 */
import { DEFAULT_GROQ_KEY } from './apiConfig';

/** Normalize a string for comparison: trim, collapse whitespace, lowercase. */
export const normalizeString = (s) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Check whether the user is relying on the built-in shared Groq key. */
export const isUsingSharedKey = (userKey) =>
  !userKey || userKey.trim() === '' || userKey === DEFAULT_GROQ_KEY;

/** Fisher–Yates shuffle (returns a new array). */
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Clamp a string to a maximum length (no-op if already within limit). */
export const clampString = (str, max) => str.length > max ? str.slice(0, max) : str;
