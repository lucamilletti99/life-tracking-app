"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { formatErrorDetails } from "@/lib/error-formatting";
import { getSupabaseBrowserClient } from "@/supabase/client";
import { resolvePostLoginPath } from "@/lib/auth/session";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function exchange() {
      const supabase = getSupabaseBrowserClient();
      const code = searchParams.get("code");
      const next = resolvePostLoginPath(searchParams.get("next"));

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback] session exchange failed", formatErrorDetails(error));
          router.replace("/login");
          return;
        }
      }

      // Whether we exchanged a code or Supabase auto-handled a hash token,
      // navigate to the intended destination.
      router.replace(next);
    }

    void exchange();
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ember" aria-hidden />
        <p className="text-[13px] text-ink-muted">Signing you in…</p>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
