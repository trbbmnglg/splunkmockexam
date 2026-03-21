/**
 * src/utils/qrCrypto.js
 *
 * Encrypts / decrypts the userId for safe URL embedding in QR codes.
 * Uses browser-native crypto.subtle (AES-GCM) — zero extra dependencies.
 *
 * Flow:
 *   encryptUserId(userId) → base64url string  → goes into ?uid= param
 *   decryptUserId(param)  → userId string      → written to localStorage
 *
 * The encrypted payload is:  iv (12 bytes) + ciphertext + timestamp (8 bytes)
 * This allows optional expiry checks on the receiving end.
 *
 * Env var required:
 *   VITE_QR_SECRET=some-long-random-passphrase
 *   Add to .env.local and Cloudflare Pages environment variables.
 */

const PASSPHRASE  = import.meta.env.VITE_QR_SECRET || 'splunk-mocktest-default-secret';
const SALT        = 'splunk-mocktest-qr-salt-v1';   // fixed, non-secret
const EXPIRY_MS   = 24 * 60 * 60 * 1000;            // 24 hours

// ── Key derivation ────────────────────────────────────────────────────────────
async function deriveKey() {
  const enc      = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(PASSPHRASE),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       enc.encode(SALT),
      iterations: 100_000,
      hash:       'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── base64url helpers ─────────────────────────────────────────────────────────
function toBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary  = atob(base64);
  const bytes   = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ── encryptUserId ─────────────────────────────────────────────────────────────
export async function encryptUserId(userId) {
  try {
    const key = await deriveKey();
    const enc  = new TextEncoder();

    // Pack: userId + '|' + timestamp
    const timestamp = Date.now().toString();
    const payload   = enc.encode(`${userId}|${timestamp}`);

    // Random 12-byte IV — unique per encryption
    const iv         = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      payload
    );

    // Combine iv + ciphertext into one buffer
    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);

    return toBase64url(combined.buffer);
  } catch (e) {
    console.error('[QR] Encryption failed:', e.message);
    return null;
  }
}

// ── decryptUserId ─────────────────────────────────────────────────────────────
export async function decryptUserId(param) {
  try {
    const key      = await deriveKey();
    const combined = new Uint8Array(fromBase64url(param));

    // Split iv (first 12 bytes) + ciphertext (rest)
    const iv         = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoded = new TextDecoder().decode(plaintext);
    const [userId, timestampStr] = decoded.split('|');

    if (!userId || !timestampStr) return null;

    // Expiry check — reject links older than 24 hours
    const age = Date.now() - parseInt(timestampStr, 10);
    if (age > EXPIRY_MS) {
      console.warn('[QR] Link expired — older than 24 hours');
      return null;
    }

    return userId;
  } catch (e) {
    // Silently ignore — tampered, malformed, or wrong secret
    console.warn('[QR] Decryption failed (tampered or expired link)');
    return null;
  }
}
