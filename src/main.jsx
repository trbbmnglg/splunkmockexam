import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { decryptUserId } from './utils/qrCrypto.js';

const USER_ID_KEY = 'splunkUserId';
const PROFILE_KEY = 'splunkAdaptiveProfile';

/**
 * On app load, check for ?uid= in the URL.
 * If present, decrypt it and either apply immediately (no existing profile)
 * or defer to React for a collision-resolution modal.
 * Returns transfer state for App to consume.
 */
async function handleIncomingUid() {
  const params = new URLSearchParams(window.location.search);
  const encryptedUid = params.get('uid');

  // Strip ?uid= from URL regardless — clean address bar
  if (encryptedUid) {
    params.delete('uid');
    const newSearch = params.toString();
    const cleanUrl  = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
  }

  if (!encryptedUid) return null;

  const incomingUserId = await decryptUserId(encryptedUid);
  if (!incomingUserId) return null;

  const existingUserId = localStorage.getItem(USER_ID_KEY);
  const existingProfile = localStorage.getItem(PROFILE_KEY);
  const hasExistingData = existingUserId && existingUserId !== incomingUserId && existingProfile && existingProfile !== '{}';

  if (hasExistingData) {
    // Collision — let React handle with a modal
    return { incomingUserId, existingUserId, collision: true };
  }

  // No collision — apply immediately
  try {
    localStorage.setItem(USER_ID_KEY, incomingUserId);
    console.info('[QR] Profile transferred — userId written to localStorage');
  } catch {
    console.warn('[QR] Could not write userId to localStorage');
    return null;
  }
  return { incomingUserId, collision: false };
}

// Run before React mounts so the userId is in localStorage before
// getUserId() is called anywhere in the app
handleIncomingUid().then((transferState) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App transferState={transferState} />
    </React.StrictMode>,
  );
});
