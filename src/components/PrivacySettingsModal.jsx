/**
 * src/components/PrivacySettingsModal.jsx
 *
 * Full data rights UI — accessible from the nav bar at all times.
 *
 * Features:
 *   - Tracking toggle (on/off) with choice to keep or delete existing data
 *   - Download my data (JSON export of all D1 data)
 *   - Delete all data (full D1 wipe + localStorage clear)
 *   - Anonymous ID display
 *   - Clear explanation of what is stored and why
 *
 * Security:
 *   - All sensitive operations require a signed payload (userId + token + timestamp)
 *   - Token is registered with the Worker on first use (hash stored in D1, raw in localStorage)
 *   - Requests older than 5 minutes are rejected server-side (replay prevention)
 *   - Rate limited to 3 sensitive ops per userId per day
 */

import { useState, useEffect } from 'react';
import {
  X, Shield, Download, Trash2, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import {
  isTrackingEnabled, setTrackingEnabled,
  getOrCreateToken, hashToken, buildSignedPayload, clearAllLocalData,
} from '../utils/privacyToken';
import { getUserId, clearProfile } from '../utils/agentAdaptive';
import { BASE_URL } from '../utils/baseUrl';

// ── Register token with Worker on first use ───────────────────────────────────
async function ensureTokenRegistered(userId, token) {
  try {
    const tokenHash = await hashToken(token);
    await fetch(`${BASE_URL}/privacy/register-token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, tokenHash }),
      signal:  AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.warn('[Privacy] Token registration failed:', e.message);
  }
}

// ── Trigger JSON file download ────────────────────────────────────────────────
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PrivacySettingsModal({ onClose }) {
  const [trackingOn,    setTrackingOn]    = useState(isTrackingEnabled());
  const [dataInfoOpen,  setDataInfoOpen]  = useState(false);
  const [loading,       setLoading]       = useState(null); // 'download' | 'delete' | 'toggle'
  const [status,        setStatus]        = useState(null); // { type: 'success'|'error', msg }
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showKeepOrDelete, setShowKeepOrDelete] = useState(false); // shown when toggling off

  const userId = getUserId();

  // Register token on modal open
  useEffect(() => {
    const token = getOrCreateToken();
    if (token) ensureTokenRegistered(userId, token);
  }, [userId]);

  const showStatus = (type, msg, durationMs = 4000) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), durationMs);
  };

  // ── Build a fresh signed payload ────────────────────────────────────────────
  const getSignedPayload = (extra = {}) => {
    const token = getOrCreateToken();
    if (!token) throw new Error('No privacy token available');
    return buildSignedPayload(userId, token, extra);
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setLoading('download');
    setStatus(null);
    try {
      const payload  = getSignedPayload();
      const res      = await fetch(`${BASE_URL}/privacy/download`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(15000),
      });
      if (res.status === 401) throw new Error('Authentication failed — please try again.');
      if (res.status === 429) throw new Error('Rate limit reached — max 3 data operations per day.');
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      downloadJson(data, `splunk-mocktest-data-${new Date().toISOString().split('T')[0]}.json`);
      showStatus('success', 'Your data has been downloaded.');
    } catch (e) {
      showStatus('error', e.message || 'Download failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // ── Delete all ──────────────────────────────────────────────────────────────
  //
  // 401 handling note: the worker rejects delete-all when the client's raw
  // token doesn't hash to the row in D1 (previous register-token may have
  // stored a different hash, e.g., a different device / cleared localStorage).
  // In that case we fall back to a LOCAL-only clear — the user's browser
  // state is fully removed and the orphaned D1 row becomes unreachable
  // because the userId no longer exists on this device. Full server-side
  // wipe would require proof of the original token, which they don't have.
  const handleDeleteAll = async () => {
    setLoading('delete');
    setStatus(null);
    try {
      const payload = getSignedPayload();
      const res     = await fetch(`${BASE_URL}/privacy/delete-all`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(15000),
      });

      if (res.status === 401) {
        // Local-only fallback — still removes this device's identity so
        // the user's next visit starts fresh. Server data becomes orphaned
        // (no userId → nothing can query it).
        clearAllLocalData();
        setConfirmDelete(false);
        showStatus(
          'success',
          'Local data cleared on this device. Server-side data could not be verified as yours and will age out — contact the maintainer if you need it removed sooner. Reloading in 4 seconds.',
          4500,
        );
        setTimeout(() => window.location.reload(), 4500);
        return;
      }
      if (res.status === 429) throw new Error('Rate limit reached — max 3 data operations per day.');
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      // Clear all local data after confirmed D1 wipe
      clearAllLocalData();
      setConfirmDelete(false);
      showStatus('success', 'All your data has been permanently deleted. The page will reload in 3 seconds.', 3500);
      setTimeout(() => window.location.reload(), 3500);
    } catch (e) {
      showStatus('error', e.message || 'Deletion failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // ── Tracking toggle ─────────────────────────────────────────────────────────
  const handleTrackingToggle = () => {
    if (trackingOn) {
      // Turning off — ask what to do with existing data
      setShowKeepOrDelete(true);
    } else {
      // Turning on — straightforward
      setTrackingEnabled(true);
      setTrackingOn(true);
      showStatus('success', 'Tracking enabled — your study progress will be saved.');
    }
  };

  const handleKeepData = () => {
    setTrackingEnabled(false);
    setTrackingOn(false);
    setShowKeepOrDelete(false);
    showStatus('success', 'Tracking disabled. Existing data kept — you can delete it anytime below.');
  };

  const handleDeleteExistingData = async () => {
    setLoading('toggle');
    try {
      const payload = getSignedPayload();
      const res     = await fetch(`${BASE_URL}/privacy/delete-all`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(15000),
      });

      if (res.status === 401) {
        // Same local-only fallback as handleDeleteAll — see comment above.
        clearAllLocalData();
        setTrackingEnabled(false);
        setTrackingOn(false);
        setShowKeepOrDelete(false);
        showStatus(
          'success',
          'Tracking disabled. Local data cleared — server-side data could not be verified as yours and will age out. Reloading in 4 seconds.',
          4500,
        );
        setTimeout(() => window.location.reload(), 4500);
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      clearAllLocalData();
      setTrackingEnabled(false);
      setTrackingOn(false);
      setShowKeepOrDelete(false);
      showStatus('success', 'Tracking disabled and all data deleted. The page will reload in 3 seconds.', 3500);
      setTimeout(() => window.location.reload(), 3500);
    } catch (e) {
      showStatus('error', e.message || 'Could not delete data. Tracking has been disabled without deleting.');
      setTrackingEnabled(false);
      setTrackingOn(false);
      setShowKeepOrDelete(false);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white max-w-lg w-full shadow-2xl rounded-xl animate-fade-in border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Privacy &amp; Data</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your rights under GDPR, PDPA, and CCPA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status message */}
          {status && (
            <div className={`flex items-start gap-2.5 p-3 rounded-lg text-sm font-medium animate-fade-in
              ${status.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {status.type === 'success'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              }
              {status.msg}
            </div>
          )}

          {/* Anonymous ID */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-600 mb-1">Your anonymous ID</p>
            <p className="text-xs font-mono text-slate-700 break-all">{userId}</p>
            <p className="text-xs text-slate-400 mt-1">No name, email, or personal information is ever collected.</p>
          </div>

          {/* What we store */}
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setDataInfoOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">What data is stored</span>
              </div>
              {dataInfoOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {dataInfoOpen && (
              <div className="px-4 py-3 space-y-2 animate-fade-in">
                {[
                  { label: 'Adaptive learning profile', desc: 'Per-topic accuracy, error rates, score history, trend — stored in Cloudflare D1.' },
                  { label: 'Wrong answer bank', desc: 'Questions you missed with spaced repetition scheduling — stored in Cloudflare D1.' },
                  { label: 'Seen concepts', desc: 'Hashed question stems to prevent repeat questions — stored in Cloudflare D1.' },
                  { label: 'Usage count', desc: 'Daily exam count for shared-key rate limiting — stored in Cloudflare D1.' },
                  { label: 'Generation traces', desc: 'Anonymous AI generation metadata (provider, tokens, latency) — stored in Cloudflare D1.' },
                  { label: 'Local preferences', desc: 'API keys, tracking toggle, consent flag — stored in your browser only, never sent to our servers.' },
                ].map(item => (
                  <div key={item.label} className="flex gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                    <div>
                      <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                      <span className="text-xs text-slate-500 ml-1">{item.desc}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 pt-1 border-t border-slate-100 mt-2">
                  Community stats are anonymized aggregates — no userId is stored in that table.
                </p>
              </div>
            )}
          </div>

          {/* Tracking toggle */}
          <div className="border border-slate-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-grow min-w-0 mr-4">
                <p className="text-sm font-semibold text-slate-800">Study progress tracking</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  When enabled, your performance data is saved to Cloudflare D1 so adaptive learning, spaced repetition, and cross-session dedup work. When disabled, only local session data is kept.
                </p>
              </div>
              <button
                onClick={handleTrackingToggle}
                disabled={!!loading}
                className="flex-shrink-0 transition-colors"
                aria-label={trackingOn ? 'Disable tracking' : 'Enable tracking'}
              >
                {trackingOn
                  ? <ToggleRight className="w-10 h-10 text-indigo-600" />
                  : <ToggleLeft  className="w-10 h-10 text-slate-400" />
                }
              </button>
            </div>

            {/* Keep or delete choice */}
            {showKeepOrDelete && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in">
                <p className="text-xs font-semibold text-amber-800 mb-3">
                  What should happen to your existing data?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleKeepData}
                    disabled={!!loading}
                    className="flex-1 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Keep it
                  </button>
                  <button
                    onClick={handleDeleteExistingData}
                    disabled={!!loading}
                    className="flex-1 py-2 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    {loading === 'toggle'
                      ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</>
                      : 'Delete it'
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Download */}
          <div className="border border-slate-100 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Download my data</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Export everything stored about you as a JSON file. Right to data portability under GDPR Art. 20 and PDPA.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'download'
                ? <><div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Downloading...</>
                : <><Download className="w-4 h-4" /> Download my data</>
              }
            </button>
          </div>

          {/* Delete all */}
          <div className="border border-red-100 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Delete all my data</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Permanently erases all data stored about you in Cloudflare D1 and clears your browser storage. Right to erasure under GDPR Art. 17, PDPA, and CCPA. This cannot be undone.
                </p>
              </div>
            </div>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={!!loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
              >
                Delete all my data
              </button>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  This will permanently delete your adaptive profile, wrong answer bank, seen concepts, and usage data. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={!!loading}
                    className="flex-1 py-2.5 text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    disabled={!!loading}
                    className="flex-1 py-2.5 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading === 'delete'
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</>
                      : <><Trash2 className="w-4 h-4" /> Yes, delete everything</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Legal note */}
          <p className="text-xs text-slate-400 text-center pb-1 leading-relaxed">
            Data is processed under your consent given at first use. You may withdraw at any time using the controls above. Covered under GDPR (EU), PDPA (Philippines RA 10173), and CCPA (California).
          </p>

        </div>
      </div>
    </div>
  );
}
