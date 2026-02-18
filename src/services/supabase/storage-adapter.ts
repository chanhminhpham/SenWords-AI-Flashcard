import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple Supabase storage adapter using plain AsyncStorage.
 *
 * NOTE: This stores session tokens in plain text (base64).
 * For production, consider using SecureStore or encryption.
 * However, Supabase JWTs are already signed and time-limited.
 */
export const SupabaseStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    console.log('[StorageAdapter] Getting item:', key);
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log('[StorageAdapter] Item found, length:', value.length);
      } else {
        console.log('[StorageAdapter] No item found');
      }
      return value;
    } catch (error) {
      console.error('[StorageAdapter] Failed to get item:', error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    console.log('[StorageAdapter] Setting item:', key, 'length:', value.length);
    try {
      await AsyncStorage.setItem(key, value);
      console.log('[StorageAdapter] Successfully stored item');
    } catch (error) {
      console.error('[StorageAdapter] Failed to store item:', error);
      throw error;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    console.log('[StorageAdapter] Removing item:', key);
    try {
      await AsyncStorage.removeItem(key);
      console.log('[StorageAdapter] Successfully removed item');
    } catch (error) {
      console.error('[StorageAdapter] Failed to remove item:', error);
      throw error;
    }
  },
};
