import AsyncStorage from '@react-native-async-storage/async-storage';

import { SupabaseStorageAdapter } from '@/services/supabase/storage-adapter';

// Mock AsyncStorage (mock provided by moduleNameMapper in jest.config.js)

describe('SupabaseStorageAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('stores data in AsyncStorage', async () => {
      await SupabaseStorageAdapter.setItem('test-key', 'test-value');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('logs storage operation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await SupabaseStorageAdapter.setItem('key', 'value');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[StorageAdapter] Setting item:',
        'key',
        'length:',
        5
      );
      expect(consoleSpy).toHaveBeenCalledWith('[StorageAdapter] Successfully stored item');

      consoleSpy.mockRestore();
    });
  });

  describe('getItem', () => {
    it('returns null for non-existent keys', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await SupabaseStorageAdapter.getItem('missing-key');

      expect(result).toBeNull();
    });

    it('retrieves stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-value');

      const result = await SupabaseStorageAdapter.getItem('test-key');

      expect(result).toBe('test-value');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('returns null on retrieval error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await SupabaseStorageAdapter.getItem('error-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[StorageAdapter] Failed to get item:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('removes entry from AsyncStorage', async () => {
      await SupabaseStorageAdapter.removeItem('test-key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('logs removal operation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await SupabaseStorageAdapter.removeItem('key');

      expect(consoleSpy).toHaveBeenCalledWith('[StorageAdapter] Removing item:', 'key');
      expect(consoleSpy).toHaveBeenCalledWith('[StorageAdapter] Successfully removed item');

      consoleSpy.mockRestore();
    });
  });
});
