const PBKDF2_ITERATIONS = 120000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BITS = 128;

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

export function saltToBytes(saltFromServer) {
  if (!saltFromServer) return new Uint8Array(SALT_BYTES);
  if (saltFromServer.length === 32 && /^[0-9a-fA-F]+$/.test(saltFromServer)) return hexToBytes(saltFromServer);
  try {
    return fromBase64(saltFromServer);
  } catch {
    return new TextEncoder().encode(saltFromServer).slice(0, SALT_BYTES);
  }
}

export async function deriveKey(password, saltFromServer) {
  const salt = saltToBytes(saltFromServer);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BYTES * 8
  );
  return crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(plainText, key) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_BITS },
    key,
    enc.encode(plainText)
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return toBase64(combined);
}

export async function decrypt(base64Cipher, key) {
  const combined = fromBase64(base64Cipher);
  if (combined.length < IV_BYTES + 16) throw new Error('Geçersiz şifreli veri');
  const iv = combined.slice(0, IV_BYTES);
  const cipher = combined.slice(IV_BYTES);
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_BITS },
    key,
    cipher
  );
  return new TextDecoder().decode(dec);
}

export function generateSaltForRegister() {
  const bytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return btoa(String.fromCharCode(...bytes));
}
