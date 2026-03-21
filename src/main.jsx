import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { decryptUserId } from './utils/qrCrypto.js';

/**
 * On app load, check for ?uid= in the URL.
 * If present, decrypt it and write to localStorage as the user's ID.
 * Then strip the param from the URL so it doesn't linger in the address bar.
 * If decryption fails (tampered / expired), silently ignore — existing ID kept.
 */
async function handleIncomingUid() {
  const params = new URLSearchParams(window.location.search);
  const encryptedUid = params.get('uid');
  if (!encryptedUid) return;

  const userId = await decryptUserId(encryptedUid);

  if (userId) {
    try {
      localStorage.setItem('splunkUserId', userId);
      console.info('[QR] Profile transferred — userId written to localStorage');
    } catch {
      console.warn('[QR] Could not write userId to localStorage');
    }
  }

  // Strip ?uid= from URL regardless of success — clean address bar
  params.delete('uid');
  const newSearch = params.toString();
  const cleanUrl  = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
  window.history.replaceState({}, '', cleanUrl);
}

// Run before React mounts so the userId is in localStorage before
// getUserId() is called anywhere in the app
handleIncomingUid().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
