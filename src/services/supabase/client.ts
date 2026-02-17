import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ENV } from '@/config/env';
import { SupabaseStorageAdapter } from '@/services/supabase/storage-adapter';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        storage: SupabaseStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'implicit', // Changed from 'pkce' - implicit flow doesn't need crypto.subtle
      },
    });
  }
  return _supabase;
}
