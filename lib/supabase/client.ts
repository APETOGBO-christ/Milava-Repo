import { createClient } from '@supabase/supabase-js';
import { getSupabaseBrowserEnv } from '@/lib/supabase/env';

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
