import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { SupabaseStorageAdapter } from '@/services/supabase/storage-adapter';

// Mock native dependencies (AsyncStorage mock provided by moduleNameMapper)
jest.mock('expo-secure-store');
jest.mock('expo-crypto');

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockCrypto = Crypto as jest.Mocked<typeof Crypto>;

// Mock Web Crypto API
const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();
const mockImportKey = jest.fn();

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
      importKey: mockImportKey,
    },
  },
});

// Mock btoa/atob
global.btoa = jest.fn((str: string) => Buffer.from(str, 'binary').toString('base64'));
global.atob = jest.fn((str: string) => Buffer.from(str, 'base64').toString('binary'));

describe('SupabaseStorageAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no existing key in SecureStore
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue();

    // Mock random bytes
    mockCrypto.getRandomBytes.mockReturnValue(new Uint8Array(32).fill(1));

    // Mock CryptoKey
    const mockKey = {} as CryptoKey;
    mockImportKey.mockResolvedValue(mockKey);

    // Mock encrypt to return predictable data
    mockEncrypt.mockResolvedValue(new ArrayBuffer(48));
    mockDecrypt.mockResolvedValue(new TextEncoder().encode('test-value').buffer);
  });

  describe('setItem', () => {
    it('encrypts and stores data in AsyncStorage', async () => {
      await SupabaseStorageAdapter.setItem('test-key', 'test-value');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', expect.any(String));
      expect(mockEncrypt).toHaveBeenCalled();
    });

    it('generates encryption key on first use', async () => {
      await SupabaseStorageAdapter.setItem('key', 'value');

      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('sb_enc_key');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('sb_enc_key', expect.any(String));
      expect(mockImportKey).toHaveBeenCalledWith('raw', expect.any(ArrayBuffer), 'AES-GCM', false, [
        'encrypt',
        'decrypt',
      ]);
    });

    it('reuses existing key from SecureStore', async () => {
      const existingKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(2)));
      mockSecureStore.getItemAsync.mockResolvedValue(existingKey);

      await SupabaseStorageAdapter.setItem('key', 'value');

      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('getItem', () => {
    it('returns null for non-existent keys', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await SupabaseStorageAdapter.getItem('missing-key');

      expect(result).toBeNull();
      expect(mockDecrypt).not.toHaveBeenCalled();
    });

    it('decrypts stored data', async () => {
      const fakeEncrypted = btoa(String.fromCharCode(...new Uint8Array(48).fill(0)));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(fakeEncrypted);

      const result = await SupabaseStorageAdapter.getItem('test-key');

      expect(result).toBe('test-value');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('returns null and clears entry on decryption failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('corrupted-data');
      (global.atob as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid base64');
      });

      const result = await SupabaseStorageAdapter.getItem('bad-key');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('bad-key');
    });
  });

  describe('removeItem', () => {
    it('removes entry from AsyncStorage', async () => {
      await SupabaseStorageAdapter.removeItem('test-key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });
});
