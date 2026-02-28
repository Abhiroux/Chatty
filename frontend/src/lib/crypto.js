// crypto.js - End-to-End Encryption Utilities using Web Crypto API

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// ═══════════════════════════════════════════════════════════════
// RSA KEY PAIR GENERATION
// ═══════════════════════════════════════════════════════════════

// Generate new RSA-OAEP key pair for a user
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return { publicKeyJwk, privateKeyJwk };
}

// ═══════════════════════════════════════════════════════════════
// LOCAL PRIVATE KEY STORAGE (localStorage)
// ═══════════════════════════════════════════════════════════════

// Store private key locally in localStorage
export function storePrivateKey(userId, privateKeyJwk) {
  localStorage.setItem(`privateKey_${userId}`, JSON.stringify(privateKeyJwk));
}

// Retrieve local private key from localStorage and import as CryptoKey
export async function getLocalPrivateKey(userId) {
  const keyStr = localStorage.getItem(`privateKey_${userId}`);
  if (!keyStr) return null;
  const jwk = JSON.parse(keyStr);
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC KEY IMPORT
// ═══════════════════════════════════════════════════════════════

// Import a public key (from the server / another user)
export async function importPublicKey(publicKeyJwkOrStr) {
  let jwk = publicKeyJwkOrStr;
  if (typeof publicKeyJwkOrStr === "string") {
    jwk = JSON.parse(publicKeyJwkOrStr);
  }
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// ═══════════════════════════════════════════════════════════════
// AES SESSION KEY (per-message encryption)
// ═══════════════════════════════════════════════════════════════

// Generate an AES-GCM session key (used to encrypt a single message)
export async function generateSessionKey() {
  return window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt plaintext string with AES-GCM session key
export async function encryptText(text, sessionKey) {
  const enc = new TextEncoder();
  const encoded = enc.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipherText = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sessionKey,
    encoded
  );

  return {
    cipherText: arrayBufferToBase64(cipherText),
    iv: arrayBufferToBase64(iv),
  };
}

// Decrypt ciphertext with AES-GCM session key
export async function decryptText(cipherTextBase64, ivBase64, sessionKey) {
  const cipherText = base64ToArrayBuffer(cipherTextBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      sessionKey,
      cipherText
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Encrypted Message]";
  }
}

// Encrypt the AES session key using an RSA public key (for secure key exchange)
export async function encryptSessionKey(sessionKey, publicKey) {
  const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawSessionKey
  );
  return arrayBufferToBase64(encryptedKey);
}

// Decrypt the AES session key using the local RSA private key
export async function decryptSessionKey(encryptedSessionKeyBase64, privateKey) {
  const encryptedKeyBuf = base64ToArrayBuffer(encryptedSessionKeyBase64);
  try {
    const rawSessionKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKeyBuf
    );
    return window.crypto.subtle.importKey(
      "raw",
      rawSessionKey,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Failed to decrypt session key:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD-BASED KEY WRAPPING (PBKDF2 + AES-KW)
// Enables recovering the RSA private key from the server using
// only the user's login password. The server never sees the
// plaintext private key.
// ═══════════════════════════════════════════════════════════════

/**
 * Derive a 256-bit AES-KW wrapping key from a password + salt using PBKDF2.
 * @param {string} password - The user's login password
 * @param {Uint8Array} salt - A random 16-byte salt
 * @returns {Promise<CryptoKey>} - An AES-KW key for wrapping/unwrapping
 */
export async function deriveWrappingKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 600000, // OWASP recommendation for PBKDF2-SHA256
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Wrap (encrypt) the RSA private key with a password-derived key.
 * Returns the encrypted blob + salt as Base64 strings for server storage.
 *
 * @param {Object} privateKeyJwk - The RSA private key in JWK format
 * @param {string} password - The user's login password
 * @returns {Promise<{encryptedPrivateKey: string, keySalt: string}>}
 */
export async function wrapPrivateKey(privateKeyJwk, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await deriveWrappingKey(password, salt);

  const enc = new TextEncoder();
  const privateKeyData = enc.encode(JSON.stringify(privateKeyJwk));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    privateKeyData
  );

  // Combine iv + encryptedData into a single buffer for storage
  const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return {
    encryptedPrivateKey: arrayBufferToBase64(combined.buffer),
    keySalt: arrayBufferToBase64(salt.buffer),
  };
}

/**
 * Unwrap (decrypt) the RSA private key using the password-derived key.
 *
 * @param {string} encryptedPrivateKeyBase64 - The encrypted private key from server
 * @param {string} keySaltBase64 - The salt from server
 * @param {string} password - The user's login password
 * @returns {Promise<Object|null>} - The RSA private key JWK, or null on failure
 */
export async function unwrapPrivateKey(encryptedPrivateKeyBase64, keySaltBase64, password) {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(keySaltBase64));
    const wrappingKey = await deriveWrappingKey(password, salt);

    const combined = new Uint8Array(base64ToArrayBuffer(encryptedPrivateKeyBase64));
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      wrappingKey,
      encryptedData
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedData));
  } catch (error) {
    console.error("Failed to unwrap private key:", error);
    return null;
  }
}
