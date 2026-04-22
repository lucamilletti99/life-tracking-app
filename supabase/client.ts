import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAnonKey, supabaseUrl } from "./config";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  browserClient ??= createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

export const supabase = getSupabaseBrowserClient();
