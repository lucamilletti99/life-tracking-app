// proxy.ts — intentionally a no-op for the static-export / Capacitor build.
//
// Auth is handled entirely client-side via supabase/client.ts.
// Server-side session refresh (updateSession) was removed when the project
// was migrated to a static export for Capacitor. This file is kept so that
// Next.js 16 continues to pick it up as the middleware entry point and
// applies the matcher config, but all requests are passed through unchanged.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/today",
    "/calendar/:path*",
    "/goals/:path*",
    "/habits/:path*",
    "/analytics/:path*",
    "/login",
    "/auth/callback",
  ],
};
