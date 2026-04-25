import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

let browserSupabaseClient: any = null;

export function createBrowserSupabaseClient(): any {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  const { url, anonKey } = getSupabaseBrowserEnv();

  browserSupabaseClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserSupabaseClient;
}
