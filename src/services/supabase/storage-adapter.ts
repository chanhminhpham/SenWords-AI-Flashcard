import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_ALIAS = 'sb_enc_key';
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

// ── Base64 helpers (ArrayBuffer ↔ base64) ───────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Key management ──────────────────────────────────────────

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = await SecureStore.getItemAsync(KEY_ALIAS);

  if (stored) {
    const raw = base64ToUint8Array(stored);
    return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
  }

  const raw = Crypto.getRandomBytes(32);
  await SecureStore.setItemAsync(KEY_ALIAS, uint8ArrayToBase64(raw));
  return crypto.subtle.importKey(
    'raw',
    new Uint8Array(raw).buffer as ArrayBuffer,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt / Decrypt ───────────────────────────────────────

async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = Crypto.getRandomBytes(IV_LENGTH);
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encoded
  );

  // Format: base64(iv + ciphertext + authTag)
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);

  return uint8ArrayToBase64(combined);
}

async function decrypt(cipherB64: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = base64ToUint8Array(cipherB64);

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ── Supabase Storage Adapter ────────────────────────────────

export const SupabaseStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    try {
      return await decrypt(encrypted);
    } catch {
      // Corrupted data or key rotation — clear the entry
      await AsyncStorage.removeItem(key);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const encrypted = await encrypt(value);
    await AsyncStorage.setItem(key, encrypted);
  },

  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
};
