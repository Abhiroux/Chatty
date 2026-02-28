// crypto.js - End-to-End Encryption Utilities using Web Crypto API

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

// Store private key locally
export function storePrivateKey(userId, privateKeyJwk) {
  localStorage.setItem(`privateKey_${userId}`, JSON.stringify(privateKeyJwk));
}

// Retrieve local private key
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

// Import a public key (from the server)
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

// Generate an AES-GCM session key
export async function generateSessionKey() {
  return window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt string with AES-GCM session key
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

// Decrypt string with AES-GCM session key
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

// Encrypt the AES session key using an RSA public key
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
