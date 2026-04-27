import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAnonKey, supabaseUrl } from "./config";
import { createSupabaseLoggingFetch } from "./logging";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  browserClient ??= createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: createSupabaseLoggingFetch(fetch),
    },
  });
  return browserClient;
}

export const supabase = getSupabaseBrowserClient();
