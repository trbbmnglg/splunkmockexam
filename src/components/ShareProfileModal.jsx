/**
 * src/components/ShareProfileModal.jsx
 *
 * Changes in this version:
 *   - Added tracking-off warning banner. When tracking is disabled,
 *     D1 has no data to transfer. QR code still generates (userId
 *     transfers), but user is informed that study data won't come with it.
 */

import { useState, useEffect } from 'react';
import { X, QrCode, Copy, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import QRCode from 'react-qr-code';
import { encryptUserId } from '../utils/qrCrypto';
import { getUserId } from '../utils/agentAdaptive';
import { isTrackingEnabled } from '../utils/privacyToken';

const BASE_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:5173'
  : 'https://splunkmockexam.gtaad-innovations.com';

export default function ShareProfileModal({ onClose }) {
  const [qrUrl,    setQrUrl]    = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const trackingOn = isTrackingEnabled();

  useEffect(() => {
    let cancelled = false;
    async function build() {
      try {
        const userId    = getUserId();
        const encrypted = await encryptUserId(userId);
        if (!encrypted) throw new Error('Encryption returned null');
        const url = `${BASE_URL}/?uid=${encrypted}`;
        if (!cancelled) { setQrUrl(url); setLoading(false); }
      } catch (e) {
        console.error('[ShareModal] Failed to build QR URL:', e.message);
        if (!cancelled) { setError(true); setLoading(false); }
      }
    }
    build();
    return () => { cancelled = true; };
  }, []);

  const handleCopy = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = qrUrl;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white max-w-md w-full shadow-2xl rounded-xl animate-fade-in border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Continue on another device</h3>
              <p className="text-xs text-slate-500 mt-0.5">Scan to transfer your study profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">

          {/* Tracking-off warning — shown when tracking is disabled */}
          {!trackingOn && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-0.5">Tracking is disabled</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Your adaptive profile and wrong answer bank are not saved to our servers.
                  Scanning this QR code will only transfer your anonymous ID — study data won't follow.
                  Enable tracking in <span className="font-semibold">Config → Advanced Settings</span> to transfer full study progress.
                </p>
              </div>
            </div>
          )}

          {/* QR code area */}
          <div className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl p-6 min-h-[220px]">
            {loading && (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-pink-500 rounded-full animate-spin" />
                <span className="text-xs">Generating secure link...</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center gap-2 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <span className="text-xs text-center">Could not generate QR code.<br />Please try again.</span>
              </div>
            )}
            {!loading && !error && qrUrl && (
              <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                <QRCode value={qrUrl} size={180} level="M" style={{ display: 'block' }} />
              </div>
            )}
          </div>

          {/* What transfers */}
          <div className={`rounded-lg px-4 py-3 border ${trackingOn ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Info className={`w-3.5 h-3.5 flex-shrink-0 ${trackingOn ? 'text-indigo-500' : 'text-slate-400'}`} />
              <p className={`text-xs font-semibold ${trackingOn ? 'text-indigo-800' : 'text-slate-600'}`}>
                What transfers to the new device
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: 'Adaptive learning profile', enabled: trackingOn },
                { label: 'Wrong answer bank',         enabled: trackingOn },
                { label: 'Seen concepts (dedup)',      enabled: trackingOn },
                { label: 'Daily usage count',          enabled: trackingOn },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.enabled ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                  <span className={`text-xs ${item.enabled ? 'text-indigo-700' : 'text-slate-400 line-through'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">API keys are not transferred for security.</p>
          </div>

          {/* Copy link fallback */}
          <button
            onClick={handleCopy}
            disabled={!qrUrl || loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all border
              ${copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : !qrUrl || loading
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
          >
            {copied
              ? <><CheckCircle className="w-4 h-4" /> Link copied!</>
              : <><Copy className="w-4 h-4" /> Copy link instead</>
            }
          </button>

          <p className="text-center text-xs text-slate-400">
            This link expires in 24 hours. Scan with your phone camera or any QR reader.
          </p>
        </div>

      </div>
    </div>
  );
}
