"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/supabase/client";

interface LoginCardProps {
  nextPath: string;
}

export function LoginCard({ nextPath }: LoginCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinueWithGoogle() {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", nextPath);

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (authError) throw authError;
      if (data.url) window.location.assign(data.url);
    } catch (err) {
      console.error(err);
      setError("Could not start Google login. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-neutral-900">Sign in to Trackr</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Continue with Google to access your personal calendar, goals, and habits.
      </p>

      <Button
        type="button"
        className="mt-6 w-full"
        onClick={() => void handleContinueWithGoogle()}
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Continue with Google"}
      </Button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
