import { NextResponse } from "next/server";

import { resolvePostLoginPath } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = resolvePostLoginPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] session exchange failed", error);
      return NextResponse.redirect(new URL("/login", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
