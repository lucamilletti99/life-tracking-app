"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatErrorDetails } from "@/lib/error-formatting";
import { getSupabaseBrowserClient } from "@/supabase/client";

interface LoginCardProps {
  nextPath: string;
}

/**
 * Detects whether the code is running inside a Capacitor native shell.
 * We do a lazy import so the @capacitor/core package is only loaded on native —
 * on the web it simply returns false.
 */
async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function LoginCard({ nextPath }: LoginCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinueWithGoogle() {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const native = await isNativeApp();

      // On native (Capacitor), the redirect URL must use the custom URL scheme
      // so that Safari hands control back to the app after OAuth.
      // On web, we redirect back to the same origin as usual.
      const redirectTo = native
        ? "com.lucamilletti.trackr://auth/callback"
        : new URL("/auth/callback", window.location.origin).toString();

      const redirectWithNext = new URL(redirectTo);
      redirectWithNext.searchParams.set("next", nextPath);

      if (native) {
        // Use @capacitor/browser to open the OAuth flow in the real Safari browser.
        // Google/GitHub block OAuth inside WebViews — Safari is required.
        const { Browser } = await import("@capacitor/browser");

        const { data, error: authError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectWithNext.toString(),
            skipBrowserRedirect: true, // Don't let Supabase redirect — we do it via Browser
          },
        });

        if (authError) throw authError;
        if (data.url) {
          await Browser.open({ url: data.url, windowName: "_self" });
        }
      } else {
        // Standard web flow: Supabase redirects the tab to Google, then back.
        const { data, error: authError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirectWithNext.toString() },
        });

        if (authError) throw authError;
        if (data.url) window.location.assign(data.url);
      }
    } catch (err) {
      console.error("[auth] sign in failed", formatErrorDetails(err));
      setError("Could not start Google login. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
        <span className="text-metric text-[13px] font-medium tracking-tight text-ink">
          trackr.
        </span>
      </div>

      <p className="text-eyebrow">Welcome back</p>
      <h1 className="text-display-sm mt-2 text-[36px] leading-[1.1] text-ink">
        A quieter way to track your life.
      </h1>
      <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">
        Calendar, goals, and habits — one surface, no noise. Sign in to pick up where
        you left off.
      </p>

      <Button
        type="button"
        className="mt-8 h-10 w-full text-[13px]"
        onClick={() => void handleContinueWithGoogle()}
        disabled={loading}
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>

      {error && (
        <p className="mt-3 text-[12px] text-destructive" role="alert">
          {error}
        </p>
      )}

      <p className="mt-10 text-[11px] text-ink-subtle">
        By continuing, you agree to keep showing up — gently, imperfectly, and on your own terms.
      </p>
    </div>
  );
}
