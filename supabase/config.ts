export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";

export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "example-anon-key";
