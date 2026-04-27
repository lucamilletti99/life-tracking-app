// This file contained a server-side session refresh helper (updateSession) that
// was used by a Next.js middleware for SSR deployments.
//
// It is intentionally unused in the static-export / Capacitor build.
// Auth is handled entirely client-side via supabase/client.ts.
// The next/server imports have been removed so Turbopack does not
// include this file in the middleware bundle.
export {};
