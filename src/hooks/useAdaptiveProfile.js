/**
 * hooks/useAdaptiveProfile.js
 *
 * Manages two concerns that both trigger on exam type selection
 * or game state changes:
 *
 *   1. loadProfile(examType)
 *      Called when the user selects a cert — pre-warms the D1
 *      adaptive profile into localStorage before the config screen
 *      renders so readiness scores and topic bars are available
 *      immediately without a loading flash.
 *
 *   2. getCommunityStats per cert
 *      Called when the menu mounts — fetches anonymized error rates
 *      for each cert card's difficulty heatmap. Skips certs that
 *      already have data to avoid redundant D1 reads.
 *
 *   3. usageInfo
 *      Fetches the current daily exam count for shared-key users
 *      when a cert is selected, so the config screen can show
 *      the usage indicator immediately.
 */

import { useState, useEffect, useCallback } from 'react';
import { EXAM_BLUEPRINTS } from '../utils/constants';
import { loadProfile, getCommunityStats, getUserId } from '../utils/agentAdaptive';
import { DEFAULT_GROQ_KEY } from '../utils/api';

const BASE_URL = import.meta.env.MODE === 'development'
  ? '/api'
  : 'https://splunkmockexam.gtaad-innovations.com/api';

export function useAdaptiveProfile({ gameState, apiKeys }) {
  const [communityStats, setCommunityStats] = useState({});
  const [usageInfo,      setUsageInfo]      = useState(null);

  // ── Load community stats when menu is shown ──────────────────────────────
  useEffect(() => {
    if (gameState !== 'menu') return;
    const CERT_IDS = Object.keys(EXAM_BLUEPRINTS);
    CERT_IDS.forEach(async (id) => {
      if (communityStats[id]) return;
      const data = await getCommunityStats(id);
      if (data?.topics?.length > 0) {
        setCommunityStats(prev => ({ ...prev, [id]: data }));
      }
    });
  }, [gameState]);

  // ── Pre-warm adaptive profile when exam type is selected ─────────────────
  const prewarmProfile = useCallback((selectedType) => {
    loadProfile(selectedType).catch(() => {});
  }, []);

  // ── Fetch usage info for shared-key users ─────────────────────────────────
  const fetchUsageInfo = useCallback(async () => {
    const groqKey        = apiKeys['llama'];
    const usingSharedKey = !groqKey || groqKey.trim() === '' || groqKey === DEFAULT_GROQ_KEY;

    if (!usingSharedKey) {
      setUsageInfo(null);
      return;
    }

    try {
      const userId = getUserId();
      const res = await fetch(
        `${BASE_URL}/usage?userId=${encodeURIComponent(userId)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) setUsageInfo(await res.json());
    } catch {
      // Non-fatal — indicator just won't show
    }
  }, [apiKeys]);

  return {
    communityStats,
    usageInfo,
    setUsageInfo,
    prewarmProfile,
    fetchUsageInfo,
  };
}
